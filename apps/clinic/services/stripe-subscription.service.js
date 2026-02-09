/**
 * Stripe subscription checkout and lifecycle.
 * Card payment option for subscriptions (alongside PayPal).
 */

import Stripe from 'stripe';
import connectDB from '@/lib/db/connection.js';
import SubscriptionPlan from '@/models/SubscriptionPlan.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';
import { logger } from '@/lib/utils/logger.js';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
}

/**
 * Create Stripe Checkout Session for subscription (card payment).
 * Returns { checkoutUrl } for redirect.
 */
export async function createStripeCheckoutSession(tenantId, planId, customerEmail, customerName) {
  await connectDB();
  const stripe = getStripe();

  const plan = await SubscriptionPlan.findById(planId).lean();
  if (!plan) throw new Error('Subscription plan not found');
  if (plan.price <= 0) throw new Error('Free plan does not require payment');

  const trialDays = plan.trialDays ?? 14;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5053';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: customerEmail || undefined,
    client_reference_id: tenantId.toString(),
    line_items: [
      {
        price_data: {
          currency: (plan.currency || 'usd').toLowerCase(),
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
            images: [],
          },
          unit_amount: plan.price, // cents
          recurring: {
            interval: (plan.billingCycle || 'MONTHLY') === 'YEARLY' ? 'year' : 'month',
            interval_count: 1,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: trialDays || undefined,
      metadata: {
        tenantId: tenantId.toString(),
        planId: planId.toString(),
      },
    },
    success_url: `${baseUrl}/subscription/return?session_id={CHECKOUT_SESSION_ID}&method=stripe`,
    cancel_url: `${baseUrl}/subscription`,
    metadata: {
      tenantId: tenantId.toString(),
      planId: planId.toString(),
    },
  });

  if (!session.url) throw new Error('Failed to get Stripe checkout URL');
  return { checkoutUrl: session.url, sessionId: session.id };
}

/**
 * Complete subscription after Stripe Checkout: create our Subscription record from session.
 */
export async function completeStripeSubscription(sessionId, tenantId) {
  await connectDB();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (!session.subscription) throw new Error('No subscription in session');
  const stripeSub = typeof session.subscription === 'object' ? session.subscription : await stripe.subscriptions.retrieve(session.subscription);
  const tenantIdFromMeta = session.metadata?.tenantId || session.client_reference_id;
  const planIdFromMeta = session.metadata?.planId;

  if (!tenantIdFromMeta || !planIdFromMeta) throw new Error('Missing tenant or plan in session');
  if (tenantId && tenantId.toString() !== tenantIdFromMeta) throw new Error('Tenant mismatch');

  const subTenantId = tenantId || tenantIdFromMeta;
  const planId = planIdFromMeta;

  const existing = await Subscription.findOne({
    tenantId: subTenantId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  });
  if (existing && existing.stripeSubscriptionId === stripeSub.id) {
    return existing;
  }
  if (existing) {
    existing.status = SubscriptionStatus.CANCELLED;
    existing.cancelledAt = new Date();
    await existing.save();
  }

  const plan = await SubscriptionPlan.findById(planId).lean();
  const trialDays = plan?.trialDays ?? (plan?.name === 'SOLO' ? 14 : 0);
  const now = new Date();
  let periodEnd = new Date(now);
  if (trialDays > 0) periodEnd.setDate(periodEnd.getDate() + trialDays);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);
  const trialEnd = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

  const subscription = await Subscription.create({
    tenantId: subTenantId,
    planId,
    status: SubscriptionStatus.ACTIVE,
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer?.id || stripeSub.customer),
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    nextBillingDate: periodEnd,
    trialEnd: trialEnd || undefined,
    cancelAtPeriodEnd: false,
  });

  logger.info(`Stripe subscription completed: ${subscription._id} for tenant ${subTenantId}`);
  return subscription;
}

/**
 * Cancel Stripe subscription (our record and Stripe).
 */
export async function cancelStripeSubscription(subscriptionId, tenantId, cancelAtPeriodEnd = true) {
  await connectDB();
  const stripe = getStripe();

  const sub = await Subscription.findOne({ _id: subscriptionId, tenantId });
  if (!sub) throw new Error('Subscription not found');
  if (!sub.stripeSubscriptionId) throw new Error('Not a Stripe subscription');

  if (!cancelAtPeriodEnd) {
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
  } else {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    sub.cancelAtPeriodEnd = true;
  }
  await sub.save();
  return sub;
}
