/**
 * Subscription Management Service
 */

import connectDB from '@/lib/db/connection.js';
import { logger } from '@/lib/utils/logger.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';
import SubscriptionPayment, { PaymentStatus } from '@/models/SubscriptionPayment.js';
import SubscriptionPlan, { PlanBillingCycle, PlanStatus } from '@/models/SubscriptionPlan.js';
import Tenant from '@/models/Tenant.js';
import {
  activatePayPalSubscription,
  cancelPayPalSubscription,
  createPayPalPlan,
  createPayPalSubscription,
} from './paypal.service.js';

/**
 * Create subscription plan (Admin only)
 */
export async function createSubscriptionPlan(input) {
  await connectDB();

  // Only create PayPal plan if not provided and plan is paid
  let paypalPlanId = input.paypalPlanId;

  if (!paypalPlanId && input.price > 0) {
    // No PayPal Plan ID provided and it's a paid plan - try to create one
    const trialDays = input.trialDays ?? 14;
    try {
      paypalPlanId = await createPayPalPlan(
        input.name,
        input.description || '',
        input.price / 100, // Convert from cents to dollars
        input.currency,
        input.billingCycle,
        trialDays,
      );
      logger.info(
        `✅ Auto-created PayPal plan: ${paypalPlanId}${trialDays ? ` (${trialDays}-day trial)` : ''}`,
      );
    } catch (error) {
      logger.error('Failed to create PayPal plan:', error);
      // Continue without PayPal plan ID - admin can add it later
    }
  } else if (paypalPlanId) {
    logger.info(`✅ Using provided PayPal plan ID: ${paypalPlanId}`);
  }

  const plan = await SubscriptionPlan.create({
    ...input,
    price: input.price, // Store in cents
    paypalPlanId,
    status: PlanStatus.ACTIVE,
  });

  return plan;
}

/**
 * Update subscription plan (Admin only)
 */
export async function updateSubscriptionPlan(planId, input) {
  await connectDB();

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return null;
  }

  // Update fields
  if (input.name !== undefined) plan.name = input.name;
  if (input.description !== undefined) plan.description = input.description;
  if (input.price !== undefined) plan.price = input.price;
  if (input.currency !== undefined) plan.currency = input.currency;
  if (input.billingCycle !== undefined) plan.billingCycle = input.billingCycle;
  if (input.paypalPlanId !== undefined) plan.paypalPlanId = input.paypalPlanId; // Update PayPal Plan ID
  if (input.features !== undefined) plan.features = input.features;
  if (input.maxUsers !== undefined) plan.maxUsers = input.maxUsers;
  if (input.maxPatients !== undefined) plan.maxPatients = input.maxPatients;
  if (input.maxStorageGB !== undefined) plan.maxStorageGB = input.maxStorageGB;
  if (input.isPopular !== undefined) plan.isPopular = input.isPopular;
  if (input.isHidden !== undefined) plan.isHidden = input.isHidden;
  if (input.status !== undefined) plan.status = input.status;
  if (input.trialDays !== undefined) plan.trialDays = input.trialDays;

  await plan.save();
  return plan;
}

/**
 * List all subscription plans
 */
export async function listSubscriptionPlans(status, excludeHidden = false) {
  await connectDB();

  const query = {};
  if (status) {
    query.status = status;
  }
  if (excludeHidden) {
    query.isHidden = { $ne: true };
  }

  return await SubscriptionPlan.find(query).sort({ price: 1 }).lean();
}

/**
 * Get subscription plan by ID
 */
export async function getSubscriptionPlanById(planId) {
  await connectDB();
  return await SubscriptionPlan.findById(planId).lean();
}

/**
 * Delete subscription plan (Admin only).
 * Fails if any active subscription references this plan.
 */
export async function deleteSubscriptionPlan(planId) {
  await connectDB();

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return null;
  }

  const activeCount = await Subscription.countDocuments({
    planId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  });
  if (activeCount > 0) {
    throw new Error(
      `Cannot delete plan: ${activeCount} active subscription(s) are using it. Cancel or switch them first.`,
    );
  }

  await SubscriptionPlan.findByIdAndDelete(planId);
  return { deleted: true, planId };
}

