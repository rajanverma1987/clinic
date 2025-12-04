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
    this.initializePeerConnection();
  }

  initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.peerConnection.connectionState);
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
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      // Add local tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      return this.localStream;
    } catch (error) {
      console.error('Failed to access media devices:', error);
      throw new Error('Failed to access camera or microphone. Please grant permissions.');
    }
  }

  /**
   * Create SDP offer
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create SDP answer
   */
  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description (offer or answer from other peer)
   */
  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
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

