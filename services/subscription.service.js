/**
 * Subscription Management Service
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import SubscriptionPlan, { PlanBillingCycle, PlanStatus } from '@/models/SubscriptionPlan.js';
import Subscription, { SubscriptionStatus } from '@/models/Subscription.js';
import SubscriptionPayment, { PaymentStatus } from '@/models/SubscriptionPayment.js';
import Tenant from '@/models/Tenant.js';
import {
  createPayPalPlan,
  createPayPalSubscription,
  getPayPalSubscription,
  cancelPayPalSubscription,
  activatePayPalSubscription,
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
    try {
      paypalPlanId = await createPayPalPlan(
        input.name,
        input.description || '',
        input.price / 100, // Convert from cents to dollars
        input.currency,
        input.billingCycle
      );
      console.log(`✅ Auto-created PayPal plan: ${paypalPlanId}`);
    } catch (error) {
      console.error('Failed to create PayPal plan:', error);
      // Continue without PayPal plan ID - admin can add it later
    }
  } else if (paypalPlanId) {
    console.log(`✅ Using provided PayPal plan ID: ${paypalPlanId}`);
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
 * Create subscription for tenant
 */
export async function createSubscription(tenantId, planId, userId, customerEmail, customerName) {
  await connectDB();

  // Get plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (plan.status !== PlanStatus.ACTIVE) {
    throw new Error('Subscription plan is not active');
  }

  // Check if tenant already has an active subscription
  const existingSubscription = await Subscription.findOne({
    tenantId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
  });

  // If upgrading to a paid plan from any existing subscription, cancel the old one first
  if (existingSubscription && plan.price > 0) {
    console.log(`Cancelling existing subscription ${existingSubscription._id} before creating new paid subscription`);
    
    // Cancel the old subscription immediately (not at period end)
    existingSubscription.status = SubscriptionStatus.CANCELLED;
    existingSubscription.cancelledAt = new Date();
    existingSubscription.cancelAtPeriodEnd = false;
    await existingSubscription.save();

    // If old subscription had PayPal subscription, cancel it
    if (existingSubscription.paypalSubscriptionId) {
      try {
        await cancelPayPalSubscription(existingSubscription.paypalSubscriptionId, 'Upgrading to new plan');
      } catch (error) {
        console.error('Failed to cancel PayPal subscription:', error);
        // Continue anyway - we'll create the new subscription
      }
    }
  } else if (existingSubscription && plan.price === 0) {
    // If trying to create a free subscription while having an active one, throw error
    throw new Error('Tenant already has an active subscription. Use update endpoint instead.');
  }

  // SECURITY: Paid plans MUST have PayPal integration
  if (plan.price > 0 && !plan.paypalPlanId) {
    throw new Error(
      'This plan requires payment but PayPal integration is not configured. ' +
      'Please contact support or choose a free plan.'
    );
  }

  // Calculate period dates
  const now = new Date();
  const periodStart = now;
  let periodEnd = new Date(now);
  
  // Free Trial gets 15 days, others follow billing cycle
  if (plan.name === 'Free Trial') {
    periodEnd.setDate(periodEnd.getDate() + 15);
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
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/return`;
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription/cancel`;
      
      const paypalResult = await createPayPalSubscription(
        plan.paypalPlanId,
        returnUrl,
        cancelUrl,
        customerEmail,
        customerName
      );

      paypalSubscriptionId = paypalResult.subscriptionId;
      approvalUrl = paypalResult.approvalUrl;
    } catch (error) {
      console.error('Failed to create PayPal subscription:', error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

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
  });

  return { subscription, approvalUrl };
}

/**
 * Get subscription for tenant
 */
export async function getTenantSubscription(tenantId) {
  await connectDB();
  return await Subscription.findOne({ tenantId })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Activate subscription (called after PayPal approval)
 */
export async function activateSubscription(subscriptionId, tenantId) {
  await connectDB();

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
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
      console.error('Failed to activate PayPal subscription:', error);
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
    // Cancel immediately in PayPal
    try {
      await cancelPayPalSubscription(subscription.paypalSubscriptionId);
    } catch (error) {
      console.error('Failed to cancel PayPal subscription:', error);
    }
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
  } else {
    // Cancel at end of period
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
  metadata
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
 * Creates PayPal subscription for paid plans and returns approval URL for client to pay
 * Free plans are activated immediately without payment
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
  const existingSubscription = await Subscription.findOne({ tenantId })
    .sort({ createdAt: -1 });

  // Cancel existing subscription if switching plans
  if (existingSubscription) {
    existingSubscription.status = SubscriptionStatus.CANCELLED;
    existingSubscription.cancelledAt = new Date();
    await existingSubscription.save();

    // Cancel PayPal subscription if exists
    if (existingSubscription.paypalSubscriptionId) {
      try {
        await cancelPayPalSubscription(existingSubscription.paypalSubscriptionId, 'Admin changed subscription plan');
      } catch (error) {
        console.error('Failed to cancel PayPal subscription:', error);
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

  // For PAID plans: Create PayPal subscription
  let paypalSubscriptionId;
  let approvalUrl;
  const isPaidPlan = newPlan.price > 0;

  if (isPaidPlan) {
    // SECURITY: Paid plans MUST have PayPal integration
    if (!newPlan.paypalPlanId) {
      throw new Error(
        'This plan requires payment but PayPal integration is not configured. ' +
        'Please run: npm run setup:paypal-plans to configure PayPal billing plans.'
      );
    }

    try {
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5053'}/subscription/return`;
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5053'}/subscription/cancel`;
      
      const paypalResult = await createPayPalSubscription(
        newPlan.paypalPlanId,
        returnUrl,
        cancelUrl,
        customerEmail || tenant.name, // Use tenant name if no email
        customerName || tenant.name
      );

      paypalSubscriptionId = paypalResult.subscriptionId;
      approvalUrl = paypalResult.approvalUrl;

      console.log(`✅ Created PayPal subscription for ${tenant.name}: ${paypalSubscriptionId}`);
      console.log(`📧 Payment URL: ${approvalUrl}`);
    } catch (error) {
      console.error('Failed to create PayPal subscription:', error);
      throw new Error(`Failed to create PayPal subscription: ${error.message}`);
    }
  }

  // Create new subscription
  const newSubscription = await Subscription.create({
    tenantId,
    planId: newPlanId,
    status: isPaidPlan ? SubscriptionStatus.PENDING : SubscriptionStatus.ACTIVE, // PENDING until client pays
    paypalSubscriptionId,
    paypalApprovalUrl: approvalUrl, // Store approval URL so user can pay later
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    nextBillingDate: periodEnd,
  });

  return {
    subscription: newSubscription,
    approvalUrl, // Send this URL to client so they can pay
    requiresPayment: isPaidPlan,
  };
}

