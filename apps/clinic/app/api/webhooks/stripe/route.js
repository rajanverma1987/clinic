/**
 * Stripe Webhook Handler
 * Handles Stripe payment events
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import connectDB from '@/lib/db/connection.js';
import Invoice from '@/models/Invoice.js';
import Payment from '@/models/Payment.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';
import { notifyPaymentReceived, notifyPaymentFailure } from '@/lib/realtime/integration-helpers.js';
import { logger } from '@/lib/utils/logger.js';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(req) {
  try {
    const stripe = getStripe();
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing signature' } },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    await connectDB();

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleChargeback(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 400 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  const { metadata } = paymentIntent;
  const invoiceId = metadata?.invoiceId;
  const tenantId = metadata?.tenantId;

  if (!invoiceId || !tenantId) {
    logger.error('Missing invoiceId or tenantId in payment metadata');
    return;
  }

  // Find invoice
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    logger.error('Invoice not found:', invoiceId);
    return;
  }

  // Create payment record
  const payment = await Payment.create({
    tenantId,
    invoiceId,
    patientId: invoice.patientId,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: 'card',
    status: 'completed',
    transactionId: paymentIntent.id,
    gateway: 'stripe',
    paidAt: new Date(paymentIntent.created * 1000),
  });

  // Update invoice
  invoice.paid += payment.amount;
  invoice.balance = invoice.total - invoice.paid;
  invoice.status = invoice.balance <= 0 ? 'paid' : 'partial';
  await invoice.save();

  // Emit real-time event
  await notifyPaymentReceived(tenantId, payment._id.toString(), payment);

  logger.info('✅ Payment processed:', payment.paymentNumber);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent) {
  const { metadata } = paymentIntent;
  const invoiceId = metadata?.invoiceId;
  const tenantId = metadata?.tenantId;

  if (invoiceId) {
    logger.info('❌ Payment failed for invoice:', invoiceId);
    let tid = tenantId;
    if (!tid) {
      const invoice = await Invoice.findById(invoiceId).select('tenantId').lean();
      tid = invoice?.tenantId?.toString?.();
    }
    if (tid) {
      await notifyPaymentFailure(tid, {
        paymentIntentId: paymentIntent.id,
        invoiceId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message,
      });
    }
  }
}

/**
 * Handle refund
 */
async function handleRefund(refund) {
  const chargeId = refund.charge;
  
  // Find payment by transaction ID
  const payment = await Payment.findOne({ transactionId: chargeId });
  if (payment) {
    payment.refunded = true;
    payment.refundAmount = refund.amount / 100;
    payment.refundDate = new Date(refund.created * 1000);
    await payment.save();

    // Update invoice
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.paid -= payment.refundAmount;
      invoice.balance = invoice.total - invoice.paid;
      invoice.status = invoice.balance > 0 ? 'partial' : 'paid';
      await invoice.save();
    }
  }
}

/**
 * Handle chargeback
 */
async function handleChargeback(dispute) {
  const chargeId = dispute.charge;

  const payment = await Payment.findOne({ transactionId: chargeId });
  if (payment) {
    payment.chargeback = true;
    payment.chargebackDate = new Date(dispute.created * 1000);
    await payment.save();

    // Log chargeback for review
    logger.info('⚠️  Chargeback received for payment:', payment.paymentNumber);
  }
}

/**
 * Sync our Subscription when Stripe subscription is updated (e.g. period renewal)
 */
async function handleSubscriptionUpdated(stripeSubscription) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
  if (!sub) return;
  if (stripeSubscription.current_period_end) {
    sub.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    sub.nextBillingDate = sub.currentPeriodEnd;
  }
  if (stripeSubscription.cancel_at_period_end !== undefined) {
    sub.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  }
  await sub.save();
  logger.info('Stripe subscription updated:', stripeSubscription.id);
}

/**
 * Mark our Subscription cancelled when Stripe subscription is deleted
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  const sub = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
  if (!sub) return;
  sub.status = SubscriptionStatus.CANCELLED;
  sub.cancelledAt = new Date();
  await sub.save();
  logger.info('Stripe subscription cancelled:', stripeSubscription.id);
}
