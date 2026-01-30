'use client';

import { Button } from '@/components/ui/Button';
import { useEffect, useRef, useState } from 'react';

/**
 * Encrypted Chat Panel Component
 * Real-time encrypted chat during video calls
 * HIPAA-compliant: Messages are encrypted end-to-end
 */
export function ChatPanel({
  messages = [],
  onSendMessage,
  currentUserId,
  isOpen = false,
  onClose,
}) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='absolute right-0 top-0 h-full w-80 bg-neutral-100 border-l border-neutral-300 flex flex-col'
      style={{ zIndex: 'var(--z-fixed, 30)' }}
    >
      {/* Chat Header */}
      <div className='bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-300'>
        <h3 className='text-neutral-900 font-semibold'>{t('telemedicine.chat')}</h3>
        <Button
          variant='ghost'
          size='xs'
          iconOnly
          onClick={onClose}
          className='text-neutral-600 hover:text-neutral-900'
        >
          <svg className='icon icon-sm' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </Button>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500 text-sm mt-8'>
            {t('telemedicine.noMessagesYet')}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-900'
                  }`}
                >
                  {!isOwn && (
                    <p className='text-xs font-semibold mb-1 opacity-80'>
                      {msg.senderName || 'Unknown'}
                    </p>
                  )}
                  <p className='text-sm whitespace-pre-wrap break-words'>{msg.message}</p>
                  <p className='text-xs opacity-70 mt-1'>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className='border-t border-neutral-300 p-4 bg-neutral-50'>
        <div className='flex space-x-2'>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('telemedicine.typeMessage')}
            className='flex-1 bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500'
            rows={2}
          />
          <Button onClick={handleSend} disabled={!message.trim()} size='sm'>
            {t('telemedicine.send')}
          </Button>
        </div>
        <p className='text-xs text-gray-500 mt-2'>🔒 Messages are encrypted end-to-end</p>
      </div>
    </div>
  );
}
