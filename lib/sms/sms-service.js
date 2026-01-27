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

/**
 * Send SMS using AWS SNS
 */
async function sendViaAWS(to, message, config) {
  try {
    const AWS = await import('aws-sdk');
    const sns = new AWS.SNS({
      accessKeyId: config.apiKey,
      secretAccessKey: config.apiSecret,
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const result = await sns.publish({
      Message: message,
      PhoneNumber: to,
    }).promise();

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
