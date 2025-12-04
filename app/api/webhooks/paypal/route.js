import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Subscription from '@/models/Subscription';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import { SubscriptionStatus } from '@/models/Subscription';
import { PaymentStatus } from '@/models/SubscriptionPayment';
import { updatePaymentStatus } from '@/services/subscription.service';

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const eventType = body.event_type;
    const resource = body.resource;

    await connectDB();

    // Handle different webhook events
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription activated
        if (resource?.id) {
          await Subscription.updateOne(
            { paypalSubscriptionId: resource.id },
            { $set: { status: SubscriptionStatus.ACTIVE } }
          );
        }
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Subscription cancelled/expired
        if (resource?.id) {
          await Subscription.updateOne(
            { paypalSubscriptionId: resource.id },
            {
              $set: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
              },
            }
          );
        }
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Payment completed
        if (resource?.billing_agreement_id) {
          const subscription = await Subscription.findOne({
            paypalSubscriptionId: resource.billing_agreement_id,
          });

          if (subscription && resource.id) {
            // Create or update payment record
            await SubscriptionPayment.findOneAndUpdate(
              { paypalTransactionId: resource.id },
              {
                $set: {
                  subscriptionId: subscription._id,
                  tenantId: subscription.tenantId,
                  amount: Math.round(parseFloat(resource.amount?.total || '0') * 100), // Convert to cents
                  currency: resource.amount?.currency || 'USD',
                  status: PaymentStatus.COMPLETED,
                  paymentMethod: 'PAYPAL',
                  paypalTransactionId: resource.id,
                  paypalOrderId: resource.parent_payment,
                  paidAt: new Date(resource.create_time),
                  metadata: resource,
                },
              },
              { upsert: true, new: true }
            );
          }
        }
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        // Payment failed/refunded
        if (resource?.id) {
          await SubscriptionPayment.updateOne(
            { paypalTransactionId: resource.id },
            {
              $set: {
                status: eventType === 'PAYMENT.SALE.REFUNDED' ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
                failureReason: resource.reason_code || 'Payment failed',
              },
            }
          );
        }
        break;

      default:
        console.log('Unhandled PayPal webhook event:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