/**
 * Create subscription for tenant. Only PayPal is supported.
 * @param {string} [paymentMethod] - 'paypal' only (card/Stripe removed).
 */
export async function createSubscription(
  tenantId,
  planId,
  userId,
  customerEmail,
  customerName,
  paymentMethod = 'paypal',
) {
  await connectDB();

  // Get plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (plan.status !== PlanStatus.ACTIVE) {
    throw new Error('Subscription plan is not active');
  }

  if (plan.price > 0 && paymentMethod !== 'paypal') {
    throw new Error('Only PayPal is accepted. Please use Pay with PayPal.');
  }

  // Check if tenant already has an active subscription
  const existingSubscription = await Subscription.findOne({
    tenantId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  });

  // If upgrading to a paid plan from any existing subscription, cancel the old one first
  if (existingSubscription && plan.price > 0) {
    logger.info(
      `Cancelling existing subscription ${existingSubscription._id} before creating new paid subscription`,
    );
    existingSubscription.status = SubscriptionStatus.CANCELLED;
    existingSubscription.cancelledAt = new Date();
    existingSubscription.cancelAtPeriodEnd = false;
    await existingSubscription.save();
    if (existingSubscription.paypalSubscriptionId) {
      try {
        await cancelPayPalSubscription(
          existingSubscription.paypalSubscriptionId,
          'Upgrading to new plan',
        );
      } catch (error) {
        logger.error('Failed to cancel PayPal subscription:', error);
      }
    }
  } else if (existingSubscription && plan.price === 0) {
    throw new Error('Tenant already has an active subscription. Use update endpoint instead.');
  }

  // Paid plans require PayPal plan ID
  if (plan.price > 0 && !plan.paypalPlanId) {
    throw new Error('PayPal is not available for this plan. Please contact support.');
  }

  // Calculate period dates
  const now = new Date();
  const periodStart = now;
  let periodEnd = new Date(now);
  const trialDays = plan.trialDays ?? 14;

  if (trialDays > 0) {
    // All plans: 14 days free, then billing starts
    periodEnd.setDate(periodEnd.getDate() + trialDays);
  } else if (plan.billingCycle === PlanBillingCycle.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Create PayPal subscription if plan has PayPal plan ID
  let paypalSubscriptionId;
  let approvalUrl;

  if (plan.paypalPlanId) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5053');
      const root = baseUrl || 'http://localhost:5053';
      const returnUrl = `${root}/subscription/return`;
      const cancelUrl = `${root}/subscription/cancel`;

      const paypalResult = await createPayPalSubscription(
        plan.paypalPlanId,
        returnUrl,
        cancelUrl,
        customerEmail,
        customerName,
      );

      paypalSubscriptionId = paypalResult.subscriptionId;
      approvalUrl = paypalResult.approvalUrl;
    } catch (error) {
      logger.error('Failed to create PayPal subscription:', error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  // Trial end date: 14 days free for all plans, then billing starts
  const trialEnd = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

  // Create subscription
  const subscription = await Subscription.create({
    tenantId,
    planId,
    status: plan.paypalPlanId ? SubscriptionStatus.PENDING : SubscriptionStatus.ACTIVE,
    paypalSubscriptionId,
    paypalApprovalUrl: approvalUrl, // Store approval URL for later use
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    nextBillingDate: periodEnd,
    trialEnd: trialEnd || undefined,
  });

  return { subscription, approvalUrl };
}

/**
 * Get subscription for tenant
 */
export async function getTenantSubscription(tenantId) {
  await connectDB();
  return await Subscription.findOne({ tenantId }).populate('planId').sort({ createdAt: -1 }).lean();
}

/**
 * Activate subscription (called after PayPal approval).
 * subscriptionId can be our DB _id or PayPal's subscription ID (token from return URL).
 */
export async function activateSubscription(subscriptionId, tenantId) {
  await connectDB();

  const isMongoId =
    typeof subscriptionId === 'string' &&
    subscriptionId.length === 24 &&
    /^[a-fA-F0-9]{24}$/.test(subscriptionId);

  const subscription = isMongoId
    ? await Subscription.findOne({ _id: subscriptionId, tenantId })
    : await Subscription.findOne({
        paypalSubscriptionId: subscriptionId,
        tenantId,
      });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Activate PayPal subscription if exists
  if (subscription.paypalSubscriptionId) {
    try {
      await activatePayPalSubscription(subscription.paypalSubscriptionId);
    } catch (error) {
      logger.error('Failed to activate PayPal subscription:', error);
    }
  }

  subscription.status = SubscriptionStatus.ACTIVE;
  await subscription.save();

  return subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, tenantId, cancelAtPeriodEnd = true) {
  await connectDB();

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    tenantId,
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!cancelAtPeriodEnd && subscription.paypalSubscriptionId) {
    try {
      await cancelPayPalSubscription(subscription.paypalSubscriptionId);
    } catch (error) {
      logger.error('Failed to cancel PayPal subscription:', error);
    }
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
  } else {
    subscription.cancelAtPeriodEnd = true;
  }

  await subscription.save();
  return subscription;
}

