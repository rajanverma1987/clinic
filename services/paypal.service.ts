/**
 * PayPal Subscription API Integration Service
 * Handles PayPal subscription plans and subscriptions
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'; // Use https://api-m.paypal.com for production

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalPlan {
  id?: string;
  product_id: string;
  name: string;
  description?: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: 'MONTH' | 'YEAR';
      interval_count: number;
    };
    tenure_type: 'REGULAR' | 'TRIAL';
    sequence: number;
    total_cycles?: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
  payment_preferences?: {
    auto_bill_outstanding?: boolean;
    setup_fee?: {
      value: string;
      currency_code: string;
    };
    setup_fee_failure_action?: 'CONTINUE' | 'CANCEL';
    payment_failure_threshold?: number;
  };
  taxes?: {
    percentage: string;
    inclusive?: boolean;
  };
}

interface PayPalSubscription {
  id?: string;
  plan_id: string;
  start_time?: string;
  quantity?: string;
  shipping_amount?: {
    currency_code: string;
    value: string;
  };
  subscriber?: {
    name?: {
      given_name?: string;
      surname?: string;
    };
    email_address?: string;
    shipping_address?: {
      name?: {
        full_name?: string;
      };
      address?: {
        address_line_1?: string;
        admin_area_2?: string;
        admin_area_1?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'SUBSCRIBE_NOW' | 'CONTINUE';
    payment_method?: {
      payer_selected?: 'PAYPAL';
      payee_preferred?: 'IMMEDIATE_PAYMENT_REQUIRED';
    };
    return_url?: string;
    cancel_url?: string;
  };
}

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
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

  const data: PayPalAccessToken = await response.json();
  return data.access_token;
}

/**
 * Create PayPal subscription plan
 */
export async function createPayPalPlan(
  name: string,
  description: string,
  price: number, // in dollars
  currency: string,
  billingCycle: 'MONTHLY' | 'YEARLY'
): Promise<string> {
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
      name: 'ClinicHub Subscription',
      description: 'Clinic management software subscription',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  let productId: string;
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
  const plan: PayPalPlan = {
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
  planId: string,
  returnUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  customerName?: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const accessToken = await getAccessToken();

  const subscription: PayPalSubscription = {
    plan_id: planId,
    application_context: {
      brand_name: 'ClinicHub',
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
  const approvalLink = data.links?.find((link: any) => link.rel === 'approve');
  
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
export async function getPayPalSubscription(subscriptionId: string): Promise<any> {
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
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason?: string
): Promise<void> {
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
export async function activatePayPalSubscription(subscriptionId: string): Promise<void> {
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
 * Handle PayPal webhook
 */
export async function handlePayPalWebhook(payload: any, headers: Record<string, string>): Promise<void> {
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
      // Payment failed
      break;
    default:
      console.log('Unhandled PayPal webhook event:', eventType);
  }
}

