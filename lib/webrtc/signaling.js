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
    await this.sendSignal({
      type: 'offer',
      data: offer,
      from: this.userId,
      to: targetUserId,
      sessionId: this.sessionId,
    });
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
    await this.sendSignal({
      type: 'ice-candidate',
      data: candidate.toJSON(),
      from: this.userId,
      to: targetUserId,
      sessionId: this.sessionId,
    });
  }

  /**
   * Send signal via API
   */
  async sendSignal(message) {
    try {
      await apiClient.post(`/telemedicine/signaling/${this.sessionId}`, message);
    } catch (error) {
      console.error('Failed to send signal:', error);
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
      const response = await apiClient.get(
        `/telemedicine/signaling/${this.sessionId}?userId=${this.userId}`
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        response.data.forEach(message => {
          if (this.onMessageCallback && message.to === this.userId) {
            this.onMessageCallback(message);
          }
        });
      }
    } catch (error) {
      // Silent fail for polling
      console.error('Polling error:', error);
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

