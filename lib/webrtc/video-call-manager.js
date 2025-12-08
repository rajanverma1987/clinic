/**
 * Video Call Manager
 * High-level manager for WebRTC video calls using simple-peer
 * HIPAA-compliant with clear audio/video quality
 */

import { WebRTCPeerWrapper } from './simple-peer-wrapper.js';

/**
 * Video Call Manager
 * Manages the entire video call lifecycle
 */
export class VideoCallManager {
  constructor(options = {}) {
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.remoteUserId = options.remoteUserId;
    this.isInitiator = options.isInitiator || false;
    this.apiClient = options.apiClient; // Pass apiClient from component

    // Callbacks
    this.onLocalStream = options.onLocalStream || (() => { });
    this.onRemoteStream = options.onRemoteStream || (() => { });
    this.onConnectionChange = options.onConnectionChange || (() => { });
    this.onError = options.onError || (() => { });

    // State
    this.peerWrapper = null;
    this.localVideoElement = null;
    this.remoteVideoElement = null;
    this.signalingInterval = null;
    this.isCallActive = false;
    this.lastSignalId = null;

    // Signaling polling interval (1 second for real-time feel)
    this.SIGNALING_POLL_INTERVAL = 1000;
    this.SIGNALING_TIMEOUT = 30000; // 30 seconds timeout
  }

  /**
   * Start the video call
   */
  async startCall() {
    try {
      // Create peer wrapper
      this.peerWrapper = new WebRTCPeerWrapper({
        sessionId: this.sessionId,
        userId: this.userId,
        isInitiator: this.isInitiator,
        onSignal: (data) => this.handleSignal(data),
        onStream: (stream) => this.handleRemoteStream(stream),
        onConnect: () => this.handleConnect(),
        onClose: () => this.handleClose(),
        onError: (error) => this.handleError(error)
      });

      // Initialize peer (gets user media and creates peer connection)
      await this.peerWrapper.initialize();

      // Get local stream and display it
      const localStream = this.peerWrapper.localStream;
      if (localStream && this.onLocalStream) {
        this.onLocalStream(localStream);
      }

      // Start signaling polling
      this.startSignalingPoll();

      this.isCallActive = true;
      this.onConnectionChange({ status: 'connecting' });

      return true;
    } catch (error) {
      console.error('Failed to start call:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle outgoing signal (send to signaling server)
   */
  async handleSignal(data) {
    if (!this.apiClient) {
      console.error('apiClient not provided to VideoCallManager');
      return;
    }

    try {
      const response = await this.apiClient.post(
        `/telemedicine/signaling/${this.sessionId}`,
        {
          from: this.userId,
          to: this.remoteUserId,
          signal: data,
          timestamp: new Date().toISOString()
        }
      );

      if (!response.success) {
        console.error('Failed to send signal:', response.error);
      }
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }

  /**
   * Start polling for incoming signals
   */
  startSignalingPoll() {
    // Clear any existing interval
    if (this.signalingInterval) {
      clearInterval(this.signalingInterval);
    }

    // Poll for signals
    this.signalingInterval = setInterval(async () => {
      if (!this.apiClient) {
        console.error('apiClient not provided to VideoCallManager');
        return;
      }

      try {
        const response = await this.apiClient.get(
          `/telemedicine/signaling/${this.sessionId}?userId=${this.userId}&lastSignalId=${this.lastSignalId || ''}`
        );

        if (response.success && response.data && response.data.signals) {
          const signals = response.data.signals;

          // Process each signal
          for (const signal of signals) {
            if (this.peerWrapper) {
              this.peerWrapper.signal(signal.signal);
              this.lastSignalId = signal.id;
            }
          }
        }
      } catch (error) {
        console.error('Error polling for signals:', error);
      }
    }, this.SIGNALING_POLL_INTERVAL);

    // Timeout after 30 seconds if no connection
    setTimeout(() => {
      if (!this.peerWrapper?.isConnected && this.isCallActive) {
        this.handleError(new Error('Connection timeout. Please check your network and try again.'));
      }
    }, this.SIGNALING_TIMEOUT);
  }

  /**
   * Handle remote stream received
   */
  handleRemoteStream(stream) {
    if (this.onRemoteStream) {
      this.onRemoteStream(stream);
    }
    this.onConnectionChange({ status: 'connected' });
  }

  /**
   * Handle connection established
   */
  handleConnect() {
    this.onConnectionChange({ status: 'connected' });
  }

  /**
   * Handle connection closed
   */
  handleClose() {
    this.isCallActive = false;
    this.onConnectionChange({ status: 'disconnected' });
  }

  /**
   * Handle errors
   */
  handleError(error) {
    this.isCallActive = false;
    if (this.onError) {
      this.onError(error);
    }
    this.onConnectionChange({ status: 'error', error });
  }

  /**
   * Toggle mute/unmute
   */
  toggleMute(muted) {
    if (this.peerWrapper) {
      this.peerWrapper.toggleAudio(!muted);
    }
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(enabled) {
    if (this.peerWrapper) {
      this.peerWrapper.toggleVideo(enabled);
    }
  }

  /**
   * Get connection quality stats
   */
  async getConnectionStats() {
    if (this.peerWrapper) {
      return await this.peerWrapper.getStats();
    }
    return null;
  }

  /**
   * End the call
   */
  async endCall() {
    this.isCallActive = false;

    // Stop signaling polling
    if (this.signalingInterval) {
      clearInterval(this.signalingInterval);
      this.signalingInterval = null;
    }

    // Destroy peer connection
    if (this.peerWrapper) {
      this.peerWrapper.destroy();
      this.peerWrapper = null;
    }

    // Clear video elements
    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
      this.localVideoElement = null;
    }

    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
      this.remoteVideoElement = null;
    }

    this.onConnectionChange({ status: 'ended' });
  }
}
