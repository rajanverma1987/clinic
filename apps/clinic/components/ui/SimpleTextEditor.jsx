'use client';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext.jsx';
import { useEffect, useRef, useState } from 'react';

export function SimpleTextEditor({ value, onChange, placeholder, className = '', rows = 6 }) {
  const { t } = useI18n();
  const placeholderText = placeholder ?? t('simpleTextEditor.placeholder');
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      // Check if the HTML content is different to avoid infinite loops
      const currentHtml = editorRef.current.innerHTML;
      // If value is empty or just whitespace, treat as empty
      const normalizedValue = (value || '').trim();
      const normalizedCurrent = currentHtml.trim();

      // Only update if different (avoid infinite update loop)
      if (normalizedValue !== normalizedCurrent) {
        // If value is plain text (no HTML tags), set as textContent
        // Otherwise set as innerHTML to preserve formatting
        if (normalizedValue && normalizedValue.includes('<')) {
          editorRef.current.innerHTML = value;
        } else {
          editorRef.current.textContent = value || '';
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // Save as HTML to preserve formatting
      onChange(editorRef.current.innerHTML || '');
    }
  };

  const handleKeyDown = (e) => {
    // Allow basic formatting with keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false);
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false);
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false);
          break;
      }
    }
  };

  return (
    <div className='w-full'>
      {/* Toolbar */}
      <div className='flex items-center gap-1 mb-2 p-2 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-t-lg'>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='px-3 py-1 text-sm min-h-0'
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('bold', false);
            editorRef.current?.focus();
          }}
          title={t('simpleTextEditor.bold')}
        >
          <strong>B</strong>
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='px-3 py-1 text-sm min-h-0'
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('italic', false);
            editorRef.current?.focus();
          }}
          title={t('simpleTextEditor.italic')}
        >
          <em>I</em>
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='px-3 py-1 text-sm min-h-0'
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('underline', false);
            editorRef.current?.focus();
          }}
          title={t('simpleTextEditor.underline')}
        >
          <u>U</u>
        </Button>
        <div className='flex-1' />
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='px-3 py-1 text-sm min-h-0'
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false);
            editorRef.current?.focus();
          }}
          title={t('simpleTextEditor.bulletList')}
        >
          •
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='px-3 py-1 text-sm min-h-0'
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('insertOrderedList', false);
            editorRef.current?.focus();
          }}
          title={t('simpleTextEditor.numberedList')}
        >
          1.
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-b-lg
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          min-h-[${rows * 1.5}rem]
          ${isFocused ? 'bg-white dark:bg-neutral-800' : 'bg-white dark:bg-neutral-800'}
          ${className}
        `}
        style={{
          minHeight: `${rows * 1.5}rem`,
        }}
        suppressContentEditableWarning
        data-placeholder={value === '' ? placeholderText : ''}
      />
      <style jsx>{`
        div[contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
