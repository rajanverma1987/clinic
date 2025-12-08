/**
 * WebRTC Video Call Manager
 * High-level API for video consultations
 */

import { WebRTCPeerConnection } from './peer-connection.js';
import { SignalingService } from './signaling.js';

export class VideoCallManager {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.peerConnection = new WebRTCPeerConnection();
    this.signaling = new SignalingService(config.sessionId, config.userId);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Handle remote stream
    this.peerConnection.onRemoteStream((stream) => {
      console.log('Remote stream received');
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream);
      }
    });

    // Handle connection state
    this.peerConnection.onConnectionStateChange((state) => {
      console.log('Peer connection state:', state);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(state);
      }
    });

    // Handle ICE candidates
    this.peerConnection.onIceCandidate((candidate) => {
      console.log('ICE candidate generated:', candidate);
      if (candidate && candidate.candidate) {
        this.signaling.sendIceCandidate(candidate, this.config.remoteUserId).catch(err => {
          console.error('Failed to send ICE candidate:', err);
        });
      }
    });

    // Handle incoming signaling messages
    this.signaling.onMessage(async (message) => {
      console.log('[VideoCallManager] 📨 Received signaling message:', {
        type: message.type,
        from: message.from,
        to: message.to,
        sessionId: message.sessionId,
      });
      try {
        switch (message.type) {
          case 'offer':
            console.log('[VideoCallManager] 📥 Processing offer from', message.from);
            try {
              // CRITICAL: Ensure local stream tracks are added BEFORE setting remote description
              // This ensures the answer SDP includes the patient's media tracks
              if (this.peerConnection.localStream) {
                const senders = this.peerConnection.peerConnection.getSenders();
                const localTracks = this.peerConnection.localStream.getTracks();
                console.log('[VideoCallManager] Pre-offer check - Local tracks:', {
                  localTracks: localTracks.length,
                  senders: senders.length,
                  trackKinds: localTracks.map(t => t.kind),
                  trackIds: localTracks.map(t => t.id)
                });

                // Remove any existing senders that don't match our local tracks
                // This ensures we have a clean state
                senders.forEach(sender => {
                  if (sender.track && !localTracks.includes(sender.track)) {
                    console.log('[VideoCallManager] Removing stale sender:', sender.track.kind);
                    this.peerConnection.peerConnection.removeTrack(sender);
                  }
                });

                // Add all local tracks to peer connection
                localTracks.forEach(track => {
                  if (track && track.readyState === 'live') {
                    const hasTrack = this.peerConnection.peerConnection.getSenders().some(
                      sender => sender.track === track
                    );
                    if (!hasTrack) {
                      console.log('[VideoCallManager] ➕ Adding local track to peer connection:', {
                        kind: track.kind,
                        id: track.id,
                        enabled: track.enabled,
                        readyState: track.readyState
                      });
                      this.peerConnection.peerConnection.addTrack(track, this.peerConnection.localStream);
                    } else {
                      console.log('[VideoCallManager] ✓ Local track already added:', track.kind);
                    }
                  } else {
                    console.warn('[VideoCallManager] ⚠️ Local track not ready:', {
                      kind: track?.kind,
                      readyState: track?.readyState
                    });
                  }
                });

                // Verify tracks are added
                const finalSenders = this.peerConnection.peerConnection.getSenders();
                console.log('[VideoCallManager] Post-add check - Senders:', {
                  count: finalSenders.length,
                  tracks: finalSenders.map(s => ({
                    kind: s.track?.kind,
                    id: s.track?.id,
                    enabled: s.track?.enabled
                  }))
                });
              } else {
                console.error('[VideoCallManager] ❌ No local stream available when processing offer!');
                throw new Error('Local media stream not available. Please ensure camera and microphone permissions are granted.');
              }

              // Now set remote description (offer)
              await this.peerConnection.setRemoteDescription(message.data);
              console.log('[VideoCallManager] ✅ Remote description set (offer)');

              // Double-check tracks are still there after setRemoteDescription
              const sendersAfterRemoteDesc = this.peerConnection.peerConnection.getSenders();
              console.log('[VideoCallManager] After setRemoteDescription - Senders:', {
                count: sendersAfterRemoteDesc.length,
                tracks: sendersAfterRemoteDesc.map(s => ({
                  kind: s.track?.kind,
                  id: s.track?.id,
                  enabled: s.track?.enabled
                }))
              });

              // Create answer (this will include the local tracks in the SDP)
              const answer = await this.peerConnection.createAnswer();
              console.log('[VideoCallManager] ✅ Answer created with', this.peerConnection.peerConnection.getSenders().length, 'senders');

              // Verify answer SDP contains media
              if (answer.sdp) {
                const hasAudio = answer.sdp.includes('m=audio');
                const hasVideo = answer.sdp.includes('m=video');
                console.log('[VideoCallManager] Answer SDP check:', {
                  hasAudio,
                  hasVideo,
                  sdpPreview: answer.sdp.substring(0, 200)
                });

                if (!hasAudio && !hasVideo) {
                  console.error('[VideoCallManager] ❌ Answer SDP does not contain media tracks!');
                }
              }

              await this.signaling.sendAnswer(answer, message.from);
              console.log('[VideoCallManager] ✅ Answer sent successfully to', message.from);
            } catch (error) {
              console.error('[VideoCallManager] ❌ Error processing offer:', error);
              throw error;
            }
            break;

          case 'answer':
            console.log('[VideoCallManager] 📥 Processing answer from', message.from);
            try {
              await this.peerConnection.setRemoteDescription(message.data);
              console.log('[VideoCallManager] ✅ Answer processed successfully (remote description set)');
            } catch (error) {
              console.error('[VideoCallManager] ❌ Error processing answer:', error);
              throw error;
            }
            break;

          case 'ice-candidate':
            console.log('Processing ICE candidate from', message.from);
            await this.peerConnection.addIceCandidate(message.data);
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      }
    });
  }

  /**
   * Start the call
   */
  async startCall() {
    try {
      console.log('[VideoCallManager] Starting call:', {
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        remoteUserId: this.config.remoteUserId,
        isInitiator: this.config.isInitiator,
        config: this.config,
      });

      if (this.config.isInitiator) {
        console.log('[VideoCallManager] ✅ This peer is the INITIATOR (will create offer)');
      } else {
        console.log('[VideoCallManager] ⏳ This peer is the RECEIVER (will wait for offer)');
      }

      // Start local media
      console.log('[VideoCallManager] Step 1: Requesting local media...');
      let localStream;
      try {
        // Use appropriate constraints based on device
        const isMobile = typeof window !== 'undefined' &&
          typeof navigator !== 'undefined' &&
          navigator.userAgent &&
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const videoConstraints = isMobile
          ? {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
          : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
        };

        console.log('[VideoCallManager] Step 1: Constraints:', { videoConstraints, audioConstraints, isMobile });

        localStream = await this.peerConnection.startLocalStream(videoConstraints, audioConstraints);
        console.log('[VideoCallManager] Step 1: Local media obtained successfully');
      } catch (error) {
        console.error('[VideoCallManager] Step 1: Failed to get local media:', error);
        console.error('[VideoCallManager] Step 1: Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        // Re-throw with the original error message (it already has good context)
        throw error;
      }

      if (this.callbacks.onLocalStream) {
        console.log('[VideoCallManager] 📹 Calling onLocalStream callback with stream:', {
          tracks: localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
        });
        this.callbacks.onLocalStream(localStream);
      } else {
        console.warn('[VideoCallManager] ⚠️ onLocalStream callback not set');
      }

      // Start signaling (polling for messages)
      console.log('[VideoCallManager] Step 2: Starting signaling polling...');
      this.signaling.startPolling();
      console.log('[VideoCallManager] Step 2: Signaling polling started');

      // If initiator, create and send offer
      if (this.config.isInitiator) {
        console.log('[VideoCallManager] Step 3: Creating offer as initiator...');
        let offer;
        try {
          offer = await this.peerConnection.createOffer();
          console.log('[VideoCallManager] Step 3: Offer created successfully');
        } catch (error) {
          console.error('[VideoCallManager] Step 3: Failed to create offer:', error);
          throw new Error(`Failed to create offer: ${error.message}`);
        }

        console.log('[VideoCallManager] Step 4: Sending offer to', this.config.remoteUserId);
        console.log('[VideoCallManager] Offer details:', {
          type: offer.type,
          sdp: offer.sdp ? offer.sdp.substring(0, 100) + '...' : 'no sdp',
          remoteUserId: this.config.remoteUserId,
          fromUserId: this.config.userId,
        });
        try {
          await this.signaling.sendOffer(offer, this.config.remoteUserId);
          console.log('[VideoCallManager] Step 4: ✅ Offer sent successfully to', this.config.remoteUserId);
        } catch (error) {
          console.error('[VideoCallManager] Step 4: ❌ Failed to send offer:', error);
          throw new Error(`Failed to send offer: ${error.message}`);
        }
      } else {
        console.log('[VideoCallManager] Step 3: Waiting for offer as non-initiator...');
      }

      console.log('[VideoCallManager] Call started successfully');
    } catch (error) {
      console.error('[VideoCallManager] Failed to start call:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Toggle microphone
   */
  toggleMute(muted) {
    this.peerConnection.toggleAudio(!muted);
  }

  /**
   * Toggle camera
   */
  toggleVideo(enabled) {
    this.peerConnection.toggleVideo(enabled);
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    return await this.peerConnection.startScreenShare();
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    await this.peerConnection.stopScreenShare();
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    return await this.peerConnection.getStats();
  }

  /**
   * End the call and cleanup
   */
  endCall() {
    this.signaling.cleanup();
    this.peerConnection.close();
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.peerConnection.getLocalStream();
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.peerConnection.getRemoteStream();
  }
}

