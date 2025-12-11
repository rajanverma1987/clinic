'use client';

export function SessionInfo({ sessionDuration, sessionId }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0'>
      <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0'>
        <svg
          className='w-4 h-4 sm:w-6 sm:h-6 text-white'
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
      </div>
      <div className='min-w-0 flex-1'>
        <h2 className='text-white font-semibold text-sm sm:text-base truncate'>
          Telemedicine Consultation
        </h2>
        <p className='text-gray-400 text-xs sm:text-sm truncate'>Session: {sessionId}</p>
      </div>
      {sessionDuration > 0 && (
        <div className='text-white text-xs sm:text-sm'>
          <span className='text-gray-400 hidden sm:inline'>Duration: </span>
          <span className='font-mono'>{formatDuration(sessionDuration)}</span>
        </div>
      )}
    </div>
  );
}
