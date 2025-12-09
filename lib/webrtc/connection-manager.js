/**
 * Connection Manager
 * Provides Zoom-level stability with automatic reconnection, quality monitoring, and error recovery
 */

export class ConnectionManager {
  constructor(options = {}) {
    this.onConnectionChange = options.onConnectionChange || (() => { });
    this.onQualityChange = options.onQualityChange || (() => { });
    this.onReconnect = options.onReconnect || (() => { });
    this.onError = options.onError || (() => { });

    // Reconnection state
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.reconnectTimer = null;
    this.isReconnecting = false;

    // Connection quality monitoring
    this.qualityCheckInterval = null;
    this.connectionQuality = 'UNKNOWN';
    this.statsInterval = null;
    this.lastStats = null;

    // State tracking
    this.connectionState = 'disconnected';
    this.iceConnectionState = 'new';
    this.peerConnectionState = 'new';
    this.lastConnectionTime = null;
    this.connectionStartTime = null;

    // Network monitoring
    this.networkOnline = navigator.onLine;
    this.setupNetworkListeners();

    // Visibility monitoring (tab switching)
    this.setupVisibilityListeners();

    // Stream health
    this.streamHealth = {
      video: { active: false, fps: 0, resolution: null },
      audio: { active: false, level: 0 }
    };
  }

