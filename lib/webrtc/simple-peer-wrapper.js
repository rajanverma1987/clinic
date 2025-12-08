/**
 * Simple-Peer Wrapper for WebRTC
 * HIPAA-compliant video calling with clear audio/video quality
 */

import Peer from 'simple-peer';

/**
 * WebRTC Peer Wrapper
 * Handles peer-to-peer connection using simple-peer
 */
export class WebRTCPeerWrapper {
  constructor(options = {}) {
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.isInitiator = options.isInitiator || false;
    this.onSignal = options.onSignal || (() => { });
    this.onStream = options.onStream || (() => { });
    this.onConnect = options.onConnect || (() => { });
    this.onClose = options.onClose || (() => { });
    this.onError = options.onError || (() => { });

    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isConnected = false;

    // High-quality video/audio constraints for clear communication
    this.videoConstraints = {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      frameRate: { ideal: 30, min: 24 },
      facingMode: 'user'
    };

    this.audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1
    };
  }

  /**
   * Get user media (camera + microphone)
   * HIPAA: Media stays local, never sent to third-party servers
   */
  async getUserMedia() {
    try {
      // Log available APIs for debugging
      console.log('[WebRTC] Available APIs:', {
        mediaDevices: !!navigator.mediaDevices,
        mediaDevicesGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        getUserMedia: !!navigator.getUserMedia,
        webkitGetUserMedia: !!navigator.webkitGetUserMedia,
        mozGetUserMedia: !!navigator.mozGetUserMedia,
        permissions: !!navigator.permissions,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        location: window.location.href
      });

      // Check if we're in a secure context (required for getUserMedia)
      if (!window.isSecureContext && window.location.protocol !== 'http:' && !window.location.hostname.includes('localhost')) {
        throw new Error('Camera and microphone access requires a secure connection (HTTPS). Please use HTTPS or localhost.');
      }

      // Check permissions first (if API is available)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });

          console.log('[WebRTC] Permission status:', {
            camera: cameraPermission.state,
            microphone: microphonePermission.state
          });

          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            throw new Error('Camera and microphone permissions are denied. Please enable them in your browser settings and refresh the page.');
          }
        } catch (permError) {
          // Permission API might not be fully supported, continue anyway
          console.warn('[WebRTC] Permission API check failed, continuing:', permError);
        }
      }

      // Find available getUserMedia implementation with multiple fallbacks
      let getUserMediaFunc = null;

      // Try standard API first (most modern)
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        getUserMediaFunc = (constraints) => navigator.mediaDevices.getUserMedia(constraints);
        console.log('[WebRTC] Using navigator.mediaDevices.getUserMedia');
      }
      // Try legacy navigator.getUserMedia
      else if (navigator.getUserMedia && typeof navigator.getUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.getUserMedia(constraints, resolve, reject);
        });
        console.log('[WebRTC] Using navigator.getUserMedia (legacy)');
      }
      // Try webkit prefix (older Chrome/Safari)
      else if (navigator.webkitGetUserMedia && typeof navigator.webkitGetUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.webkitGetUserMedia(constraints, resolve, reject);
        });
        console.log('[WebRTC] Using navigator.webkitGetUserMedia');
      }
      // Try moz prefix (Firefox)
      else if (navigator.mozGetUserMedia && typeof navigator.mozGetUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.mozGetUserMedia(constraints, resolve, reject);
        });
        console.log('[WebRTC] Using navigator.mozGetUserMedia');
      }

      if (!getUserMediaFunc) {
        const errorDetails = {
          mediaDevices: !!navigator.mediaDevices,
          mediaDevicesGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          getUserMedia: !!navigator.getUserMedia,
          webkitGetUserMedia: !!navigator.webkitGetUserMedia,
          mozGetUserMedia: !!navigator.mozGetUserMedia,
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        };
        console.error('[WebRTC] No getUserMedia implementation found:', errorDetails);
        throw new Error('getUserMedia is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari. Make sure you are using HTTPS or localhost.');
      }

      console.log('[WebRTC] Requesting camera and microphone access...');

      // Request media with explicit constraints
      // This will trigger the browser's permission prompt
      const stream = await getUserMediaFunc({
        video: this.videoConstraints,
        audio: this.audioConstraints
      });

      console.log('[WebRTC] Media access granted:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackSettings: stream.getVideoTracks()[0]?.getSettings(),
        audioTrackSettings: stream.getAudioTracks()[0]?.getSettings()
      });

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('[WebRTC] Failed to get user media:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to access camera and microphone. ';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera and microphone access was denied. ';
        errorMessage += 'Please click the camera/microphone icon in your browser\'s address bar and allow access, then try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. ';
        errorMessage += 'Please connect a camera and microphone to your device and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is already in use by another application. ';
        errorMessage += 'Please close other applications using your camera/microphone and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Your device does not support the requested video/audio settings. ';
        errorMessage += 'Please try again with lower quality settings.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your device permissions and try again.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Initialize peer connection
   * HIPAA: Uses DTLS-SRTP encryption (built into WebRTC)
   */
  async initialize() {
    if (!this.localStream) {
      await this.getUserMedia();
    }

    // STUN servers for NAT traversal (free, HIPAA-compliant)
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    // Create peer with high-quality settings
    this.peer = new Peer({
      initiator: this.isInitiator,
      trickle: false, // Send all ICE candidates at once (simpler)
      stream: this.localStream,
      config: {
        iceServers: iceServers,
        iceCandidatePoolSize: 10 // Pre-gather candidates for faster connection
      }
      // Removed sdpTransform - it was causing parsing errors
      // Browser will automatically select best codecs
    });

    // Handle signaling data (SDP offer/answer and ICE candidates)
    this.peer.on('signal', (data) => {
      this.onSignal(data);
    });

    // Handle remote stream (patient/doctor video)
    this.peer.on('stream', (stream) => {
      this.remoteStream = stream;
      this.onStream(stream);
    });

    // Handle connection established
    this.peer.on('connect', () => {
      this.isConnected = true;
      this.onConnect();
    });

    // Handle connection closed
    this.peer.on('close', () => {
      this.isConnected = false;
      this.onClose();
    });

    // Handle errors
    this.peer.on('error', (error) => {
      console.error('WebRTC peer error:', error);
      this.onError(error);
    });
  }

  /**
   * Process incoming signal (SDP or ICE candidate)
   */
  signal(data) {
    if (this.peer) {
      this.peer.signal(data);
    }
  }

  /**
   * Toggle audio (mute/unmute)
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video (on/off)
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Get connection stats (for quality monitoring)
   */
  async getStats() {
    if (!this.peer || !this.peer._pc) {
      return null;
    }

    try {
      const stats = await this.peer._pc.getStats();
      const statsObj = {};

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
          statsObj[report.type] = {
            bytesReceived: report.bytesReceived || 0,
            bytesSent: report.bytesSent || 0,
            packetsLost: report.packetsLost || 0,
            jitter: report.jitter || 0,
            roundTripTime: report.roundTripTime || 0
          };
        }
      });

      return statsObj;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Cleanup and destroy peer connection
   * HIPAA: Ensures no data leaks after call ends
   */
  destroy() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    // Destroy peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isConnected = false;
  }
}
