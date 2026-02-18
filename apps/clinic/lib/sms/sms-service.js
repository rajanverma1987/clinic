import { logger } from '@/lib/utils/logger.js';

/**
 * SMS Service
 * Sends SMS notifications using various providers
 */

/**
 * Get SMS provider configuration
 */
async function getSMSConfig(tenantId = null) {
  // If tenantId is provided, try to get tenant-specific SMS settings
  if (tenantId) {
    try {
      const Tenant = (await import('@/models/Tenant.js')).default;
      const tenant = await Tenant.findById(tenantId);

      if (tenant?.settings?.sms?.enabled && tenant.settings.sms.provider) {
        return {
          provider: tenant.settings.sms.provider,
          apiKey: tenant.settings.sms.apiKey,
          apiSecret: tenant.settings.sms.apiSecret,
          from: tenant.settings.sms.from,
        };
      }
    } catch (error) {
      logger.warn('Failed to load tenant SMS settings, using defaults:', error.message);
    }
  }

  // Use global SMS settings from environment variables
  return {
    provider: process.env.SMS_PROVIDER || 'twilio',
    apiKey: process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID,
    apiSecret: process.env.SMS_API_SECRET || process.env.TWILIO_AUTH_TOKEN,
    from: process.env.SMS_FROM || process.env.TWILIO_PHONE_NUMBER,
  };
}

/**
 * Send SMS using Twilio
 */
async function sendViaTwilio(to, message, config) {
  try {
    const twilio = await import('twilio');
    const client = twilio.default(config.apiKey, config.apiSecret);

    const result = await client.messages.create({
      body: message,
      from: config.from,
      to: to,
    });

    return {
      success: true,
      messageId: result.sid,
      provider: 'twilio',
    };
  } catch (error) {
    logger.error('Twilio SMS error:', error);
    throw error;
  }
}

/** Valid AWS region identifiers (GHSA-j965-2qgj-vjmq) */
const VALID_AWS_REGIONS = new Set([
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'af-south-1', 'ap-east-1',
  'ap-south-1', 'ap-south-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ca-central-1', 'ca-west-1',
  'eu-central-1', 'eu-central-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-south-1',
  'eu-south-2', 'eu-north-1', 'me-south-1', 'me-central-1', 'sa-east-1', 'il-central-1',
]);

/**
 * Send SMS using AWS SNS (v3 client – no vulnerable aws-sdk v2)
 */
async function sendViaAWS(to, message, config) {
  try {
    const rawRegion = process.env.AWS_REGION || 'us-east-1';
    const region = VALID_AWS_REGIONS.has(String(rawRegion).toLowerCase()) ? rawRegion : 'us-east-1';
    const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
    const client = new SNSClient({
      region,
      credentials: {
        accessKeyId: config.apiKey,
        secretAccessKey: config.apiSecret,
      },
    });
    const result = await client.send(
      new PublishCommand({
        Message: message,
        PhoneNumber: to,
      }),
    );

    return {
      success: true,
      messageId: result.MessageId,
      provider: 'aws',
    };
  } catch (error) {
    logger.error('AWS SNS SMS error:', error);
    throw error;
  }
}

/**
 * Send SMS notification
 * @param {Object} params - SMS parameters
 * @param {string} params.to - Recipient phone number (E.164 format)
 * @param {string} params.message - SMS message text
 * @param {string} tenantId - Tenant ID for clinic-specific SMS settings (optional)
 */
export async function sendSMS(params, tenantId = null) {
  try {
    const config = await getSMSConfig(tenantId);

    if (!config.apiKey || !config.apiSecret) {
      logger.warn('📱 SMS not sent (SMS not configured):', {
        to: params.to,
        message: params.message.substring(0, 50) + '...',
      });
      return {
        success: false,
        error: 'SMS not configured',
      };
    }

    let result;

    switch (config.provider.toLowerCase()) {
      case 'twilio':
        result = await sendViaTwilio(params.to, params.message, config);
        break;
      case 'aws':
      case 'sns':
        result = await sendViaAWS(params.to, params.message, config);
        break;
      default:
        logger.warn(`Unsupported SMS provider: ${config.provider}`);
        return {
          success: false,
          error: `Unsupported SMS provider: ${config.provider}`,
        };
    }

    logger.info('📱 SMS sent successfully:', {
      to: params.to,
      provider: result.provider,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