  /**
   * Setup network online/offline listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[ConnectionManager] ✅ Network back online');
      this.networkOnline = true;
      if (this.connectionState === 'disconnected' && this.isReconnecting) {
        this.attemptReconnect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('[ConnectionManager] ❌ Network offline');
      this.networkOnline = false;
      this.updateConnectionState('disconnected', 'Network offline');
    });
  }

  /**
   * Setup page visibility listeners (tab switching)
   */
  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[ConnectionManager] ⏸️ Tab hidden - pausing quality checks');
        this.pauseQualityMonitoring();
      } else {
        console.log('[ConnectionManager] ▶️ Tab visible - resuming quality checks');
        this.resumeQualityMonitoring();
      }
    });
  }

  /**
   * Start monitoring connection quality
   */
  startQualityMonitoring(peerConnection, localStream, remoteStream) {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Check connection state every 2 seconds
    this.qualityCheckInterval = setInterval(() => {
      this.checkConnectionState(peerConnection);
    }, 2000);

    // Get detailed stats every 5 seconds
    this.statsInterval = setInterval(async () => {
      await this.getConnectionStats(peerConnection, localStream, remoteStream);
    }, 5000);
  }

  /**
   * Check connection state and quality
   */
  checkConnectionState(peerConnection) {
    if (!peerConnection) return;

    const iceState = peerConnection.iceConnectionState;
    const connectionState = peerConnection.connectionState;
    const signalingState = peerConnection.signalingState;

    // Update states
    this.iceConnectionState = iceState;
    this.peerConnectionState = connectionState;

    // Determine connection quality
    let quality = 'UNKNOWN';
    let status = 'connecting';

    if (iceState === 'connected' && connectionState === 'connected') {
      quality = 'EXCELLENT';
      status = 'connected';
      this.reconnectAttempts = 0; // Reset on successful connection
      this.isReconnecting = false;
    } else if (iceState === 'checking' || connectionState === 'connecting') {
      quality = 'GOOD';
      status = 'connecting';
    } else if (iceState === 'disconnected' || connectionState === 'disconnected') {
      quality = 'POOR';
      status = 'disconnected';
      // Trigger reconnection if not already reconnecting and we were previously connected
      if (!this.isReconnecting && (this.connectionState === 'connected' || this.connectionState === 'connecting')) {
        console.log('[ConnectionManager] ⚠️ Connection lost, attempting reconnection...');
        this.attemptReconnect();
      }
    } else if (iceState === 'failed' || connectionState === 'failed') {
      quality = 'POOR';
      status = 'failed';
      // Immediate reconnection attempt on failure
      if (!this.isReconnecting) {
        console.log('[ConnectionManager] ❌ Connection failed, attempting reconnection...');
        this.attemptReconnect();
      }
    } else if (iceState === 'checking' || connectionState === 'connecting') {
      // Still trying to connect
      quality = this.connectionQuality !== 'UNKNOWN' ? this.connectionQuality : 'GOOD';
      status = 'connecting';
    } else if (iceState === 'closed') {
      quality = 'UNKNOWN';
      status = 'closed';
    }

    // Update connection state with user-friendly messages
    if (this.connectionState !== status) {
      let userFriendlyReason = '';
      if (status === 'disconnected') {
        userFriendlyReason = 'Connection lost. Trying to reconnect...';
      } else if (status === 'failed') {
        userFriendlyReason = 'Connection failed. Trying again...';
      } else if (status === 'connected') {
        userFriendlyReason = 'Connected successfully';
      } else if (status === 'connecting') {
        userFriendlyReason = 'Connecting...';
      }
      this.updateConnectionState(status, userFriendlyReason);
    }

    // Update quality
    if (this.connectionQuality !== quality) {
      this.connectionQuality = quality;
      this.onQualityChange({
        quality,
        iceState,
        connectionState,
        signalingState
      });
    }
  }

  /**
   * Get detailed connection statistics
   */
  async getConnectionStats(peerConnection, localStream, remoteStream) {
    if (!peerConnection) return;

    try {
      const stats = await peerConnection.getStats();
      const statsMap = new Map();
      stats.forEach(report => statsMap.set(report.id, report));

      // Analyze video stats
      let videoStats = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
        packetsLost: 0,
        jitter: 0,
        rtt: 0,
        fps: 0,
        resolution: null
      };

      // Analyze audio stats
      let audioStats = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
        packetsLost: 0,
        jitter: 0,
        audioLevel: 0
      };

      statsMap.forEach(report => {
        // Video stats
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          videoStats.bytesReceived += report.bytesReceived || 0;
          videoStats.packetsReceived += report.packetsReceived || 0;
          videoStats.packetsLost += report.packetsLost || 0;
          videoStats.jitter += report.jitter || 0;
          videoStats.fps = report.framesPerSecond || 0;
          if (report.frameWidth && report.frameHeight) {
            videoStats.resolution = `${report.frameWidth}x${report.frameHeight}`;
          }
        }

        if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          videoStats.bytesSent += report.bytesSent || 0;
          videoStats.packetsSent += report.packetsSent || 0;
        }

        // Audio stats
        if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
          audioStats.bytesReceived += report.bytesReceived || 0;
          audioStats.packetsReceived += report.packetsReceived || 0;
          audioStats.packetsLost += report.packetsLost || 0;
          audioStats.jitter += report.jitter || 0;
        }

        if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
          audioStats.bytesSent += report.bytesSent || 0;
          audioStats.packetsSent += report.packetsSent || 0;
        }

        // RTT (Round Trip Time)
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          videoStats.rtt = report.currentRoundTripTime || 0;
          audioStats.rtt = report.currentRoundTripTime || 0;
        }
      });

      // Calculate quality metrics
      const videoLossRate = videoStats.packetsReceived > 0
        ? (videoStats.packetsLost / (videoStats.packetsReceived + videoStats.packetsLost)) * 100
        : 0;

      const audioLossRate = audioStats.packetsReceived > 0
        ? (audioStats.packetsLost / (audioStats.packetsReceived + audioStats.packetsLost)) * 100
        : 0;

      // Update stream health
      this.streamHealth = {
        video: {
          active: remoteStream && remoteStream.getVideoTracks().length > 0,
          fps: videoStats.fps,
          resolution: videoStats.resolution,
          lossRate: videoLossRate,
          rtt: videoStats.rtt,
          jitter: videoStats.jitter
        },
        audio: {
          active: remoteStream && remoteStream.getAudioTracks().length > 0,
          level: audioStats.audioLevel,
          lossRate: audioLossRate,
          rtt: audioStats.rtt,
          jitter: audioStats.jitter
        }
      };

      // Determine quality based on stats
      let quality = 'EXCELLENT';
      if (videoLossRate > 5 || audioLossRate > 5 || videoStats.rtt > 300) {
        quality = 'POOR';
      } else if (videoLossRate > 2 || audioLossRate > 2 || videoStats.rtt > 200) {
        quality = 'FAIR';
      } else if (videoLossRate > 0.5 || audioLossRate > 0.5 || videoStats.rtt > 100) {
        quality = 'GOOD';
      }

      this.connectionQuality = quality;
      this.lastStats = {
        video: videoStats,
        audio: audioStats,
        quality,
        timestamp: Date.now()
      };

      this.onQualityChange({
        quality,
        stats: this.lastStats,
        streamHealth: this.streamHealth
      });

    } catch (error) {
      console.error('[ConnectionManager] Failed to get stats:', error);
    }
  }

  /**
   * Update connection state
   */
  updateConnectionState(status, reason = '') {
    const previousState = this.connectionState;
    this.connectionState = status;

    if (status === 'connected') {
      if (previousState !== 'connected') {
        this.connectionStartTime = Date.now();
        this.lastConnectionTime = Date.now();
      } else {
        this.lastConnectionTime = Date.now();
      }
    }

    this.onConnectionChange({
      status,
      previousState,
      reason,
      quality: this.connectionQuality,
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: this.isReconnecting
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.isReconnecting) {
      return; // Already reconnecting
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ConnectionManager] ❌ Max reconnection attempts reached');
      this.updateConnectionState('failed', 'Unable to reconnect. Please refresh the page and try again.');
      this.onError(new Error('Unable to reconnect. Please refresh the page and try again.'));
      return;
    }

    if (!this.networkOnline) {
      console.log('[ConnectionManager] ⏸️ Network offline, waiting for network...');
      // Reset reconnecting flag so we can retry when network comes back
      this.isReconnecting = false;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[ConnectionManager] 🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    // Update connection state with user-friendly reconnection message
    this.updateConnectionState('reconnecting', `Reconnecting... (try ${this.reconnectAttempts} of ${this.maxReconnectAttempts})`);

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.isReconnecting = false;
      this.onReconnect({
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
    }, delay);
  }

  /**
   * Reset reconnection state (on successful connection)
   */
  resetReconnection() {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Pause quality monitoring (when tab is hidden)
   */
  pauseQualityMonitoring() {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Resume quality monitoring (when tab becomes visible)
   */
  resumeQualityMonitoring() {
    // Will be restarted when startQualityMonitoring is called again
  }

  /**
   * Stop all monitoring and cleanup
   */
  stop() {
    this.pauseQualityMonitoring();
    this.resetReconnection();
    this.connectionState = 'disconnected';
    this.connectionQuality = 'UNKNOWN';
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      connectionState: this.connectionState,
      iceConnectionState: this.iceConnectionState,
      peerConnectionState: this.peerConnectionState,
      quality: this.connectionQuality,
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: this.isReconnecting,
      networkOnline: this.networkOnline,
      streamHealth: this.streamHealth,
      lastStats: this.lastStats,
      connectionDuration: this.connectionStartTime
        ? Date.now() - this.connectionStartTime
        : 0
    };
  }
}
