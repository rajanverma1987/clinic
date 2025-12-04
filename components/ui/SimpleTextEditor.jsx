'use client';

import React, { useRef, useEffect, useState } from 'react';

export function SimpleTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  rows = 6,
}) {
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
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 border border-gray-300 rounded-t-lg">
        <button
          type="button"
          className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('bold', false);
            editorRef.current?.focus();
          }}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('italic', false);
            editorRef.current?.focus();
          }}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('underline', false);
            editorRef.current?.focus();
          }}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <div className="flex-1" />
        <button
          type="button"
          className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false);
            editorRef.current?.focus();
          }}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
          onClick={(e) => {
            e.preventDefault();
            document.execCommand('insertOrderedList', false);
            editorRef.current?.focus();
          }}
          title="Numbered List"
        >
          1.
        </button>
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
          w-full px-3 py-2 border border-gray-300 rounded-b-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          min-h-[${rows * 1.5}rem]
          ${isFocused ? 'bg-white' : 'bg-white'}
          ${className}
        `}
        style={{
          minHeight: `${rows * 1.5}rem`,
        }}
        suppressContentEditableWarning
        data-placeholder={value === '' ? placeholder : ''}
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

