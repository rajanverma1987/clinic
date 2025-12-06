/**
 * WebRTC Peer Connection Manager
 * Handles video/audio peer-to-peer connections
 */

// STUN servers for NAT traversal (free Google STUN servers)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  // Add TURN servers here for production (behind firewalls)
  // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
];

export class WebRTCPeerConnection {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateCallback = null;
    this.onIceCandidateCallback = null;
    this.iceCandidateQueue = []; // Queue for ICE candidates received before remote description is set
    this.remoteDescriptionSet = false;
    this.initializePeerConnection();
  }

  initializePeerConnection() {
    // Get RTCPeerConnection with fallback for older browsers
    const global = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
    const RTCPeerConnectionClass = 
      global.RTCPeerConnection ||
      global.webkitRTCPeerConnection ||
      global.mozRTCPeerConnection ||
      (typeof RTCPeerConnection !== 'undefined' ? RTCPeerConnection : null);
    
    if (!RTCPeerConnectionClass) {
      throw new Error('RTCPeerConnection is not supported in this browser');
    }
    
    console.log('[PeerConnection] Initializing RTCPeerConnection with ICE servers:', ICE_SERVERS);
    
    try {
      this.peerConnection = new RTCPeerConnectionClass({
        iceServers: ICE_SERVERS,
      });
      console.log('[PeerConnection] ✅ RTCPeerConnection created successfully');
    } catch (error) {
      console.error('[PeerConnection] ❌ Failed to create RTCPeerConnection:', error);
      throw new Error(`Failed to create RTCPeerConnection: ${error.message || error}`);
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[PeerConnection] 📹 Remote track received:', {
        kind: event.track?.kind,
        id: event.track?.id,
        enabled: event.track?.enabled,
        streams: event.streams?.length || 0
      });
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      if (event.track) {
        this.remoteStream.addTrack(event.track);
        console.log('[PeerConnection] ✅ Remote track added to stream');
      }
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[PeerConnection] 🧊 ICE candidate generated:', {
          candidate: event.candidate.candidate?.substring(0, 50) + '...',
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        });
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate);
        }
      } else {
        console.log('[PeerConnection] 🧊 ICE candidate gathering complete');
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateCallback) {
        const state = this.peerConnection.connectionState;
        console.log('[PeerConnection] 🔄 Connection state changed:', state);
        this.onConnectionStateCallback(state);
      }
    };

    // Also listen to iceConnectionState for more detailed status
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateCallback) {
        const iceState = this.peerConnection.iceConnectionState;
        const connState = this.peerConnection.connectionState;
        console.log('[PeerConnection] 🧊 ICE connection state changed:', iceState, 'Connection state:', connState);
        
        // Use ICE state for more accurate connection status
        // But prioritize connectionState if it's already connected
        if (connState === 'connected') {
          this.onConnectionStateCallback('connected');
        } else if (iceState === 'connected' || iceState === 'completed') {
          this.onConnectionStateCallback('connected');
        } else if (iceState === 'disconnected' || iceState === 'failed') {
          this.onConnectionStateCallback(iceState);
        } else if (iceState === 'checking' || iceState === 'new') {
          this.onConnectionStateCallback('connecting');
        } else {
          // Fallback to connection state
          this.onConnectionStateCallback(connState);
        }
      }
    };
  }

  /**
   * Initialize local media (camera + microphone)
   */
  async startLocalStream(
    videoConstraints = true,
    audioConstraints = true
  ) {
    try {
      // Check if getUserMedia is available (with fallback for older browsers)
      let getUserMedia = null;
      
      if (typeof navigator !== 'undefined') {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        } else if (navigator.getUserMedia) {
          // Fallback for older browsers
          getUserMedia = (constraints) => {
            return new Promise((resolve, reject) => {
              navigator.getUserMedia(constraints, resolve, reject);
            });
          };
        } else if (navigator.webkitGetUserMedia) {
          // Fallback for WebKit browsers
          getUserMedia = (constraints) => {
            return new Promise((resolve, reject) => {
              navigator.webkitGetUserMedia(constraints, resolve, reject);
            });
          };
        } else if (navigator.mozGetUserMedia) {
          // Fallback for Firefox
          getUserMedia = (constraints) => {
            return new Promise((resolve, reject) => {
              navigator.mozGetUserMedia(constraints, resolve, reject);
            });
          };
        }
      }
      
      if (!getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser. Please use a modern browser with camera/microphone support.');
      }

      console.log('[PeerConnection] Requesting getUserMedia with constraints:', {
        video: videoConstraints,
        audio: audioConstraints
      });
      
      this.localStream = await getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      if (!this.localStream) {
        throw new Error('Failed to get media stream: stream is null');
      }

      const tracks = this.localStream.getTracks();
      if (!tracks || tracks.length === 0) {
        throw new Error('Failed to get media stream: no tracks available');
      }

      console.log('[PeerConnection] getUserMedia successful, stream tracks:', tracks.map(t => ({
        kind: t ? t.kind : 'unknown',
        enabled: t ? t.enabled : false,
        readyState: t ? t.readyState : 'unknown'
      })));

      // Add local tracks to peer connection
      if (this.peerConnection && this.localStream) {
        tracks.forEach(track => {
          if (track && this.peerConnection && this.localStream) {
            try {
              this.peerConnection.addTrack(track, this.localStream);
            } catch (addTrackError) {
              console.error('[PeerConnection] Failed to add track:', addTrackError);
            }
          }
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('[PeerConnection] Failed to access media devices:', error);
      console.error('[PeerConnection] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        error: error
      });
      
      let errorMessage = 'Failed to access camera or microphone.';
      
      if (error && error.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        errorMessage = 'Camera and microphone permissions are required. Please allow access in your browser settings.';
      } else if (error && error.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error && error.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is being used by another application. Please close other apps and try again.';
      } else if (error && error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings. Trying with default settings...';
        // Try again with simpler constraints
        try {
          if (getUserMedia) {
            this.localStream = await getUserMedia({
              video: true,
              audio: true,
            });
            if (this.localStream && this.peerConnection) {
              const retryTracks = this.localStream.getTracks();
              if (retryTracks && retryTracks.length > 0) {
                retryTracks.forEach(track => {
                  if (track && this.peerConnection && this.localStream) {
                    try {
                      this.peerConnection.addTrack(track, this.localStream);
                    } catch (addTrackError) {
                      console.error('[PeerConnection] Failed to add track on retry:', addTrackError);
                    }
                  }
                });
              }
            }
            return this.localStream;
          }
        } catch (retryError) {
          const retryErrorMsg = retryError?.message || retryError?.name || 'Unknown error';
          errorMessage = `Failed to access camera/microphone: ${retryErrorMsg}`;
          throw new Error(errorMessage);
        }
      } else {
        const errorMsg = error?.message || error?.name || (typeof error === 'string' ? error : 'Unknown error');
        errorMessage = `Failed to access camera/microphone: ${errorMsg}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Create SDP offer
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // Ensure local stream tracks are added before creating offer
    if (this.localStream) {
      const existingTracks = this.peerConnection.getSenders().map(sender => sender.track);
      const localTracks = this.localStream.getTracks();
      
      // Add any missing tracks
      localTracks.forEach(track => {
        if (!existingTracks.includes(track)) {
          console.log('[PeerConnection] Adding local track to peer connection before creating offer:', track.kind);
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    console.log('[PeerConnection] Creating offer with', this.peerConnection.getSenders().length, 'senders');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    console.log('[PeerConnection] ✅ Offer created and local description set');
    return offer;
  }

  /**
   * Create SDP answer
   */
  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // Ensure local stream tracks are added before creating answer
    if (this.localStream) {
      const existingTracks = this.peerConnection.getSenders().map(sender => sender.track);
      const localTracks = this.localStream.getTracks();
      
      // Add any missing tracks
      localTracks.forEach(track => {
        if (!existingTracks.includes(track)) {
          console.log('[PeerConnection] Adding local track to peer connection before creating answer:', track.kind);
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    console.log('[PeerConnection] Creating answer with', this.peerConnection.getSenders().length, 'senders');
    const answer = await this.peerConnection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(answer);
    console.log('[PeerConnection] ✅ Answer created and local description set');
    return answer;
  }

  /**
   * Set remote description (offer or answer from other peer)
   */
  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log('[PeerConnection] Setting remote description:', description.type);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    this.remoteDescriptionSet = true;
    console.log('[PeerConnection] ✅ Remote description set, processing queued ICE candidates...');
    
    // Process queued ICE candidates now that remote description is set
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      try {
        await this.addIceCandidateInternal(candidate);
        console.log('[PeerConnection] ✅ Processed queued ICE candidate');
      } catch (error) {
        console.error('[PeerConnection] ❌ Failed to process queued ICE candidate:', error);
      }
    }
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    // If remote description is not set yet, queue the candidate
    if (!this.remoteDescriptionSet) {
      console.log('[PeerConnection] ⏳ Queuing ICE candidate (remote description not set yet)');
      this.iceCandidateQueue.push(candidate);
      return;
    }

    // Remote description is set, add the candidate immediately
    await this.addIceCandidateInternal(candidate);
  }

  async addIceCandidateInternal(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      // Handle both RTCIceCandidate objects and plain objects
      let iceCandidate;
      if (candidate instanceof RTCIceCandidate) {
        iceCandidate = candidate;
      } else if (candidate.candidate) {
        // If it's already a plain object with candidate property, use it directly
        iceCandidate = new RTCIceCandidate(candidate);
      } else {
        console.warn('[PeerConnection] Invalid ICE candidate format:', candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(iceCandidate);
      console.log('[PeerConnection] ✅ ICE candidate added successfully');
    } catch (error) {
      // If candidate is already in SDP, ignore the error
      if (error.message && (error.message.includes('already') || error.message.includes('duplicate'))) {
        console.log('[PeerConnection] ⏭️ ICE candidate already added, skipping');
        return;
      }
      // If remote description is null, queue it
      if (error.message && error.message.includes('remote description')) {
        console.log('[PeerConnection] ⏳ Queuing ICE candidate (remote description issue)');
        this.remoteDescriptionSet = false;
        this.iceCandidateQueue.push(candidate);
        return;
      }
      console.error('[PeerConnection] ❌ Error adding ICE candidate:', error);
      // Don't throw - ICE candidates can fail and that's sometimes OK
    }
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
      });

      // Replace video track with screen share
      if (this.peerConnection && this.localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        // When screen share stops, switch back to camera
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      return screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing and return to camera
   */
  async stopScreenShare() {
    if (this.localStream && this.peerConnection) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(s => 
        s.track?.kind === 'video'
      );
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    if (!this.peerConnection) return null;
    return await this.peerConnection.getStats();
  }

  /**
   * Close connection and cleanup
   */
  close() {
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  // Event handlers
  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionStateChange(callback) {
    this.onConnectionStateCallback = callback;
  }

  onIceCandidate(callback) {
    this.onIceCandidateCallback = callback;
  }

  // Getters
  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  getConnectionState() {
    return this.peerConnection?.connectionState || 'closed';
  }
}

