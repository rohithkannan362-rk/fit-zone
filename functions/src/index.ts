import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();

// Initialize Razorpay instance
// In production, these should be stored in Firebase Secret Manager
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// 1. Create Razorpay Order
export const createPaymentOrder = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { amount, membershipId, packageId } = data;

  if (!amount || !membershipId || !packageId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${membershipId}_${Date.now()}`,
      payment_capture: 1, // auto capture
    };

    const order = await razorpay.orders.create(options);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create payment order');
  }
});

// 2. Razorpay Webhook Handler
export const razorpayWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  const signature = req.headers['x-razorpay-signature'];

  if (digest !== signature) {
    console.error('Invalid signature');
    res.status(400).send('Invalid signature');
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      
      // Find the payment record in Firestore by providerOrderId
      const paymentsRef = db.collection('payments');
      const snapshot = await paymentsRef.where('providerOrderId', '==', orderId).get();

      if (snapshot.empty) {
        console.error(`No payment record found for order ${orderId}`);
        res.status(404).send('Payment record not found');
        return;
      }

      const paymentDoc = snapshot.docs[0];
      const paymentData = paymentDoc.data();

      // Update payment record
      await paymentDoc.ref.update({
        status: 'success',
        providerPaymentId: payment.id,
        paymentDate: admin.firestore.FieldValue.serverTimestamp(),
        method: payment.method || 'online',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Activate membership
      if (paymentData.membershipId) {
        await db.collection('memberships').doc(paymentData.membershipId).update({
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;

      const paymentsRef = db.collection('payments');
      const snapshot = await paymentsRef.where('providerOrderId', '==', orderId).get();

      if (!snapshot.empty) {
        const paymentDoc = snapshot.docs[0];
        await paymentDoc.ref.update({
          status: 'failed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// 3. Daily Cron Job for Reminders
export const dailyReminderCron = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context: functions.EventContext) => {
    console.log('Running daily reminder cron...');

    try {
      // Get all active memberships
      const membershipsRef = db.collection('memberships');
      const snapshot = await membershipsRef
        .where('status', 'in', ['active', 'paused'])
        .get();

      const now = new Date();
      // Remove time component for day difference calculation
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const doc of snapshot.docs) {
        const membership = doc.data();
        
        // Skip if reminders are paused
        if (membership.reminderStatus === 'paused') {
          if (membership.reminderPausedUntil) {
            const pausedUntil = membership.reminderPausedUntil.toDate();
            if (pausedUntil > now) {
              continue; // Still paused
            } else {
              // Pause expired, resume reminders
              await doc.ref.update({
                reminderStatus: 'active',
                reminderPausedUntil: null,
                reminderPausedReason: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          } else {
            continue; // Paused indefinitely
          }
        }

        const nextDueDate = membership.nextDueDate.toDate();
        const dueDate = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate());
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let reminderType = null;

        // Determine which reminder to send based on days until due
        if (diffDays === 2) reminderType = '2_days_before';
        else if (diffDays === 1) reminderType = '1_day_before';
        else if (diffDays === 0) reminderType = 'due_today';
        else if (diffDays === -1) reminderType = '1_day_overdue';
        else if (diffDays === -2) reminderType = '2_days_overdue';
        else if (diffDays === -5) reminderType = '5_days_overdue';
        else if (diffDays === -7) reminderType = '7_days_overdue';

        if (reminderType) {
          // Check if this reminder was already sent
          const remindersSent = membership.remindersSent || {};
          // Use the due date as a unique key so we don't resend for the same billing cycle
          const billingCycleKey = nextDueDate.toISOString().split('T')[0];
          
          if (!remindersSent[billingCycleKey]) {
            remindersSent[billingCycleKey] = [];
          }

          if (!remindersSent[billingCycleKey].includes(reminderType)) {
            // Send the reminder (mock email logic for now)
            console.log(`Sending ${reminderType} reminder to member ${membership.memberId}`);
            
            // Log the reminder
            await db.collection('reminders').add({
              memberId: membership.memberId,
              membershipId: doc.id,
              type: reminderType,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'sent',
            });

            // Update membership to mark this reminder as sent
            remindersSent[billingCycleKey].push(reminderType);
            await doc.ref.update({
              remindersSent,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      console.log('Daily reminder cron finished successfully.');
    } catch (error) {
      console.error('Error in daily reminder cron:', error);
    }
    return null;
  });
