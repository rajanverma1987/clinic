/**
 * Simple-Peer Wrapper for WebRTC
 * HIPAA-compliant video calling with clear audio/video quality
 */

import Peer from 'simple-peer';
import { logger } from '@/lib/utils/logger.js';

/**
 * WebRTC Peer Wrapper
 * Handles peer-to-peer connection using simple-peer
 */
export class WebRTCPeerWrapper {
  constructor(options = {}) {
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.isInitiator = options.isInitiator || false;
    this._locationForLog = options.location ?? '';
    this.onSignal = options.onSignal || (() => { });
    this.onStream = options.onStream || (() => { });
    this.onConnect = options.onConnect || (() => { });
    this.onClose = options.onClose || (() => { });
    this.onError = options.onError || (() => { });

    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isConnected = false;

    // Use only "ideal" (optional) constraints to avoid OverconstrainedError on devices
    // that can't meet min resolution/sampleRate. Fallback to minimal constraints if needed.
    this.videoConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 24 },
      facingMode: { ideal: 'user' }
    };

    this.audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
      // Avoid sampleRate, channelCount, goog* — many devices don't support them and throw OverconstrainedError
    };
  }

  /**
   * Get user media (camera + microphone)
   * HIPAA: Media stays local, never sent to third-party servers
   */
  async getUserMedia() {
    try {
      // Log available APIs for debugging
      logger.info('[WebRTC] Available APIs:', {
        mediaDevices: !!navigator.mediaDevices,
        mediaDevicesGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        getUserMedia: !!navigator.getUserMedia,
        webkitGetUserMedia: !!navigator.webkitGetUserMedia,
        mozGetUserMedia: !!navigator.mozGetUserMedia,
        permissions: !!navigator.permissions,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        location: this._locationForLog
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

          logger.info('[WebRTC] Permission status:', {
            camera: cameraPermission.state,
            microphone: microphonePermission.state
          });

          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            throw new Error('Camera and microphone permissions are denied. Please enable them in your browser settings and refresh the page.');
          }
        } catch (permError) {
          // Permission API might not be fully supported, continue anyway
          logger.warn('[WebRTC] Permission API check failed, continuing:', permError);
        }
      }

      // Find available getUserMedia implementation with multiple fallbacks
      let getUserMediaFunc = null;

      // Try standard API first (most modern)
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        getUserMediaFunc = (constraints) => navigator.mediaDevices.getUserMedia(constraints);
        logger.info('[WebRTC] Using navigator.mediaDevices.getUserMedia');
      }
      // Try legacy navigator.getUserMedia
      else if (navigator.getUserMedia && typeof navigator.getUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.getUserMedia(constraints, resolve, reject);
        });
        logger.info('[WebRTC] Using navigator.getUserMedia (legacy)');
      }
      // Try webkit prefix (older Chrome/Safari)
      else if (navigator.webkitGetUserMedia && typeof navigator.webkitGetUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.webkitGetUserMedia(constraints, resolve, reject);
        });
        logger.info('[WebRTC] Using navigator.webkitGetUserMedia');
      }
      // Try moz prefix (Firefox)
      else if (navigator.mozGetUserMedia && typeof navigator.mozGetUserMedia === 'function') {
        getUserMediaFunc = (constraints) => new Promise((resolve, reject) => {
          navigator.mozGetUserMedia(constraints, resolve, reject);
        });
        logger.info('[WebRTC] Using navigator.mozGetUserMedia');
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
        logger.error('[WebRTC] No getUserMedia implementation found:', errorDetails);
        throw new Error('getUserMedia is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari. Make sure you are using HTTPS or localhost.');
      }

      logger.info('[WebRTC] Requesting camera and microphone access...');

      // Request media: try preferred constraints first, fallback to minimal on OverconstrainedError
      let stream;
      try {
        stream = await getUserMediaFunc({
          video: this.videoConstraints,
          audio: this.audioConstraints
        });
      } catch (firstError) {
        if (firstError.name === 'OverconstrainedError' || firstError.name === 'ConstraintNotSatisfiedError') {
          logger.warn('[WebRTC] Preferred constraints not supported, retrying with minimal constraints:', firstError.message || firstError.constraint);
          stream = await getUserMediaFunc({ video: true, audio: true });
        } else {
          throw firstError;
        }
      }

      // Log actual video settings achieved
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      const videoSettings = videoTrack?.getSettings();
      const audioSettings = audioTrack?.getSettings();

      logger.info('[WebRTC] Media access granted:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackSettings: videoSettings,
        audioTrackSettings: audioSettings,
        actualResolution: videoSettings ? `${videoSettings.width}x${videoSettings.height}` : 'unknown',
        actualFrameRate: videoSettings?.frameRate || 'unknown',
        actualAspectRatio: videoSettings ? (videoSettings.width / videoSettings.height).toFixed(2) : 'unknown'
      });

      // Apply additional quality settings to video track
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();
        logger.info('[WebRTC] Video capabilities:', {
          width: capabilities.width,
          height: capabilities.height,
          frameRate: capabilities.frameRate,
          aspectRatio: capabilities.aspectRatio
        });

        // Try to apply optional quality settings if supported (ideal only to avoid OverconstrainedError)
        if (videoTrack.applyConstraints) {
          try {
            await videoTrack.applyConstraints({
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 24 }
            });
            logger.info('[WebRTC] ✅ Applied video constraints');
          } catch (constraintError) {
            logger.warn('[WebRTC] Could not apply ideal constraints, using defaults:', constraintError);
          }
        }
      }

      this.localStream = stream;
      return stream;
    } catch (error) {
      logger.error('[WebRTC] Failed to get user media:', error);

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
    // Google provides free STUN servers (already configured below)
    // Note: Google does NOT provide free TURN servers - you need to set up your own
    // TURN servers may be needed if both peers are behind NAT/firewalls (proxy scenarios)
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    logger.info('[WebRTC] Using Google STUN servers (free)');

    // Add TURN server if configured (needed for proxy/NAT scenarios)
    // Get from environment variables
    if (typeof window !== 'undefined') {
      const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER_URL;
      const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
      const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

      if (turnServer) {
        logger.info('[WebRTC] ✅ TURN server found in environment:', turnServer);
        const turnConfig = {
          urls: turnServer
        };

        // Only add username/credential if provided (some public TURN servers don't need them)
        if (turnUsername && turnCredential) {
          turnConfig.username = turnUsername;
          turnConfig.credential = turnCredential;
          logger.info('[WebRTC] ✅ TURN server configured with authentication (username:', turnUsername, ')');
        } else {
          logger.warn('[WebRTC] ⚠️ TURN server configured without authentication');
        }

        iceServers.push(turnConfig);
        logger.info('[WebRTC] ✅ TURN server added to ICE servers list');
      } else {
        logger.error('[WebRTC] ❌ No TURN server configured!');
        logger.error('[WebRTC] Connection will likely fail if both peers are behind NAT/firewalls.');
        logger.error('[WebRTC] Please set NEXT_PUBLIC_TURN_SERVER_URL in .env.local and restart Next.js app');
        logger.error('[WebRTC] See CursorMD/OVH_TURN_SERVER_SETUP.md for setup instructions');
      }
    }

    // Create peer with high-quality settings
    logger.info('[WebRTC] Creating peer connection with ICE servers:', iceServers.length, 'servers configured');
    logger.info('[WebRTC] Peer configuration:', {
      isInitiator: this.isInitiator,
      hasLocalStream: !!this.localStream,
      iceServersCount: iceServers.length,
      iceServers: iceServers.map(s => ({
        urls: s.urls,
        hasAuth: !!(s.username && s.credential)
      }))
    });

    // SDP transform to prefer high-quality codecs and set bandwidth
    const sdpTransform = (sdp) => {
      try {
        // Set bandwidth for high quality (2.5 Mbps for video, 128 kbps for audio)
        // Update video bandwidth
        if (sdp.includes('m=video')) {
          // Remove existing video bandwidth lines
          sdp = sdp.replace(/b=AS:\d+[\r\n]/g, '');
          sdp = sdp.replace(/b=TIAS:\d+[\r\n]/g, '');

          // Add high-quality video bandwidth after video media line
          sdp = sdp.replace(/(m=video \d+ RTP\/SAVPF [\d\s]+[\r\n]+)/, (match) => {
            return match + 'b=AS:2500\r\n';
          });
        }

        // Update audio bandwidth
        if (sdp.includes('m=audio')) {
          // Remove existing audio bandwidth lines
          sdp = sdp.replace(/b=AS:\d+[\r\n]/g, '');
          sdp = sdp.replace(/b=TIAS:\d+[\r\n]/g, '');

          // Add audio bandwidth after audio media line
          sdp = sdp.replace(/(m=audio \d+ RTP\/SAVPF [\d\s]+[\r\n]+)/, (match) => {
            return match + 'b=AS:128\r\n';
          });
        }

        // Prefer VP9 codec by reordering (if available)
        // VP9 typically has payload type 96 or 98
        const videoMatch = sdp.match(/m=video (\d+) RTP\/SAVPF ([\d\s]+)/);
        if (videoMatch) {
          const port = videoMatch[1];
          const codecs = videoMatch[2].trim().split(/\s+/);

          // Try to move VP9/VP8 to front if present
          const vp9Index = codecs.findIndex(c => {
            // Check if this codec is VP9 by looking at rtpmap
            const rtpmapMatch = sdp.match(new RegExp(`a=rtpmap:${c} VP9/\\d+`));
            return rtpmapMatch !== null;
          });

          const vp8Index = codecs.findIndex(c => {
            const rtpmapMatch = sdp.match(new RegExp(`a=rtpmap:${c} VP8/\\d+`));
            return rtpmapMatch !== null;
          });

          if (vp9Index > 0) {
            // Move VP9 to front
            const vp9Codec = codecs.splice(vp9Index, 1)[0];
            codecs.unshift(vp9Codec);
            sdp = sdp.replace(/m=video \d+ RTP\/SAVPF [\d\s]+/, `m=video ${port} RTP/SAVPF ${codecs.join(' ')}`);
          } else if (vp8Index > 0) {
            // Move VP8 to front if VP9 not available
            const vp8Codec = codecs.splice(vp8Index, 1)[0];
            codecs.unshift(vp8Codec);
            sdp = sdp.replace(/m=video \d+ RTP\/SAVPF [\d\s]+/, `m=video ${port} RTP/SAVPF ${codecs.join(' ')}`);
          }
        }

        logger.info('[WebRTC] ✅ SDP transformed for high quality');
        return sdp;
      } catch (error) {
        logger.warn('[WebRTC] ⚠️ SDP transform error, using original SDP:', error);
        return sdp; // Return original if transform fails
      }
    };

    this.peer = new Peer({
      initiator: this.isInitiator,
      trickle: true, // Send ICE candidates as they arrive (better for TURN)
      stream: this.localStream,
      config: {
        iceServers: iceServers,
        iceCandidatePoolSize: 10, // Pre-gather candidates for faster connection
        // Additional quality settings
        bundlePolicy: 'max-bundle', // Bundle all media streams
        rtcpMuxPolicy: 'require' // Require RTCP multiplexing
      },
      sdpTransform: sdpTransform // Apply codec preferences
    });

    logger.info('[WebRTC] Peer created with trickle ICE enabled (better for TURN servers)');

    logger.info('[WebRTC] ✅ Peer connection created successfully');
    logger.info('[WebRTC] Peer instance:', {
      destroyed: this.peer.destroyed,
      connected: this.peer.connected,
      hasPC: !!this.peer._pc,
      isInitiator: this.isInitiator
    });

    // If initiator, the peer will generate an offer immediately
    // If receiver, the peer will wait for an offer before generating an answer
    if (this.isInitiator) {
      logger.info('[WebRTC] 🎯 This peer is the INITIATOR - will generate SDP offer');
    } else {
      logger.info('[WebRTC] 🎯 This peer is the RECEIVER - waiting for SDP offer from initiator');
    }

    // Handle signaling data (SDP offer/answer and ICE candidates)
    this.peer.on('signal', (data) => {
      logger.info('[WebRTC] ✅ Signal generated:', {
        type: data.type,
        isInitiator: this.isInitiator,
        hasSdp: !!data.sdp,
        hasCandidate: !!data.candidate,
        sdpLength: data.sdp ? data.sdp.length : 0,
        candidateCount: data.candidate ? 1 : 0
      });

      if (data.type === 'offer') {
        logger.info('[WebRTC] 📤 Sending SDP OFFER to remote peer');
      } else if (data.type === 'answer') {
        logger.info('[WebRTC] 📤 Sending SDP ANSWER to remote peer');
      } else if (data.candidate) {
        logger.info('[WebRTC] 📤 Sending ICE candidate to remote peer');
      }

      this.onSignal(data);
    });

    // Handle remote stream (patient/doctor video)
    this.peer.on('stream', (stream) => {
      logger.info('[WebRTC] Remote stream received:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Log remote video quality
      const remoteVideoTrack = stream.getVideoTracks()[0];
      if (remoteVideoTrack) {
        const settings = remoteVideoTrack.getSettings();
        logger.info('[WebRTC] Remote video quality:', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          aspectRatio: settings.aspectRatio ? (settings.width / settings.height).toFixed(2) : 'unknown'
        });
      }

      this.remoteStream = stream;
      this.onStream(stream);
    });

    // Handle connection established with robust error handling
    this.peer.on('connect', () => {
      logger.info('[WebRTC] ✅ Peer connection established!');
      this.isConnected = true;
      if (this.onConnect) {
        try {
          this.onConnect();
        } catch (error) {
          logger.error('[WebRTC] Error in onConnect callback:', error);
        }
      }
    });

    // Handle connection closed
    this.peer.on('close', () => {
      logger.info('[WebRTC] Peer connection closed');
      this.isConnected = false;
      if (this.onClose) {
        try {
          this.onClose();
        } catch (error) {
          logger.error('[WebRTC] Error in onClose callback:', error);
        }
      }
    });

    // Handle errors
    this.peer.on('error', (error) => {
      logger.error('[WebRTC] Peer error:', error);
      this.isConnected = false;
      if (this.onError) {
        try {
          this.onError(error);
        } catch (err) {
          logger.error('[WebRTC] Error in onError callback:', err);
        }
      }
    });

    // Additional event listeners for debugging
    this.peer.on('iceStateChange', (state) => {
      logger.info('[WebRTC] ICE connection state changed:', state);
      if (state === 'failed') {
        logger.error('[WebRTC] ❌ ICE connection failed. Check TURN server configuration and network.');
      } else if (state === 'connected' || state === 'completed') {
        logger.info('[WebRTC] ✅ ICE connection successful!');
      } else if (state === 'checking') {
        logger.info('[WebRTC] 🔄 ICE connection checking... (trying to connect)');
      } else if (state === 'new') {
        logger.info('[WebRTC] ⏳ ICE connection state: new (waiting to start)');
      }
    });

    this.peer.on('connectionStateChange', (state) => {
      logger.info('[WebRTC] Connection state changed:', state);
    });

    // Log ICE candidates to see if TURN is being used
    // Wait a bit for peer._pc to be available
    setTimeout(() => {
      if (this.peer && this.peer._pc) {
        logger.info('[WebRTC] Setting up ICE candidate listeners...');

        this.peer._pc.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            logger.info('[WebRTC] ICE candidate generated:', {
              type: event.candidate.type,
              protocol: event.candidate.protocol,
              address: event.candidate.address,
              port: event.candidate.port,
              isRelay: event.candidate.type === 'relay' // TURN server provides relay candidates
            });
            if (event.candidate.type === 'relay') {
              logger.info('[WebRTC] ✅ TURN server is being used (relay candidate found)');
            } else if (event.candidate.type === 'host') {
              logger.info('[WebRTC] 📍 Direct connection candidate (host)');
            } else if (event.candidate.type === 'srflx') {
              logger.info('[WebRTC] 🌐 STUN candidate (server reflexive)');
            }
          } else {
            logger.info('[WebRTC] ✅ All ICE candidates gathered (null candidate event)');
          }
        });

        this.peer._pc.addEventListener('iceconnectionstatechange', () => {
          const state = this.peer._pc.iceConnectionState;
          logger.info('[WebRTC] ICE Connection State:', state);
          if (state === 'failed') {
            logger.error('[WebRTC] ❌ ICE connection failed. Possible causes:');
            logger.error('[WebRTC] 1. TURN server not accessible');
            logger.error('[WebRTC] 2. TURN credentials incorrect');
            logger.error('[WebRTC] 3. Firewall blocking TURN server');
            logger.error('[WebRTC] 4. Network issues');
          } else if (state === 'checking') {
            logger.info('[WebRTC] 🔄 ICE checking connection...');
          } else if (state === 'connected') {
            logger.info('[WebRTC] ✅ ICE connected!');
          } else if (state === 'completed') {
            logger.info('[WebRTC] ✅✅ ICE connection completed!');
          }
        });

        this.peer._pc.addEventListener('icegatheringstatechange', () => {
          logger.info('[WebRTC] ICE Gathering State:', this.peer._pc.iceGatheringState);
        });
      } else {
        logger.warn('[WebRTC] ⚠️ peer._pc not available yet, will retry...');
      }
    }, 100);
  }

  /**
   * Process incoming signal (SDP or ICE candidate)
   */
  signal(data) {
    if (this.peer) {
      logger.info('[WebRTC] 📥 Processing incoming signal:', {
        type: data.type,
        isInitiator: this.isInitiator,
        hasSdp: !!data.sdp,
        hasCandidate: !!data.candidate,
        sdpLength: data.sdp ? data.sdp.length : 0
      });

      if (data.type === 'offer') {
        logger.info('[WebRTC] 📥 Received SDP OFFER from remote peer');
      } else if (data.type === 'answer') {
        logger.info('[WebRTC] 📥 Received SDP ANSWER from remote peer');
      } else if (data.candidate) {
        logger.info('[WebRTC] 📥 Received ICE candidate from remote peer');
      }

      try {
        this.peer.signal(data);
        logger.info('[WebRTC] ✅ Signal processed successfully');
      } catch (error) {
        logger.error('[WebRTC] ❌ Error processing signal:', error);
        throw error;
      }
    } else {
      logger.error('[WebRTC] ❌ Cannot process signal - peer not initialized');
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
      let connectionType = 'unknown';

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
        // Check connection type (direct peer-to-peer vs relayed through TURN)
        if (report.type === 'candidate-pair' && report.selected) {
          connectionType = report.localCandidateId && report.remoteCandidateId
            ? 'relay' // Using TURN server
            : 'direct'; // Direct peer-to-peer
        }
      });

      statsObj.connectionType = connectionType;
      return statsObj;
    } catch (error) {
      logger.error('[WebRTC] Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Get ICE connection state
   */
  getConnectionState() {
    if (!this.peer || !this.peer._pc) {
      return 'unknown';
    }
    return this.peer._pc.iceConnectionState || 'unknown';
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
