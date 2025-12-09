/**
 * Video Call Manager
 * High-level manager for WebRTC video calls using simple-peer
 * HIPAA-compliant with clear audio/video quality
 */

import { WebRTCPeerWrapper } from './simple-peer-wrapper.js';
import { ConnectionManager } from './connection-manager.js';

/**
 * Video Call Manager
 * Manages the entire video call lifecycle with Zoom-level stability
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

    // Connection Manager for stability
    this.connectionManager = new ConnectionManager({
      onConnectionChange: (state) => {
        this.handleConnectionStateChange(state);
      },
      onQualityChange: (quality) => {
        this.handleQualityChange(quality);
      },
      onReconnect: (info) => {
        this.handleReconnect(info);
      },
      onError: (error) => {
        this.handleError(error);
      }
    });
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

      // Start connection quality monitoring
      if (this.peerWrapper && this.peerWrapper.peer && this.peerWrapper.peer._pc) {
        this.connectionManager.startQualityMonitoring(
          this.peerWrapper.peer._pc,
          this.peerWrapper.localStream,
          this.peerWrapper.remoteStream
        );
      }

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
        console.error('[VideoCallManager] ❌ Failed to send signal:', response.error);
        console.error('[VideoCallManager] Response:', response);
      } else {
        console.log('[VideoCallManager] ✅ Signal sent successfully to', this.remoteUserId);
        console.log('[VideoCallManager] Signal details:', {
          signalId: response.data?.id,
          signalType: data?.type || 'unknown',
          sent: response.data?.sent
        });
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
        // Don't immediately fail - let ConnectionManager handle reconnection
        console.warn('[VideoCallManager] ⚠️ Connection issue detected:', connectionState);
        // ConnectionManager will handle reconnection automatically
      } else if (connectionState === 'connected' || connectionState === 'completed') {
        clearInterval(connectionCheckInterval);
        console.log('[VideoCallManager] ✅ ICE connection successful!');
        // Connection successful, already handled by 'connect' event
      }
    }, 2000); // Check every 2 seconds

    // Extended timeout - give more time for connection (60 seconds)
    // ConnectionManager will handle reconnection, so we don't need to fail immediately
    setTimeout(() => {
      clearInterval(connectionCheckInterval);
      if (!this.peerWrapper?.isConnected && this.isCallActive) {
        const connectionState = this.peerWrapper?.getConnectionState() || 'unknown';

        // Only show error if still not connected after extended timeout
        if (connectionState === 'checking' || connectionState === 'new') {
          console.warn('[VideoCallManager] ⏳ Still connecting after timeout, but continuing...');
          // Don't fail - let ConnectionManager continue trying
        } else if (connectionState === 'failed') {
          // ConnectionManager will handle reconnection
          console.warn('[VideoCallManager] ⚠️ Connection failed, reconnection will be attempted');
        }
      }
    }, this.SIGNALING_TIMEOUT * 2); // Extended timeout: 60 seconds
  }

  /**
   * Handle remote stream received
   */
  handleRemoteStream(stream) {
    console.log('[VideoCallManager] ✅ Remote stream received');

    // Update connection manager with remote stream
    if (this.peerWrapper && this.peerWrapper.peer && this.peerWrapper.peer._pc) {
      this.connectionManager.startQualityMonitoring(
        this.peerWrapper.peer._pc,
        this.peerWrapper.localStream,
        stream
      );
    }

    if (this.onRemoteStream) {
      this.onRemoteStream(stream);
    }
    this.onConnectionChange({ status: 'connected' });
  }

  /**
   * Handle connection established
   */
  handleConnect() {
    console.log('[VideoCallManager] ✅ Peer connection established');
    this.connectionManager.resetReconnection();
    this.connectionManager.updateConnectionState('connected', 'Connected successfully');
    this.isCallActive = true;
    this.onConnectionChange({ status: 'connected' });
  }

  /**
   * Handle connection closed
   */
  handleClose() {
    console.log('[VideoCallManager] Peer connection closed');
    this.connectionManager.updateConnectionState('disconnected', 'The other person has left the call');
    this.isCallActive = false;
    this.onConnectionChange({ status: 'disconnected', reason: 'The other person has left the call' });
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error('[VideoCallManager] Error:', error);
    this.isCallActive = false;
    // Don't immediately fail - let ConnectionManager handle reconnection
    if (this.onError) {
      this.onError(error);
    }
    this.onConnectionChange({ status: 'error', error });
  }

  /**
   * Handle connection state changes from ConnectionManager
   */
  handleConnectionStateChange(state) {
    console.log('[VideoCallManager] Connection state change:', state);

    // Update main connection state
    if (state.status === 'connected') {
      this.isCallActive = true;
      this.onConnectionChange({ status: 'connected' });
    } else if (state.status === 'disconnected') {
      this.isCallActive = false;
      this.onConnectionChange({ status: 'disconnected', reason: state.reason });
    } else if (state.status === 'failed') {
      this.isCallActive = false;
      this.onConnectionChange({ status: 'error', error: state.reason });
    }
  }

  /**
   * Handle quality changes
   */
  handleQualityChange(quality) {
    // Log quality changes for debugging
    if (quality.quality && quality.quality !== 'UNKNOWN') {
      console.log('[VideoCallManager] Connection quality:', quality.quality);
    }
  }

  /**
   * Handle reconnection attempt
   */
  async handleReconnect(info) {
    console.log(`[VideoCallManager] 🔄 Reconnecting (attempt ${info.attempt}/${info.maxAttempts})...`);

    try {
      // Try to restart the call
      if (this.peerWrapper) {
        // Destroy existing peer
        await this.peerWrapper.destroy();
        this.peerWrapper = null;
      }

      // Reinitialize peer
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

      await this.peerWrapper.initialize();

      // Restart quality monitoring
      if (this.peerWrapper.peer && this.peerWrapper.peer._pc) {
        this.connectionManager.startQualityMonitoring(
          this.peerWrapper.peer._pc,
          this.peerWrapper.localStream,
          this.peerWrapper.remoteStream
        );
      }

      // Restart signaling
      this.startSignalingPoll();

      console.log('[VideoCallManager] ✅ Reconnection successful');
    } catch (error) {
      console.error('[VideoCallManager] ❌ Reconnection failed:', error);
      // ConnectionManager will retry automatically
    }
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
   * Start screen sharing with watermarking
   * Returns the screen share stream
   */
  async startScreenShare() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });

      // Apply watermark to screen share
      // TODO: Import and use watermark helper when available
      // For now, use the stream as-is (watermarking can be added via canvas overlay in UI)
      let processedStream = screenStream;

      // Add screen track to peer connection
      if (this.peerWrapper && this.peerWrapper.peer && this.peerWrapper.peer._pc) {
        const videoTrack = processedStream.getVideoTracks()[0];
        const senders = this.peerWrapper.peer._pc.getSenders();
        const videoSender = senders.find(s =>
          s.track && s.track.kind === 'video'
        );

        if (videoSender) {
          // Replace existing video track with screen share
          await videoSender.replaceTrack(videoTrack);
          console.log('[VideoCallManager] ✅ Screen share track replaced');
        } else {
          // No video sender found, add track
          processedStream.getTracks().forEach(track => {
            this.peerWrapper.peer._pc.addTrack(track, this.peerWrapper.localStream);
          });
          console.log('[VideoCallManager] ✅ Screen share track added');
        }

        // Update video track constraints for better screen share quality
        if (videoTrack) {
          // Set constraints to maintain aspect ratio and quality
          const settings = videoTrack.getSettings();
          console.log('[VideoCallManager] Screen share settings:', {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate
          });
        }

        // Handle screen share stop
        videoTrack.onended = () => {
          console.log('[VideoCallManager] Screen share ended by user');
          this.stopScreenShare();
        };
      }

      this.screenShareStream = processedStream;
      return processedStream;
    } catch (error) {
      console.error('[VideoCallManager] Failed to start screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing and restore camera
   */
  async stopScreenShare() {
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop());
      this.screenShareStream = null;

      // Restore camera video track
      if (this.peerWrapper && this.peerWrapper.localStream && this.peerWrapper.peer && this.peerWrapper.peer._pc) {
        const videoTrack = this.peerWrapper.localStream.getVideoTracks()[0];
        const senders = this.peerWrapper.peer._pc.getSenders();
        const videoSender = senders.find(s =>
          s.track && s.track.kind === 'video'
        );

        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
          console.log('[VideoCallManager] ✅ Camera track restored');
        } else {
          console.warn('[VideoCallManager] ⚠️ No video sender found to restore camera');
        }
      }
    }
  }

  /**
   * Check if currently sharing screen
   */
  isScreenSharing() {
    return !!this.screenShareStream && this.screenShareStream.active;
  }

  /**
   * End the call
   */
  async endCall() {
    console.log('[VideoCallManager] Ending call...');

    // Stop connection monitoring
    this.connectionManager.stop();

    // Stop screen sharing if active
    if (this.screenShareStream) {
      await this.stopScreenShare();
    }

    // Stop signaling polling
    if (this.signalingInterval) {
      clearInterval(this.signalingInterval);
      this.signalingInterval = null;
    }

    // Destroy peer connection
    if (this.peerWrapper) {
      await this.peerWrapper.destroy();
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

    this.isCallActive = false;
    this.connectionManager.updateConnectionState('closed', 'Call ended by user');
    this.onConnectionChange({ status: 'ended' });

    console.log('[VideoCallManager] ✅ Call ended');
  }

  /**
   * Get connection status and quality
   */
  getConnectionStatus() {
    return this.connectionManager.getStatus();
  }
}
