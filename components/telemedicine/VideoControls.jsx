'use client';

import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaComments, FaPaperclip, FaPhoneSlash } from 'react-icons/fa';

export function VideoControls({
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  showChat,
  showFileTransfer,
  onToggleMute,
  onToggleVideo,
  onScreenShare,
  onToggleChat,
  onToggleFileTransfer,
  onEndCall,
}) {
  return (
    <div
      className='absolute bottom-2 sm:bottom-4 left-1/2 flex items-center gap-2 sm:gap-3 md:gap-4 bg-gray-900/80 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 rounded-full flex-wrap justify-center max-w-[95vw]'
      style={{ marginLeft: '-50%' }}
    >
      {/* Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        className={`p-2 sm:p-3 rounded-full ${
          isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <FaMicrophoneSlash className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
        ) : (
          <FaMicrophone className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
        )}
      </button>

      {/* Video On/Off Button */}
      <button
        onClick={onToggleVideo}
        className={`p-2 sm:p-3 rounded-full ${
          isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
        }`}
        title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
      >
        {isVideoEnabled ? (
          <FaVideo className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
        ) : (
          <FaVideoSlash className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
        )}
      </button>

      {/* Screen Share Button */}
      <button
        onClick={onScreenShare}
        className={`p-2 sm:p-3 rounded-full ${
          isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <FaDesktop className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
      </button>

      {/* Chat Toggle Button */}
      <button
        onClick={() => {
          onToggleChat(!showChat);
          if (!showChat) onToggleFileTransfer(false);
        }}
        className={`p-2 sm:p-3 rounded-full ${
          showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={showChat ? 'Close chat' : 'Open chat'}
      >
        <FaComments className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
      </button>

      {/* File Transfer Toggle Button */}
      <button
        onClick={() => {
          onToggleFileTransfer(!showFileTransfer);
          if (!showFileTransfer) onToggleChat(false);
        }}
        className={`p-2 sm:p-3 rounded-full ${
          showFileTransfer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title={showFileTransfer ? 'Close files' : 'Open files'}
      >
        <FaPaperclip className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
      </button>

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        className='p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-700'
        title='End call'
      >
        <FaPhoneSlash className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white' />
      </button>
    </div>
  );
}
