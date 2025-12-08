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
    // Google provides free STUN servers (already configured below)
    // Note: Google does NOT provide free TURN servers - you need to set up your own
    // TURN servers may be needed if both peers are behind NAT/firewalls (proxy scenarios)
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    console.log('[WebRTC] Using Google STUN servers (free)');

    // Add TURN server if configured (needed for proxy/NAT scenarios)
    // Get from environment variables
    if (typeof window !== 'undefined') {
      const turnServer = process.env.NEXT_PUBLIC_TURN_SERVER_URL;
      const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
      const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

      if (turnServer) {
        console.log('[WebRTC] ✅ TURN server found in environment:', turnServer);
        const turnConfig = {
          urls: turnServer
        };

        // Only add username/credential if provided (some public TURN servers don't need them)
        if (turnUsername && turnCredential) {
          turnConfig.username = turnUsername;
          turnConfig.credential = turnCredential;
          console.log('[WebRTC] ✅ TURN server configured with authentication (username:', turnUsername, ')');
        } else {
          console.warn('[WebRTC] ⚠️ TURN server configured without authentication');
        }

        iceServers.push(turnConfig);
        console.log('[WebRTC] ✅ TURN server added to ICE servers list');
      } else {
        console.error('[WebRTC] ❌ No TURN server configured!');
        console.error('[WebRTC] Connection will likely fail if both peers are behind NAT/firewalls.');
        console.error('[WebRTC] Please set NEXT_PUBLIC_TURN_SERVER_URL in .env.local and restart Next.js app');
        console.error('[WebRTC] See CursorMD/OVH_TURN_SERVER_SETUP.md for setup instructions');
      }
    }

    // Create peer with high-quality settings
    console.log('[WebRTC] Creating peer connection with ICE servers:', iceServers.length, 'servers configured');
    console.log('[WebRTC] Peer configuration:', {
      isInitiator: this.isInitiator,
      hasLocalStream: !!this.localStream,
      iceServersCount: iceServers.length,
      iceServers: iceServers.map(s => ({
        urls: s.urls,
        hasAuth: !!(s.username && s.credential)
      }))
    });

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

    console.log('[WebRTC] ✅ Peer connection created successfully');
    console.log('[WebRTC] Peer instance:', {
      destroyed: this.peer.destroyed,
      connected: this.peer.connected,
      hasPC: !!this.peer._pc
    });

    // Handle signaling data (SDP offer/answer and ICE candidates)
    this.peer.on('signal', (data) => {
      console.log('[WebRTC] ✅ Signal generated:', {
        type: data.type,
        isInitiator: this.isInitiator,
        hasSdp: !!data.sdp,
        hasCandidate: !!data.candidate,
        sdpLength: data.sdp ? data.sdp.length : 0,
        candidateCount: data.candidate ? 1 : 0
      });
      
      if (data.type === 'offer') {
        console.log('[WebRTC] 📤 Sending SDP OFFER to remote peer');
      } else if (data.type === 'answer') {
        console.log('[WebRTC] 📤 Sending SDP ANSWER to remote peer');
      } else if (data.candidate) {
        console.log('[WebRTC] 📤 Sending ICE candidate to remote peer');
      }
      
      this.onSignal(data);
    });

    // Handle remote stream (patient/doctor video)
    this.peer.on('stream', (stream) => {
      console.log('[WebRTC] Remote stream received:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      this.remoteStream = stream;
      this.onStream(stream);
    });

    // Handle connection established
    this.peer.on('connect', () => {
      console.log('[WebRTC] Peer connection established!');
      this.isConnected = true;
      this.onConnect();
    });

    // Handle connection closed
    this.peer.on('close', () => {
      console.log('[WebRTC] Peer connection closed');
      this.isConnected = false;
      this.onClose();
    });

    // Handle errors
    this.peer.on('error', (error) => {
      console.error('[WebRTC] Peer error:', error);
      this.onError(error);
    });

    // Additional event listeners for debugging
    this.peer.on('iceStateChange', (state) => {
      console.log('[WebRTC] ICE connection state changed:', state);
      if (state === 'failed') {
        console.error('[WebRTC] ❌ ICE connection failed. Check TURN server configuration and network.');
      } else if (state === 'connected' || state === 'completed') {
        console.log('[WebRTC] ✅ ICE connection successful!');
      } else if (state === 'checking') {
        console.log('[WebRTC] 🔄 ICE connection checking... (trying to connect)');
      } else if (state === 'new') {
        console.log('[WebRTC] ⏳ ICE connection state: new (waiting to start)');
      }
    });

    this.peer.on('connectionStateChange', (state) => {
      console.log('[WebRTC] Connection state changed:', state);
    });

    // Log ICE candidates to see if TURN is being used
    // Wait a bit for peer._pc to be available
    setTimeout(() => {
      if (this.peer && this.peer._pc) {
        console.log('[WebRTC] Setting up ICE candidate listeners...');
        
        this.peer._pc.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            console.log('[WebRTC] ICE candidate generated:', {
              type: event.candidate.type,
              protocol: event.candidate.protocol,
              address: event.candidate.address,
              port: event.candidate.port,
              isRelay: event.candidate.type === 'relay' // TURN server provides relay candidates
            });
            if (event.candidate.type === 'relay') {
              console.log('[WebRTC] ✅ TURN server is being used (relay candidate found)');
            } else if (event.candidate.type === 'host') {
              console.log('[WebRTC] 📍 Direct connection candidate (host)');
            } else if (event.candidate.type === 'srflx') {
              console.log('[WebRTC] 🌐 STUN candidate (server reflexive)');
            }
          } else {
            console.log('[WebRTC] ✅ All ICE candidates gathered (null candidate event)');
          }
        });

        this.peer._pc.addEventListener('iceconnectionstatechange', () => {
          const state = this.peer._pc.iceConnectionState;
          console.log('[WebRTC] ICE Connection State:', state);
          if (state === 'failed') {
            console.error('[WebRTC] ❌ ICE connection failed. Possible causes:');
            console.error('[WebRTC] 1. TURN server not accessible');
            console.error('[WebRTC] 2. TURN credentials incorrect');
            console.error('[WebRTC] 3. Firewall blocking TURN server');
            console.error('[WebRTC] 4. Network issues');
          } else if (state === 'checking') {
            console.log('[WebRTC] 🔄 ICE checking connection...');
          } else if (state === 'connected') {
            console.log('[WebRTC] ✅ ICE connected!');
          } else if (state === 'completed') {
            console.log('[WebRTC] ✅✅ ICE connection completed!');
          }
        });

        this.peer._pc.addEventListener('icegatheringstatechange', () => {
          console.log('[WebRTC] ICE Gathering State:', this.peer._pc.iceGatheringState);
        });
      } else {
        console.warn('[WebRTC] ⚠️ peer._pc not available yet, will retry...');
      }
    }, 100);
  }

  /**
   * Process incoming signal (SDP or ICE candidate)
   */
  signal(data) {
    if (this.peer) {
      console.log('[WebRTC] 📥 Processing incoming signal:', {
        type: data.type,
        isInitiator: this.isInitiator,
        hasSdp: !!data.sdp,
        hasCandidate: !!data.candidate,
        sdpLength: data.sdp ? data.sdp.length : 0
      });
      
      if (data.type === 'offer') {
        console.log('[WebRTC] 📥 Received SDP OFFER from remote peer');
      } else if (data.type === 'answer') {
        console.log('[WebRTC] 📥 Received SDP ANSWER from remote peer');
      } else if (data.candidate) {
        console.log('[WebRTC] 📥 Received ICE candidate from remote peer');
      }
      
      try {
        this.peer.signal(data);
        console.log('[WebRTC] ✅ Signal processed successfully');
      } catch (error) {
        console.error('[WebRTC] ❌ Error processing signal:', error);
        throw error;
      }
    } else {
      console.error('[WebRTC] ❌ Cannot process signal - peer not initialized');
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
      console.error('[WebRTC] Failed to get stats:', error);
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
