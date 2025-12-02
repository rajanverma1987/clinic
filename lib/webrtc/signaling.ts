/**
 * WebRTC Signaling Service
 * Handles SDP offer/answer and ICE candidate exchange between peers
 */

import { apiClient } from '@/lib/api/client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to: string;
  sessionId: string;
}

export class SignalingService {
  private sessionId: string;
  private userId: string;
  private pollingInterval: NodeJS.Timeout | null = null;
  private onMessageCallback?: (message: SignalingMessage) => void;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  /**
   * Send offer to remote peer
   */
  async sendOffer(offer: RTCSessionDescriptionInit, targetUserId: string): Promise<void> {
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
  async sendAnswer(answer: RTCSessionDescriptionInit, targetUserId: string): Promise<void> {
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
  async sendIceCandidate(candidate: RTCIceCandidate, targetUserId: string): Promise<void> {
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
  private async sendSignal(message: SignalingMessage): Promise<void> {
    try {
      await apiClient.post(`/telemedicine/signaling/${this.sessionId}`, message);
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  }

  /**
   * Start polling for signals
   */
  startPolling(interval: number = 1000): void {
    this.pollingInterval = setInterval(async () => {
      await this.pollForSignals();
    }, interval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for new signals
   */
  private async pollForSignals(): Promise<void> {
    try {
      const response = await apiClient.get<SignalingMessage[]>(
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
  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopPolling();
  }
}

