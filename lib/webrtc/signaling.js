/**
 * WebRTC Signaling Service
 * Handles SDP offer/answer and ICE candidate exchange between peers
 */

import { apiClient } from '@/lib/api/client.js';

export class SignalingService {
  constructor(sessionId, userId) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.pollingInterval = null;
    this.onMessageCallback = null;
  }

  /**
   * Send offer to remote peer
   */
  async sendOffer(offer, targetUserId) {
    const message = {
      type: 'offer',
      data: offer,
      from: String(this.userId).trim(),
      to: String(targetUserId).trim(),
      sessionId: this.sessionId,
    };
    console.log('[Signaling] 📤 Sending offer:', {
      from: `"${message.from}"`,
      to: `"${message.to}"`,
      sessionId: message.sessionId,
      offerType: offer.type,
      offerSdp: offer.sdp ? offer.sdp.substring(0, 100) + '...' : 'no sdp'
    });
    try {
      await this.sendSignal(message);
      console.log('[Signaling] ✅ Offer sent successfully to', `"${message.to}"`);
    } catch (error) {
      console.error('[Signaling] ❌ Failed to send offer:', error);
      throw error;
    }
  }

  /**
   * Send answer to remote peer
   */
  async sendAnswer(answer, targetUserId) {
    await this.sendSignal({
      type: 'answer',
      data: answer,
      from: this.userId,
      to: targetUserId,
      sessionId: this.sessionId,
    });
  }

  /**
   * Send ICE candidate to remote peer
   */
  async sendIceCandidate(candidate, targetUserId) {
    const message = {
      type: 'ice-candidate',
      data: candidate.toJSON(),
      from: String(this.userId).trim(),
      to: String(targetUserId).trim(),
      sessionId: this.sessionId,
    };
    console.log('[Signaling] 🧊 Sending ICE candidate:', {
      from: `"${message.from}"`,
      to: `"${message.to}"`,
      sessionId: message.sessionId
    });
    await this.sendSignal(message);
  }

  /**
   * Send signal via API
   */
  async sendSignal(message) {
    try {
      console.log('[Signaling] 📡 Sending signal to API:', {
        type: message.type,
        from: message.from,
        to: message.to,
        sessionId: this.sessionId
      });
      // Use skipRedirect to allow unauthenticated requests
      const response = await apiClient.post(`/telemedicine/signaling/${this.sessionId}`, message, {}, true);
      if (!response.success) {
        console.error('[Signaling] ❌ Failed to send signal:', response.error);
        throw new Error(response.error?.message || 'Failed to send signal');
      }
      console.log('[Signaling] ✅ Signal sent to API successfully');
      return response;
    } catch (error) {
      console.error('[Signaling] ❌ Failed to send signal:', error);
      throw error;
    }
  }

  /**
   * Start polling for signals
   */
  startPolling(interval = 1000) {
    this.pollingInterval = setInterval(async () => {
      await this.pollForSignals();
    }, interval);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for new signals
   */
  async pollForSignals() {
    try {
      // Use skipRedirect to allow unauthenticated requests
      const response = await apiClient.get(
        `/telemedicine/signaling/${this.sessionId}?userId=${encodeURIComponent(this.userId)}`,
        undefined,
        true // skipRedirect
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          console.log(`[Signaling] 🔍 Polling: Found ${response.data.length} message(s)`, response.data.map(m => ({ 
            type: m.type, 
            from: String(m.from).trim(), 
            to: String(m.to).trim() 
          })));
        }
        
        const currentUserId = String(this.userId).trim();
        console.log(`[Signaling] 🔍 Current userId: "${currentUserId}"`);
        
        response.data.forEach(message => {
          // Check if message is for this user (string comparison to handle different formats)
          const messageTo = String(message.to).trim();
          const messageFrom = String(message.from).trim();
          const isForMe = messageTo === currentUserId;
          
          console.log(`[Signaling] 🔍 Message check:`, {
            messageType: message.type,
            messageFrom,
            messageTo,
            currentUserId,
            isForMe,
            exactMatch: `"${messageTo}" === "${currentUserId}" = ${messageTo === currentUserId}`
          });
          
          if (this.onMessageCallback && isForMe) {
            console.log(`[Signaling] ✅ Received message for user: ${message.type} from ${messageFrom}`);
            this.onMessageCallback(message);
          } else if (this.onMessageCallback) {
            console.log(`[Signaling] ⏭️ Skipping message (not for me): ${message.type} from ${messageFrom} to ${messageTo} (my ID: ${currentUserId})`);
          }
        });
      } else {
        // Log when no messages are found
        if (response.success && (!response.data || !Array.isArray(response.data) || response.data.length === 0)) {
          // Only log occasionally to avoid spam
          if (Math.random() < 0.1) { // Log 10% of the time
            console.log(`[Signaling] 🔍 Polling: No messages found for userId "${String(this.userId).trim()}"`);
          }
        }
      }
    } catch (error) {
      // Silent fail for polling
      console.error('[Signaling] Polling error:', error);
    }
  }

  /**
   * Set callback for incoming messages
   */
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopPolling();
  }
}

