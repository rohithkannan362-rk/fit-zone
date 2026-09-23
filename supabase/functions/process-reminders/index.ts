// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendReminderEmail } from "./emailProvider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    // We use service role key because this is a privileged background task.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Auth Check: If invoked via HTTP, require a secret token. If invoked via pg_cron, it might not pass headers,
    // so we typically secure the endpoint with a CRON_SECRET or rely on Supabase Edge Function restrictions.
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[process-reminders] Starting execution...');

    // 2. Fetch memberships that could potentially need reminders
    // We exclude 'expired' because 7 days overdue is the max.
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('memberships')
      .select('*, profiles(full_name, member_code, email, mobile)')
      .in('status', ['active', 'due_soon', 'overdue']);

    if (memError) {
      throw new Error(`Failed to fetch memberships: ${memError.message}`);
    }
    
    // 3. Fetch gym settings (for email content)
    const { data: settings } = await supabaseAdmin.from('settings').select('*').limit(1).single();
    const gymName = settings?.gym_name || 'FitZone';
    const gymPhone = settings?.gym_phone || '';

    // Date Logic (Gym-local timezone: Asia/Kolkata)
    // We get the current date as a string in the IST timezone, then parse it back to a Date object at midnight
    const timeZone = 'Asia/Kolkata';
    
    // Get "today" at 00:00:00 in Asia/Kolkata
    const nowLocalStr = new Date().toLocaleString('en-US', { timeZone });
    const todayLocal = new Date(nowLocalStr);
    todayLocal.setHours(0, 0, 0, 0);

    let processedCount = 0;
    let errorsCount = 0;

    for (const membership of memberships) {
      // 4. Pause Logic evaluation
      if (membership.reminder_status === 'paused' && membership.reminder_paused_until) {
        const pauseDate = new Date(membership.reminder_paused_until);
        if (pauseDate > new Date()) {
          // Still paused, skip
          continue;
        } else {
          // Pause has expired! Automatic resume.
          await supabaseAdmin
            .from('memberships')
            .update({ reminder_status: 'active', reminder_paused_until: null, reminder_pause_reason: null })
            .eq('id', membership.id);
        }
      } else if (membership.reminder_status === 'paused' && !membership.reminder_paused_until) {
        // Paused indefinitely (though UI usually sets a date, handle edge case)
        continue;
      }

      // Calculate days difference purely based on the Asia/Kolkata calendar day
      const dueDateLocalStr = new Date(membership.next_due_date).toLocaleString('en-US', { timeZone });
      const nextDueDateLocal = new Date(dueDateLocalStr);
      nextDueDateLocal.setHours(0, 0, 0, 0);

      // Math.round handles daylight saving/leap year anomalies reliably when time is stripped
      const diffTime = nextDueDateLocal.getTime() - todayLocal.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // > 0 = future, < 0 = overdue

      let reminderType = null;
      if (diffDays === 2) reminderType = 'due_minus_2';
      else if (diffDays === 1) reminderType = 'due_minus_1';
      else if (diffDays === 0) reminderType = 'due_today';
      else if (diffDays === -1) reminderType = 'overdue_1';
      else if (diffDays === -2) reminderType = 'overdue_2';
      else if (diffDays === -5) reminderType = 'overdue_5';
      else if (diffDays === -7) reminderType = 'overdue_7';

      if (!reminderType) continue; // No reminder due today for this membership

      try {
        // 5. Database-level atomic claim (Idempotency)
        const { data: claimResult, error: claimError } = await supabaseAdmin.rpc('claim_reminder', {
          p_membership_id: membership.id,
          p_member_id: membership.member_id,
          p_reminder_type: reminderType
        });

        if (claimError) throw new Error(claimError.message);
        if (!claimResult.success) {
          // Already sent or claimed by concurrent execution
          continue; 
        }

        const reminderId = claimResult.reminder_id;

        // 6. Send Email via Provider with Deterministic Idempotency Key
        const idempotencyKey = `fitzone:${membership.id}:${reminderType}`;
        const emailResult = await sendReminderEmail({
          toEmail: membership.profiles.email,
          memberName: membership.profiles.full_name,
          memberCode: membership.profiles.member_code,
          packageName: membership.package_name,
          dueDate: new Date(membership.next_due_date).toLocaleDateString('en-IN', { timeZone }),
          reminderType: reminderType,
          gymName: gymName,
          gymPhone: gymPhone,
          idempotencyKey: idempotencyKey
        });

        // 7. Record result
        if (emailResult.success) {
          await supabaseAdmin
            .from('reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              provider_message_id: emailResult.messageId || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', reminderId);
          processedCount++;
        } else {
          // Failure: we mark as failed so it can be retried later
          await supabaseAdmin
            .from('reminders')
            .update({
              status: 'failed',
              error_message: emailResult.error || 'Unknown email provider error',
              updated_at: new Date().toISOString()
            })
            .eq('id', reminderId);
          errorsCount++;
        }
      } catch (err: any) {
        console.error(`[process-reminders] Error processing membership ${membership.id}:`, err);
        errorsCount++;
        // Continue processing others
      }
    }

    console.log(`[process-reminders] Finished. Processed: ${processedCount}. Errors: ${errorsCount}.`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount, 
      errors: errorsCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[process-reminders] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
