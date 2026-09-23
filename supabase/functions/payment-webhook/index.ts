// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// We use WebCrypto for signature verification in Deno Edge Functions
// Razorpay signs payloads using HMAC-SHA256

serve(async (req) => {
  try {
    const signature = req.headers.get('X-Razorpay-Signature');
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret is not configured');
    }

    // Razorpay Webhook Signature Verification
    // Uses standard WebCrypto API available natively in Deno
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', 
      encoder.encode(webhookSecret), 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['sign', 'verify']
    );
    const expectedSigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    
    // Convert buffer to hex
    const expectedSigHex = Array.from(new Uint8Array(expectedSigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    if (expectedSigHex !== signature) {
      throw new Error('Invalid signature');
    }

    // For safety, only process payment.captured or payment.failed
    const event = payload.event;
    if (event !== 'payment.captured' && event !== 'payment.failed' && event !== 'order.paid') {
      return new Response(JSON.stringify({ status: 'ignored' }), { status: 200 });
    }

    // Extract identifiers
    const paymentEntity = payload.payload?.payment?.entity || {};
    const providerOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
    const providerPaymentId = paymentEntity.id;
    const isSuccess = event === 'payment.captured' || event === 'order.paid';

    if (!providerOrderId) {
      throw new Error('No order ID found in webhook');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (isSuccess) {
      // 2. Execute Atomic Payment -> Membership Transaction via RPC
      const { data: result, error: rpcError } = await supabaseAdmin.rpc('handle_successful_payment', {
        p_provider_order_id: providerOrderId,
        p_provider_payment_id: providerPaymentId || null
      });

      if (rpcError) {
        throw new Error('Atomic payment processing failed: ' + rpcError.message);
      }

      if (result.status === 'already processed') {
        return new Response(JSON.stringify({ status: 'already processed' }), { status: 200 });
      }
      
      // 3. Trigger email via another abstraction (Mocked)
      // TODO: Configure actual Email Provider (e.g. Resend, SendGrid)
      // sendEmail({ member_id: payment.member_id, amount: payment.amount, ... })
    } else {
      // Handle failed payment
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('provider_order_id', providerOrderId)
        .single();
        
      if (payment && payment.status === 'pending') {
         await supabaseAdmin
          .from('payments')
          .update({
            status: 'failed',
            provider_payment_id: providerPaymentId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
      }
    }

    return new Response(JSON.stringify({ status: 'processed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
