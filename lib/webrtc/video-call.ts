/**
 * WebRTC Video Call Manager
 * High-level API for video consultations
 */

import { WebRTCPeerConnection } from './peer-connection';
import { SignalingService } from './signaling';

export interface CallConfig {
  sessionId: string;
  userId: string;
  remoteUserId: string;
  isInitiator: boolean; // true if this user initiates the call
}

export interface CallCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionChange?: (state: string) => void;
  onError?: (error: Error) => void;
}

export class VideoCallManager {
  private peerConnection: WebRTCPeerConnection;
  private signaling: SignalingService;
  private config: CallConfig;
  private callbacks: CallCallbacks;

  constructor(config: CallConfig, callbacks: CallCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.peerConnection = new WebRTCPeerConnection();
    this.signaling = new SignalingService(config.sessionId, config.userId);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
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
          this.callbacks.onError(error as Error);
        }
      }
    });
  }

  /**
   * Start the call
   */
  async startCall(): Promise<void> {
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
        this.callbacks.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Toggle microphone
   */
  toggleMute(muted: boolean): void {
    this.peerConnection.toggleAudio(!muted);
  }

  /**
   * Toggle camera
   */
  toggleVideo(enabled: boolean): void {
    this.peerConnection.toggleVideo(enabled);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    return await this.peerConnection.startScreenShare();
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    await this.peerConnection.stopScreenShare();
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport | null> {
    return await this.peerConnection.getStats();
  }

  /**
   * End the call and cleanup
   */
  endCall(): void {
    this.signaling.cleanup();
    this.peerConnection.close();
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.peerConnection.getLocalStream();
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.peerConnection.getRemoteStream();
  }
}

