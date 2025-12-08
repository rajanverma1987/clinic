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
      console.log('[VideoCallManager] Initializing peer wrapper...');
      await this.peerWrapper.initialize();
      console.log('[VideoCallManager] ✅ Peer wrapper initialized');

      // Get local stream and display it
      const localStream = this.peerWrapper.localStream;
      if (localStream && this.onLocalStream) {
        console.log('[VideoCallManager] ✅ Local stream ready, displaying video');
        this.onLocalStream(localStream);
      } else {
        console.warn('[VideoCallManager] ⚠️ Local stream not available');
      }

      // Start signaling polling
      console.log('[VideoCallManager] Starting signaling poll...');
      this.startSignalingPoll();

      this.isCallActive = true;
      this.onConnectionChange({ status: 'connecting' });
      
      console.log('[VideoCallManager] ✅ Call started. Waiting for remote peer...');
      console.log('[VideoCallManager] Call info:', {
        sessionId: this.sessionId,
        userId: this.userId,
        remoteUserId: this.remoteUserId,
        isInitiator: this.isInitiator
      });

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
      console.error('[VideoCallManager] apiClient not provided');
      return;
    }

    try {
      const signalData = {
        from: this.userId,
        to: this.remoteUserId,
        signal: data,
        timestamp: new Date().toISOString()
      };

      console.log('[VideoCallManager] Sending signal:', {
        sessionId: this.sessionId,
        from: this.userId,
        to: this.remoteUserId,
        signalType: data?.type || 'unknown',
        isInitiator: this.isInitiator
      });

      const response = await this.apiClient.post(
        `/telemedicine/signaling/${this.sessionId}`,
        signalData
      );

      if (!response.success) {
        console.error('[VideoCallManager] Failed to send signal:', response.error);
      } else {
        console.log('[VideoCallManager] Signal sent successfully:', response.data);
      }
    } catch (error) {
      console.error('[VideoCallManager] Error sending signal:', error);
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

    console.log('[VideoCallManager] Starting signaling poll for session:', this.sessionId, 'userId:', this.userId);

    // Poll for signals
    this.signalingInterval = setInterval(async () => {
      if (!this.apiClient) {
        console.error('[VideoCallManager] apiClient not provided');
        return;
      }

      try {
        const pollUrl = `/telemedicine/signaling/${this.sessionId}?userId=${this.userId}&lastSignalId=${this.lastSignalId || ''}`;
        console.log('[VideoCallManager] Polling for signals:', pollUrl);

        const response = await this.apiClient.get(pollUrl);

        console.log('[VideoCallManager] Poll response:', {
          success: response.success,
          hasData: !!response.data,
          signalCount: response.data?.signals?.length || 0,
          signals: response.data?.signals
        });

        if (response.success && response.data && response.data.signals) {
          const signals = response.data.signals;

          if (signals.length > 0) {
            console.log('[VideoCallManager] ✅ Received', signals.length, 'signal(s) from remote peer');
          }

          // Process each signal
          for (const signal of signals) {
            console.log('[VideoCallManager] Processing signal:', {
              id: signal.id,
              from: signal.from,
              signalType: signal.signal?.type || 'unknown',
              hasSdp: !!signal.signal?.sdp,
              hasCandidate: !!signal.signal?.candidate
            });

            if (this.peerWrapper) {
              try {
                this.peerWrapper.signal(signal.signal);
                this.lastSignalId = signal.id;
                console.log('[VideoCallManager] ✅ Signal processed successfully');
              } catch (error) {
                console.error('[VideoCallManager] ❌ Error processing signal:', error);
              }
            } else {
              console.error('[VideoCallManager] ❌ peerWrapper not available when processing signal');
            }
          }
        } else {
          // No signals received - this is normal if the other peer hasn't connected yet
          if (this.isCallActive && !this.peerWrapper?.isConnected) {
            // Only log occasionally to avoid spam
            if (Math.random() < 0.1) { // Log 10% of the time
              console.log('[VideoCallManager] Waiting for signals from remote peer...');
            }
          }
        }
      } catch (error) {
        console.error('[VideoCallManager] Error polling for signals:', error);
      }
    }, this.SIGNALING_POLL_INTERVAL);

    // Monitor connection state and provide better error messages
    let lastState = 'unknown';
    const connectionCheckInterval = setInterval(() => {
      if (!this.peerWrapper) return;

      const connectionState = this.peerWrapper.getConnectionState();
      
      // Only log if state changed
      if (connectionState !== lastState) {
        console.log('[VideoCallManager] ICE connection state changed:', lastState, '→', connectionState);
        lastState = connectionState;
        
        if (connectionState === 'checking') {
          console.log('[VideoCallManager] 🔄 ICE checking connection (this is good - connection attempt in progress)');
        } else if (connectionState === 'new') {
          console.log('[VideoCallManager] ⏳ ICE state: new (waiting for signals from remote peer)');
        }
      }

      if (connectionState === 'failed' || connectionState === 'disconnected') {
        clearInterval(connectionCheckInterval);
        this.handleError(new Error(
          'Peer-to-peer connection failed. This often happens when both users are behind firewalls or NAT. ' +
          'Consider configuring a TURN server for better connectivity.'
        ));
      } else if (connectionState === 'connected' || connectionState === 'completed') {
        clearInterval(connectionCheckInterval);
        console.log('[VideoCallManager] ✅ ICE connection successful!');
        // Connection successful, already handled by 'connect' event
      }
    }, 2000); // Check every 2 seconds

    // Timeout after 30 seconds if no connection
    setTimeout(() => {
      clearInterval(connectionCheckInterval);
      if (!this.peerWrapper?.isConnected && this.isCallActive) {
        const connectionState = this.peerWrapper?.getConnectionState() || 'unknown';
        let errorMsg = 'Connection timeout. ';

        if (connectionState === 'checking' || connectionState === 'new') {
          errorMsg += 'Unable to establish peer-to-peer connection. ';
          errorMsg += 'This often happens when both users are behind firewalls or NAT. ';
          errorMsg += 'A TURN server may be required for your network setup.';
        } else {
          errorMsg += 'Please check your network and try again.';
        }

        this.handleError(new Error(errorMsg));
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
    console.log('[VideoCallManager] Connection established!');
    this.isCallActive = true;
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
