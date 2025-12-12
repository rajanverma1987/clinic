'use client';

import { useRef, useState } from 'react';

/**
 * Encrypted File Transfer Component
 * HIPAA-compliant file sharing during video calls
 */
export function FileTransfer({
  files = [],
  onUpload,
  onDownload,
  currentUserId,
  isOpen = false,
  onClose,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB for HIPAA compliance)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create encrypted file reader
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      reader.onload = async (e) => {
        const fileData = e.target.result; // ArrayBuffer

        // Upload file (encryption happens in parent component with encryption key)
        await onUpload({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: fileData, // Pass ArrayBuffer for encryption
          uploadedBy: currentUserId,
          uploadedAt: new Date().toISOString(),
        });

        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file) => {
    try {
      // Download and decrypt file
      await onDownload(file);
    } catch (error) {
      console.error('File download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div
      className='absolute right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 flex flex-col'
      style={{ zIndex: 'var(--z-fixed, 30)' }}
    >
      {/* File Transfer Header */}
      <div className='bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700'>
        <h3 className='text-white font-semibold'>File Transfer</h3>
        <button onClick={onClose} className='text-gray-400 hover:text-white'>
          <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Upload Section */}
      <div className='p-4 border-b border-gray-700 bg-gray-800'>
        <input
          ref={fileInputRef}
          type='file'
          onChange={handleFileSelect}
          className='hidden'
          id='file-upload'
          disabled={uploading}
        />
        <label
          htmlFor='file-upload'
          className={`block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? `Uploading... ${uploadProgress}%` : 'Upload File'}
        </label>
        {uploading && (
          <div className='mt-2 w-full bg-gray-700 rounded-full h-2'>
            <div className='bg-blue-600 h-2 rounded-full' style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        <p className='text-xs text-gray-500 mt-2 text-center'>Max file size: 10MB • 🔒 Encrypted</p>
      </div>

      {/* Files List */}
      <div className='flex-1 overflow-y-auto p-4 space-y-2'>
        {files.length === 0 ? (
          <div className='text-center text-gray-500 text-sm mt-8'>No files shared yet</div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className='bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-700'
            >
              <div className='flex items-center space-x-3 flex-1 min-w-0'>
                <div className='w-10 h-10 bg-blue-600 rounded flex items-center justify-center flex-shrink-0'>
                  <svg
                    width='24px'
                    height='24px'
                    className='text-white'
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
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-white text-sm font-medium truncate'>{file.fileName}</p>
                  <p className='text-gray-400 text-xs'>
                    {formatFileSize(file.fileSize)} •{' '}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(file)}
                className='ml-2 p-2 text-blue-400 hover:text-blue-300'
                title='Download file'
              >
                <svg width='20px' height='20px' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
