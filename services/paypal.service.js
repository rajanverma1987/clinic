/**
 * PayPal Subscription API Integration Service
 * Handles PayPal subscription plans and subscriptions
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'; // Use https://api-m.paypal.com for production

/**
 * Get PayPal access token
 */
async function getAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal subscription plan
 */
export async function createPayPalPlan(
  name,
  description,
  price, // in dollars
  currency,
  billingCycle
) {
  const accessToken = await getAccessToken();

  // First, create or get a product
  const productResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      name: 'Doctor\'s Clinic Subscription',
      description: 'Clinic management software subscription',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  let productId;
  if (productResponse.ok) {
    const productData = await productResponse.json();
    productId = productData.id;
  } else {
    // Try to get existing product
    const productsResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const products = await productsResponse.json();
    if (products.products && products.products.length > 0) {
      productId = products.products[0].id;
    } else {
      throw new Error('Failed to create or find PayPal product');
    }
  }

  // Create subscription plan
  const plan = {
    product_id: productId,
    name,
    description,
    billing_cycles: [
      {
        frequency: {
          interval_unit: billingCycle === 'MONTHLY' ? 'MONTH' : 'YEAR',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        pricing_scheme: {
          fixed_price: {
            value: price.toFixed(2),
            currency_code: currency,
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: 'CANCEL',
      payment_failure_threshold: 3,
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(plan),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal plan: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Create PayPal subscription
 */
export async function createPayPalSubscription(
  planId,
  returnUrl,
  cancelUrl,
  customerEmail,
  customerName
) {
  const accessToken = await getAccessToken();

  const subscription = {
    plan_id: planId,
    application_context: {
      brand_name: 'Doctor\'s Clinic',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  if (customerEmail) {
    subscription.subscriber = {
      email_address: customerEmail,
    };
    if (customerName) {
      const nameParts = customerName.split(' ');
      subscription.subscriber.name = {
        given_name: nameParts[0],
        surname: nameParts.slice(1).join(' ') || '',
      };
    }
  }

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  const data = await response.json();

  // Find approval URL in links
  const approvalLink = data.links?.find((link) => link.rel === 'approve');

  if (!approvalLink || !data.id) {
    throw new Error('Failed to get approval URL from PayPal');
  }

  return {
    subscriptionId: data.id,
    approvalUrl: approvalLink.href,
  };
}

/**
 * Get PayPal subscription details
 */
export async function getPayPalSubscription(subscriptionId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal subscription: ${error}`);
  }

  return await response.json();
}

/**
 * Cancel PayPal subscription
 */
export async function cancelPayPalSubscription(subscriptionId, reason) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'Customer requested cancellation',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${error}`);
  }
}

/**
 * Activate PayPal subscription (after approval)
 */
export async function activatePayPalSubscription(subscriptionId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Subscription approved',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to activate PayPal subscription: ${error}`);
  }
}

/**
 * Retry failed PayPal payment with exponential backoff
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns {Promise<Object>} Payment result
 */
export async function retryPayPalPayment(subscriptionId, maxRetries = 3, initialDelay = 1000) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[PayPal] Retry attempt ${attempt}/${maxRetries} for subscription ${subscriptionId}`);

      // Get subscription details to check status
      const subscription = await getPayPalSubscription(subscriptionId);

      // Check if subscription is active
      if (subscription.status === 'ACTIVE') {
        console.log(`[PayPal] Subscription ${subscriptionId} is already active`);
        return { success: true, subscription };
      }

      // Try to activate subscription
      if (subscription.status === 'APPROVAL_PENDING' || subscription.status === 'APPROVED') {
        await activatePayPalSubscription(subscriptionId);

        // Wait a bit and verify activation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const updatedSubscription = await getPayPalSubscription(subscriptionId);

        if (updatedSubscription.status === 'ACTIVE') {
          console.log(`[PayPal] ✅ Successfully activated subscription ${subscriptionId} on attempt ${attempt}`);
          return { success: true, subscription: updatedSubscription, attempts: attempt };
        }
      }

      // If we get here, activation didn't work
      throw new Error(`Subscription status: ${subscription.status}`);

    } catch (error) {
      lastError = error;
      console.error(`[PayPal] Retry attempt ${attempt} failed:`, error.message);

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: delay = initialDelay * 2^(attempt-1)
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`[PayPal] Waiting ${delay}ms before next retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error(`[PayPal] ❌ All ${maxRetries} retry attempts failed for subscription ${subscriptionId}`);
  throw new Error(`Failed to process PayPal payment after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Process recurring payment with automatic retry
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} Payment result
 */
export async function processRecurringPayment(subscriptionId, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    retryOnFailure = true
  } = options;

  try {
    // First attempt
    const subscription = await getPayPalSubscription(subscriptionId);

    if (subscription.status === 'ACTIVE') {
      return { success: true, subscription, attempts: 0 };
    }

    // If retry is enabled and payment failed, retry
    if (retryOnFailure && (subscription.status === 'SUSPENDED' || subscription.status === 'CANCELLED')) {
      return await retryPayPalPayment(subscriptionId, maxRetries, initialDelay);
    }

    return { success: false, subscription, error: `Subscription status: ${subscription.status}` };

  } catch (error) {
    // If retry is enabled, attempt retry
    if (retryOnFailure) {
      return await retryPayPalPayment(subscriptionId, maxRetries, initialDelay);
    }

    throw error;
  }
}

/**
 * Handle PayPal webhook
 */
export async function handlePayPalWebhook(payload, headers) {
  // Verify webhook signature (implementation depends on PayPal webhook verification)
  // For now, we'll process the webhook events

  const eventType = payload.event_type;
  const resource = payload.resource;

  // Handle different webhook events
  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.CREATED':
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      // Subscription activated
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      // Subscription cancelled/expired
      break;
    case 'PAYMENT.SALE.COMPLETED':
      // Payment completed
      break;
    case 'PAYMENT.SALE.DENIED':
      // Payment failed - trigger retry logic
      if (resource?.billing_agreement_id) {
        console.log('[PayPal] Payment denied, attempting retry for subscription:', resource.billing_agreement_id);
        try {
          await retryPayPalPayment(resource.billing_agreement_id, 3, 2000);
        } catch (error) {
          console.error('[PayPal] Retry failed after webhook:', error);
        }
      }
      break;
    default:
      console.log('Unhandled PayPal webhook event:', eventType);
  }
}

