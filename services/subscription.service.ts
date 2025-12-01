/**
 * Subscription Management Service
 */

import connectDB from '@/lib/db/connection';
import { withTenant } from '@/lib/db/tenant-helper';
import SubscriptionPlan, { ISubscriptionPlan, PlanBillingCycle, PlanStatus } from '@/models/SubscriptionPlan';
import Subscription, { ISubscription, SubscriptionStatus } from '@/models/Subscription';
import SubscriptionPayment, { ISubscriptionPayment, PaymentStatus, PaymentMethod } from '@/models/SubscriptionPayment';
import Tenant from '@/models/Tenant';
import {
  createPayPalPlan,
  createPayPalSubscription,
  getPayPalSubscription,
  cancelPayPalSubscription,
  activatePayPalSubscription,
} from './paypal.service';

/**
 * Create subscription plan (Admin only)
 */
export async function createSubscriptionPlan(
  input: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingCycle: PlanBillingCycle;
    features: string[];
    maxUsers?: number;
    maxPatients?: number;
    maxStorageGB?: number;
    isPopular?: boolean;
    isHidden?: boolean;
  }
): Promise<ISubscriptionPlan> {
  await connectDB();

  // Create PayPal plan
  let paypalPlanId: string | undefined;
  try {
    paypalPlanId = await createPayPalPlan(
      input.name,
      input.description || '',
      input.price / 100, // Convert from cents to dollars
      input.currency,
      input.billingCycle
    );
  } catch (error) {
    console.error('Failed to create PayPal plan:', error);
    // Continue without PayPal plan ID for now
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
export async function updateSubscriptionPlan(
  planId: string,
  input: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    billingCycle?: PlanBillingCycle;
    features?: string[];
    maxUsers?: number;
    maxPatients?: number;
    maxStorageGB?: number;
    isPopular?: boolean;
    isHidden?: boolean;
    status?: PlanStatus;
  }
): Promise<ISubscriptionPlan | null> {
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
export async function listSubscriptionPlans(
  status?: PlanStatus,
  excludeHidden: boolean = false
): Promise<ISubscriptionPlan[]> {
  await connectDB();

  const query: any = {};
  if (status) {
    query.status = status;
  }
  if (excludeHidden) {
    query.isHidden = { $ne: true };
  }

  return await SubscriptionPlan.find(query).sort({ price: 1 }).lean() as unknown as ISubscriptionPlan[];
}

/**
 * Get subscription plan by ID
 */
export async function getSubscriptionPlanById(planId: string): Promise<ISubscriptionPlan | null> {
  await connectDB();
  return await SubscriptionPlan.findById(planId).lean() as unknown as ISubscriptionPlan | null;
}

/**
 * Create subscription for tenant
 */
export async function createSubscription(
  tenantId: string,
  planId: string,
  userId: string,
  customerEmail?: string,
  customerName?: string
): Promise<{ subscription: ISubscription; approvalUrl?: string }> {
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

  if (existingSubscription) {
    throw new Error('Tenant already has an active subscription');
  }

  // Calculate period dates
  const now = new Date();
  const periodStart = now;
  let periodEnd = new Date(now);
  
  if (plan.billingCycle === PlanBillingCycle.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Create PayPal subscription if plan has PayPal plan ID
  let paypalSubscriptionId: string | undefined;
  let approvalUrl: string | undefined;

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
export async function getTenantSubscription(tenantId: string): Promise<ISubscription | null> {
  await connectDB();
  return await Subscription.findOne({ tenantId })
    .populate('planId')
    .sort({ createdAt: -1 })
    .lean() as unknown as ISubscription | null;
}

/**
 * Activate subscription (called after PayPal approval)
 */
export async function activateSubscription(
  subscriptionId: string,
  tenantId: string
): Promise<ISubscription> {
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
export async function cancelSubscription(
  subscriptionId: string,
  tenantId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<ISubscription> {
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
export async function listSubscriptions(): Promise<ISubscription[]> {
  await connectDB();
  return await Subscription.find()
    .populate('tenantId', 'name slug')
    .populate('planId', 'name price billingCycle')
    .sort({ createdAt: -1 })
    .lean() as unknown as ISubscription[];
}

/**
 * Create payment record
 */
export async function createPayment(
  subscriptionId: string,
  tenantId: string,
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  paypalTransactionId?: string,
  paypalOrderId?: string,
  metadata?: Record<string, any>
): Promise<ISubscriptionPayment> {
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
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  paidAt?: Date,
  failureReason?: string
): Promise<ISubscriptionPayment | null> {
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
export async function getSubscriptionPayments(
  subscriptionId: string,
  tenantId: string
): Promise<ISubscriptionPayment[]> {
  await connectDB();

  return await SubscriptionPayment.find({
    subscriptionId,
    tenantId,
  })
    .sort({ createdAt: -1 })
    .lean() as unknown as ISubscriptionPayment[];
}

/**
 * Update tenant subscription (Admin only)
 */
export async function updateTenantSubscription(
  tenantId: string,
  newPlanId: string
): Promise<ISubscription> {
  await connectDB();

  // Get new plan
  const newPlan = await SubscriptionPlan.findById(newPlanId);
  if (!newPlan) {
    throw new Error('Subscription plan not found');
  }

  // Get existing subscription
  const existingSubscription = await Subscription.findOne({ tenantId })
    .sort({ createdAt: -1 });

  if (!existingSubscription) {
    throw new Error('No existing subscription found for this tenant');
  }

  // Update subscription plan
  existingSubscription.planId = newPlanId as any;

  // Recalculate period dates based on new plan
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  if (newPlan.billingCycle === PlanBillingCycle.MONTHLY) {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  existingSubscription.currentPeriodStart = periodStart;
  existingSubscription.currentPeriodEnd = periodEnd;
  existingSubscription.nextBillingDate = periodEnd;

  await existingSubscription.save();

  return existingSubscription;
}

