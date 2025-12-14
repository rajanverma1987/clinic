'use client';

import { FaVideo } from 'react-icons/fa';

export function VideoDisplay({ localVideoRef, remoteVideoRef, isVideoEnabled, isScreenSharing }) {
  return (
    <>
      {/* Remote Video (Patient/Doctor) - Full Screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={false}
        className={`w-full h-full ${isScreenSharing ? 'object-contain' : 'object-cover'}`}
        style={{
          maxHeight: '100vh',
          backgroundColor: isScreenSharing ? '#000' : 'transparent',
        }}
        onLoadedMetadata={(e) => {
          if (e.target) {
            e.target.play().catch((err) => console.warn('Video autoplay prevented:', err));
          }
        }}
      />

      {/* Local Video (Self) - Picture in Picture */}
      <div className='absolute bottom-16 sm:bottom-20 right-2 sm:right-4 w-28 h-20 sm:w-48 sm:h-36 md:w-64 md:h-48 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-blue-500 z-10'>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className='w-full h-full object-cover'
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isVideoEnabled && (
          <div className='absolute inset-0 bg-gray-800 flex items-center justify-center'>
            <FaVideo className='w-12 h-12 text-gray-400' />
          </div>
        )}
      </div>
    </>
  );
}
