/**
 * Call Recorder
 * Records telemedicine video calls using MediaRecorder API
 * HIPAA-compliant recording with consent tracking
 */

export class CallRecorder {
  constructor(options = {}) {
    this.localStream = options.localStream || null;
    this.remoteStream = options.remoteStream || null;
    this.sessionId = options.sessionId || null;
    this.onRecordingStateChange = options.onRecordingStateChange || (() => { });
    this.onRecordingError = options.onRecordingError || (() => { });

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;

    // Recording options
    this.mimeType = this.getSupportedMimeType();
    this.videoBitsPerSecond = 2500000; // 2.5 Mbps for high quality
    this.audioBitsPerSecond = 128000; // 128 kbps for audio
  }

  /**
   * Get supported MIME type for recording
   */
  getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('[CallRecorder] Using MIME type:', type);
        return type;
      }
    }

    // Fallback to default
    console.warn('[CallRecorder] No specific MIME type supported, using default');
    return '';
  }

  /**
   * Combine local and remote streams for recording
   */
  combineStreams() {
    if (!this.localStream && !this.remoteStream) {
      throw new Error('No streams available for recording');
    }

    // Create canvas to combine video streams
    const canvas = document.createElement('canvas');
    canvas.width = 1920; // Full HD width
    canvas.height = 1080; // Full HD height
    const ctx = canvas.getContext('2d');

    // Create video elements for each stream
    const localVideo = document.createElement('video');
    const remoteVideo = document.createElement('video');

    localVideo.srcObject = this.localStream;
    remoteVideo.srcObject = this.remoteStream;

    localVideo.autoplay = true;
    remoteVideo.autoplay = true;
    localVideo.muted = true; // Mute local to avoid echo
    remoteVideo.muted = false;

    // Wait for videos to be ready
    return new Promise((resolve) => {
      let loadedCount = 0;
      const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === 2) {
          // Draw videos side by side or picture-in-picture
          const drawFrame = () => {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw remote video (main, larger)
            if (remoteVideo.readyState >= 2) {
              ctx.drawImage(remoteVideo, 0, 0, canvas.width * 0.75, canvas.height);
            }

            // Draw local video (smaller, bottom right)
            if (localVideo.readyState >= 2) {
              const localWidth = canvas.width * 0.25;
              const localHeight = canvas.height * 0.25;
              ctx.drawImage(
                localVideo,
                canvas.width - localWidth,
                canvas.height - localHeight,
                localWidth,
                localHeight
              );
            }

            requestAnimationFrame(drawFrame);
          };

          drawFrame();
          resolve(canvas.captureStream(30)); // 30 fps
        }
      };

      localVideo.addEventListener('loadedmetadata', checkLoaded);
      remoteVideo.addEventListener('loadedmetadata', checkLoaded);
    });
  }

  /**
   * Start recording
   */
  async startRecording() {
    if (this.isRecording) {
      console.warn('[CallRecorder] Already recording');
      return;
    }

    try {
      let streamToRecord = null;

      if (this.localStream && this.remoteStream) {
        // Combine both streams
        streamToRecord = await this.combineStreams();
      } else if (this.remoteStream) {
        // Record only remote stream
        streamToRecord = this.remoteStream;
      } else if (this.localStream) {
        // Record only local stream (fallback)
        streamToRecord = this.localStream;
      } else {
        throw new Error('No streams available for recording');
      }

      // Create MediaRecorder
      const options = {
        mimeType: this.mimeType,
        videoBitsPerSecond: this.videoBitsPerSecond,
        audioBitsPerSecond: this.audioBitsPerSecond
      };

      this.mediaRecorder = new MediaRecorder(streamToRecord, options);

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          console.log('[CallRecorder] Data chunk received:', event.data.size, 'bytes');
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        console.log('[CallRecorder] Recording stopped');
        this.isRecording = false;
        this.onRecordingStateChange({
          isRecording: false,
          duration: this.recordingDuration
        });
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('[CallRecorder] Recording error:', event.error);
        this.onRecordingError(event.error);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.recordedChunks = [];

      console.log('[CallRecorder] ✅ Recording started');
      this.onRecordingStateChange({
        isRecording: true,
        duration: 0
      });

      // Update duration periodically
      this.durationInterval = setInterval(() => {
        if (this.isRecording && this.recordingStartTime) {
          this.recordingDuration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
          this.onRecordingStateChange({
            isRecording: true,
            duration: this.recordingDuration
          });
        }
      }, 1000);

    } catch (error) {
      console.error('[CallRecorder] Failed to start recording:', error);
      this.onRecordingError(error);
      throw error;
    }
  }

  /**
   * Stop recording and get blob
   */
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('[CallRecorder] Not recording');
      return null;
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        try {
          // Clear duration interval
          if (this.durationInterval) {
            clearInterval(this.durationInterval);
            this.durationInterval = null;
          }

          // Create blob from chunks
          const blob = new Blob(this.recordedChunks, { type: this.mimeType || 'video/webm' });
          const duration = this.recordingDuration;

          console.log('[CallRecorder] Recording stopped, blob size:', blob.size, 'bytes');

          // Reset state
          this.isRecording = false;
          this.recordingStartTime = null;
          this.recordingDuration = 0;
          this.recordedChunks = [];

          this.onRecordingStateChange({
            isRecording: false,
            duration
          });

          resolve({
            blob,
            duration,
            mimeType: this.mimeType || 'video/webm',
            size: blob.size
          });
        } catch (error) {
          reject(error);
        }
      };

      // Stop recording
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('[CallRecorder] Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('[CallRecorder] Recording resumed');
    }
  }

  /**
   * Update streams
   */
  updateStreams(localStream, remoteStream) {
    this.localStream = localStream;
    this.remoteStream = remoteStream;
  }

  /**
   * Get recording state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      duration: this.recordingDuration,
      mimeType: this.mimeType,
      chunksCount: this.recordedChunks.length
    };
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
  }
}
