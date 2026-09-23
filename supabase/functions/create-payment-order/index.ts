// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { packageId } = await req.json();
    if (!packageId) {
      throw new Error('Package ID is required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the package details
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true)
      .single();

    if (pkgError || !pkg) {
      throw new Error('Invalid or inactive package');
    }

    // Determine currently active membership (if any) to link this payment
    const { data: activeMembership } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('member_id', user.id)
      .in('status', ['active', 'paused'])
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch settings to get currency securely from backend
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('currency')
      .limit(1)
      .single();

    // The amount comes from the database, NOT the client
    const amount = pkg.price;
    const currency = settings?.currency || 'INR';

    // In a real integration, we'd call Razorpay API here
    const providerOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the payment record in pending state
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        member_id: user.id,
        membership_id: activeMembership?.id || null,
        package_id: pkg.id,
        package_name: pkg.name,
        amount: amount,
        currency: currency,
        provider: 'razorpay',
        provider_order_id: providerOrderId,
        status: 'pending',
        method: 'upi',
        payment_date: new Date().toISOString(),
        created_by: user.id
      })
      .select('id')
      .single();

    if (paymentError) {
      throw new Error('Failed to create payment record');
    }

    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        providerOrderId: providerOrderId,
        amount: amount,
        currency: currency,
        provider: 'razorpay',
        keyId: Deno.env.get('PAYMENT_GATEWAY_KEY_ID') || 'rzp_test_mockkey'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
