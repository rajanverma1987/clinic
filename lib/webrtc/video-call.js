/**
 * WebRTC Video Call Manager
 * High-level API for video consultations
 */

import { WebRTCPeerConnection } from './peer-connection.js';
import { SignalingService } from './signaling.js';

export class VideoCallManager {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.peerConnection = new WebRTCPeerConnection();
    this.signaling = new SignalingService(config.sessionId, config.userId);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle remote stream
    this.peerConnection.onRemoteStream((stream) => {
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream);
      }
    });

    // Handle connection state
    this.peerConnection.onConnectionStateChange((state) => {
      console.log('Connection state:', state);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(state);
      }
    });

    // Handle ICE candidates
    this.peerConnection.onIceCandidate((candidate) => {
      this.signaling.sendIceCandidate(candidate, this.config.remoteUserId);
    });

    // Handle incoming signaling messages
    this.signaling.onMessage(async (message) => {
      try {
        switch (message.type) {
          case 'offer':
            await this.peerConnection.setRemoteDescription(message.data);
            const answer = await this.peerConnection.createAnswer();
            await this.signaling.sendAnswer(answer, message.from);
            break;

          case 'answer':
            await this.peerConnection.setRemoteDescription(message.data);
            break;

          case 'ice-candidate':
            await this.peerConnection.addIceCandidate(message.data);
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      }
    });
  }

  /**
   * Start the call
   */
  async startCall() {
    try {
      // Start local media
      const localStream = await this.peerConnection.startLocalStream();
      
      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(localStream);
      }

      // Start signaling
      this.signaling.startPolling();

      // If initiator, create and send offer
      if (this.config.isInitiator) {
        const offer = await this.peerConnection.createOffer();
        await this.signaling.sendOffer(offer, this.config.remoteUserId);
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Toggle microphone
   */
  toggleMute(muted) {
    this.peerConnection.toggleAudio(!muted);
  }

  /**
   * Toggle camera
   */
  toggleVideo(enabled) {
    this.peerConnection.toggleVideo(enabled);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    return await this.peerConnection.startScreenShare();
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    await this.peerConnection.stopScreenShare();
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    return await this.peerConnection.getStats();
  }

  /**
   * End the call and cleanup
   */
  endCall() {
    this.signaling.cleanup();
    this.peerConnection.close();
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.peerConnection.getLocalStream();
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.peerConnection.getRemoteStream();
  }
}

