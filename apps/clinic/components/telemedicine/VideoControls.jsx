'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';

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
  onCollectPayment,
  isDoctor = false,
  showPaymentButton = false,
}) {
  const { t } = useI18n();
  return (
    <div
      className='absolute bottom-2 sm:bottom-4 left-1/2 flex items-center gap-2 sm:gap-3 md:gap-4 bg-neutral-200/95 dark:bg-neutral-800/95 backdrop-blur-sm border border-neutral-300 dark:border-neutral-600 px-2 sm:px-4 py-2 sm:py-3 rounded-full flex-wrap justify-center max-w-[95vw] shadow-lg'
      style={{ marginLeft: '-50%' }}
      role='toolbar'
      aria-label={t('telemedicine.callControls')}
    >
      {/* Mute/Unmute Button */}
      <Button
        type='button'
        variant='ghost'
        iconOnly
        size='sm'
        onClick={onToggleMute}
        className={`p-2 sm:p-3 rounded-full min-w-0 ${
          isMuted
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-neutral-600 hover:bg-neutral-700 text-white'
        }`}
        title={isMuted ? t('telemedicine.unmute') : t('telemedicine.mute')}
      >
        {isMuted ? (
          <svg
            className='icon icon-control-bar text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'
            />
          </svg>
        ) : (
          <svg
            className='icon icon-control-bar text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
            />
          </svg>
        )}
      </Button>

      {/* Video On/Off Button */}
      <Button
        type='button'
        variant='ghost'
        iconOnly
        size='sm'
        onClick={onToggleVideo}
        className={`p-2 sm:p-3 rounded-full min-w-0 ${
          isVideoEnabled
            ? 'bg-neutral-600 hover:bg-neutral-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={isVideoEnabled ? t('telemedicine.turnOffVideo') : t('telemedicine.turnOnVideo')}
      >
        {isVideoEnabled ? (
          <svg
            className='icon icon-control-bar text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
            />
          </svg>
        ) : (
          <svg
            className='icon icon-control-bar text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
            />
          </svg>
        )}
      </Button>

      {/* Screen Share Button */}
      <Button
        type='button'
        variant='ghost'
        iconOnly
        size='sm'
        onClick={onScreenShare}
        className={`p-2 sm:p-3 rounded-full min-w-0 ${
          isScreenSharing
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-neutral-600 hover:bg-neutral-700 text-white'
        }`}
        title={isScreenSharing ? t('telemedicine.stopSharing') : t('telemedicine.shareScreen')}
      >
        <svg
          className='icon icon-control-bar text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
          />
        </svg>
      </Button>

      {/* Chat Toggle Button */}
      <Button
        type='button'
        variant='ghost'
        iconOnly
        size='sm'
        onClick={() => {
          onToggleChat(!showChat);
          if (!showChat) onToggleFileTransfer(false);
        }}
        className={`p-2 sm:p-3 rounded-full min-w-0 ${
          showChat
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-neutral-600 hover:bg-neutral-700 text-white'
        }`}
        title={showChat ? t('telemedicine.closeChat') : t('telemedicine.openChat')}
      >
        <svg
          className='icon icon-control-bar text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          />
        </svg>
      </Button>

      {/* File Transfer Toggle Button */}
      <Button
        type='button'
        variant='ghost'
        iconOnly
        size='sm'
        onClick={() => {
          onToggleFileTransfer(!showFileTransfer);
          if (!showFileTransfer) onToggleChat(false);
        }}
        className={`p-2 sm:p-3 rounded-full min-w-0 ${
          showFileTransfer
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-neutral-600 hover:bg-neutral-700 text-white'
        }`}
        title={showFileTransfer ? t('telemedicine.closeFiles') : t('telemedicine.openFiles')}
      >
        <svg
          className='icon icon-control-bar text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      </Button>

      {/* Collect Payment (Doctor only, when appointment linked) */}
      {showPaymentButton && onCollectPayment && (
        <Button
          type='button'
          variant='ghost'
          iconOnly
          size='sm'
          onClick={onCollectPayment}
          className='p-2 sm:p-3 rounded-full min-w-0 bg-neutral-600 hover:bg-neutral-700 text-white'
          title={t('telemedicine.collectPayment')}
        >
          <svg
            className='icon icon-control-bar text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V9a2 2 0 112 2v1m0 16V5a2 2 0 104 0v14m-4-8h.01M12 16h.01'
            />
          </svg>
        </Button>
      )}

      {/* End Call Button */}
      <Button
        variant='danger'
        size='md'
        iconOnly
        shape='pill'
        onClick={onEndCall}
        title={t('telemedicine.endCall')}
        className='p-2 sm:p-3'
      >
        <svg
          className='icon icon-control-bar text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M16 16l2 2m0 0l2 2m-2-2l-2 2m2-2l-2-2M3 12a9 9 0 1118 0 9 9 0 01-18 0z'
          />
        </svg>
      </Button>
    </div>
  );
}
