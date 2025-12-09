/**
 * Watermark Helper for Screen Sharing
 * Adds dynamic watermark (user ID + timestamp) to video stream
 */

/**
 * Apply watermark to video stream using canvas
 * @param {MediaStream} stream - Video stream to watermark
 * @param {string} userId - User ID for watermark
 * @returns {MediaStream} - New stream with watermark
 */
export function applyWatermarkToStream(stream, userId) {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    console.warn('[Watermark] No video track found in stream');
    return stream;
  }

  // Create canvas for watermarking
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const video = document.createElement('video');
  video.srcObject = stream;
  video.play();

  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });

  // Draw video and watermark
  const drawFrame = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add watermark text
      const watermarkText = `${userId} | ${new Date().toLocaleString()}`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, canvas.height - 40, ctx.measureText(watermarkText).width + 20, 30);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(watermarkText, 20, canvas.height - 20);
    }
    
    requestAnimationFrame(drawFrame);
  };

  video.addEventListener('play', () => {
    drawFrame();
  });

  // Create new stream from canvas
  const canvasStream = canvas.captureStream(30); // 30 FPS

  return canvasStream;
}

/**
 * Apply watermark using WebRTC Insertable Streams (more efficient)
 * Requires browser support for insertable streams
 */
export async function applyWatermarkWithInsertableStreams(stream, userId) {
  if (!stream.getVideoTracks()[0]?.getSettings) {
    console.warn('[Watermark] Insertable streams not supported, falling back to canvas');
    return applyWatermarkToStream(stream, userId);
  }

  try {
    const videoTrack = stream.getVideoTracks()[0];
    const processor = new RTCRtpScriptTransform(
      'watermark-processor',
      { userId }
    );

    // Apply transform to track
    const processedTrack = videoTrack.applyConstraints({
      advanced: [{ processor }]
    });

    return new MediaStream([processedTrack, ...stream.getAudioTracks()]);
  } catch (error) {
    console.warn('[Watermark] Insertable streams failed, using canvas fallback:', error);
    return applyWatermarkToStream(stream, userId);
  }
}