/**
 * List all subscriptions (Admin)
 */
export async function listSubscriptions() {
  await connectDB();
  return await Subscription.find()
    .populate('tenantId', 'name slug')
    .populate('planId', 'name price billingCycle')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Create payment record
 */
export async function createPayment(
  subscriptionId,
  tenantId,
  amount,
  currency,
  paymentMethod,
  paypalTransactionId,
  paypalOrderId,
  metadata,
) {
  await connectDB();

  const payment = await SubscriptionPayment.create({
    subscriptionId,
    tenantId,
    amount,
    currency,
    status: PaymentStatus.PENDING,
    paymentMethod,
    paypalTransactionId,
    paypalOrderId,
    metadata,
  });

  return payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(paymentId, status, paidAt, failureReason) {
  await connectDB();

  const payment = await SubscriptionPayment.findById(paymentId);
  if (!payment) {
    return null;
  }

  payment.status = status;
  if (paidAt) {
    payment.paidAt = paidAt;
  }
  if (failureReason) {
    payment.failureReason = failureReason;
  }

  await payment.save();
  return payment;
}

/**
 * Get payments for subscription
 */
export async function getSubscriptionPayments(subscriptionId, tenantId) {
  await connectDB();

  return await SubscriptionPayment.find({
    subscriptionId,
    tenantId,
  })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Update tenant subscription (Admin only)
 * All plans have 14-day free trial; paid plans require payment after trial.
 */
export async function updateTenantSubscription(tenantId, newPlanId, customerEmail, customerName) {
  await connectDB();

  // Get new plan
  const newPlan = await SubscriptionPlan.findById(newPlanId);
  if (!newPlan) {
    throw new Error('Subscription plan not found');
  }

  // Check if plan is active
  if (newPlan.status !== PlanStatus.ACTIVE) {
    throw new Error('Subscription plan is not active');
  }

  // Get tenant for customer details
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Get existing subscription
  const existingSubscription = await Subscription.findOne({ tenantId }).sort({ createdAt: -1 });

  // Cancel existing subscription if switching plans
  if (existingSubscription) {
    existingSubscription.status = SubscriptionStatus.CANCELLED;
    existingSubscription.cancelledAt = new Date();
    await existingSubscription.save();

    // Cancel PayPal subscription if exists
    if (existingSubscription.paypalSubscriptionId) {
      try {
        await cancelPayPalSubscription(
          existingSubscription.paypalSubscriptionId,
          'Admin changed subscription plan',
        );
      } catch (error) {
        logger.error('Failed to cancel PayPal subscription:', error);
      }
    }
  }

  // Calculate period dates based on new plan
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);

  // Free Trial gets 15 days, others follow billing cycle
  if (newPlan.name === 'Free Trial') {
    periodEnd.setDate(periodEnd.getDate() + 15); // 15 days for free trial
  } else if (newPlan.billingCycle === PlanBillingCycle.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // For PAID plans: Create PayPal subscription when configured; otherwise allow admin assignment
  let paypalSubscriptionId;
  let approvalUrl;
  const isPaidPlan = newPlan.price > 0;
  let subscriptionStatus = SubscriptionStatus.ACTIVE;
  let requiresPayment = false;

  if (
    isPaidPlan &&
    newPlan.paypalPlanId &&
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET
  ) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5053');
      const root = baseUrl || 'http://localhost:5053';
      const returnUrl = `${root}/subscription/return`;
      const cancelUrl = `${root}/subscription/cancel`;

      const paypalResult = await createPayPalSubscription(
        newPlan.paypalPlanId,
        returnUrl,
        cancelUrl,
        customerEmail || tenant.name,
        customerName || tenant.name,
      );

      paypalSubscriptionId = paypalResult.subscriptionId;
      approvalUrl = paypalResult.approvalUrl;
      subscriptionStatus = SubscriptionStatus.PENDING;
      requiresPayment = true;

      logger.info(`✅ Created PayPal subscription for ${tenant.name}: ${paypalSubscriptionId}`);
      logger.info(`📧 Payment URL: ${approvalUrl}`);
    } catch (error) {
      logger.error(
        'Failed to create PayPal subscription, assigning plan without payment link:',
        error,
      );
      // Admin override: assign plan as ACTIVE; client can pay later via subscription page
      subscriptionStatus = SubscriptionStatus.ACTIVE;
    }
  } else if (isPaidPlan) {
    logger.info(
      `PayPal not configured or plan missing paypalPlanId. Assigning plan "${newPlan.name}" to ${tenant.name} as ACTIVE (admin override).`,
    );
  }

  // Create new subscription
  const newSubscription = await Subscription.create({
    tenantId,
    planId: newPlanId,
    status: subscriptionStatus,
    paypalSubscriptionId,
    paypalApprovalUrl: approvalUrl,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    nextBillingDate: periodEnd,
  });

  return {
    subscription: newSubscription,
    approvalUrl: approvalUrl || null,
    requiresPayment,
  };
}

/** Valid add-on keys (must match lib/constants/subscription-spec.js ADDONS) */
const ADDON_KEYS = ['aiAssist', 'advancedAnalytics', 'automationPro', 'apiIntegration'];

/**
 * Add an add-on to a subscription (for limited-plan users).
 * @param {string} subscriptionId - Subscription _id
 * @param {string} tenantId - Tenant id (for auth)
 * @param {{ addonKey: string, quantity?: number, option?: string }} input
 */
export async function addAddon(subscriptionId, tenantId, input) {
  await connectDB();

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    tenantId,
  });
  if (!subscription) {
    throw new Error('Subscription not found');
  }
  if (
    subscription.status !== SubscriptionStatus.ACTIVE &&
    subscription.status !== SubscriptionStatus.PENDING
  ) {
    throw new Error('Add-ons can only be added to an active or pending subscription');
  }

  const addonKey = (input.addonKey || '').trim();
  if (!ADDON_KEYS.includes(addonKey)) {
    throw new Error(`Invalid add-on: ${addonKey}`);
  }

  const existing = (subscription.addons || []).find((a) => a.addonKey === addonKey);
  if (existing) {
    throw new Error('This add-on is already on your subscription');
  }

  subscription.addons = subscription.addons || [];
  subscription.addons.push({
    addonKey,
    quantity: typeof input.quantity === 'number' && input.quantity >= 1 ? input.quantity : 1,
    option: typeof input.option === 'string' ? input.option.trim() : undefined,
  });
  await subscription.save();

  return subscription;
}

/**
 * Remove an add-on from a subscription.
 * @param {string} subscriptionId - Subscription _id
 * @param {string} tenantId - Tenant id (for auth)
 * @param {string} addonKey - Add-on key to remove
 */
export async function removeAddon(subscriptionId, tenantId, addonKey) {
  await connectDB();

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    tenantId,
  });
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const key = (addonKey || '').trim();
  if (!key) {
    throw new Error('Add-on key is required');
  }

  subscription.addons = (subscription.addons || []).filter((a) => a.addonKey !== key);
  await subscription.save();

  return subscription;
}
