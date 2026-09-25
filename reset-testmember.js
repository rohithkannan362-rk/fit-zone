import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://brlvzobizijmwctirjhm.supabase.co',
  'sb_publishable_YcXiw40Al9xjCCEuNQxhTQ_RwchKuOa'
);

async function run() {
  // Try to delete TXN_TEST123 directly
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('provider_payment_id', 'TXN_TEST123');
    
  if (error) {
    console.error('Failed to delete TXN_TEST123:', error.message);
  } else {
    console.log('Successfully deleted TXN_TEST123 payments');
  }

  // Also delete any payments for testmember that are 'pending' or 'submitted' 
  // but NOT the ones we are supposed to keep.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'testmember@fitzone.com')
    .single();

  if (profiles) {
    const { error: err2 } = await supabase
      .from('payments')
      .delete()
      .eq('member_id', profiles.id)
      .in('status', ['pending', 'submitted'])
      .not('provider_payment_id', 'in', '("TXN_REJECT","TXN_VERIFY","TXN_RENEW")');

    if (err2) {
      console.error('Failed to clean up pending/submitted:', err2.message);
    } else {
      console.log('Successfully cleaned up testmember pending/submitted payments');
    }
  }
}

run().catch(console.error);
