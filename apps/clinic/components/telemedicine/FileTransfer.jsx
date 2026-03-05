'use client';

import { DocumentIcon, FileDownIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/lib/utils/logger.js';
import { showError } from '@/lib/utils/toast';
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
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB for HIPAA compliance)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError(t('errors.fileSizeExceeded'));
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
      logger.error('File upload error:', error);
      showError(t('errors.fileUploadFailed'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file) => {
    try {
      await onDownload(file);
    } catch (error) {
      logger.error('File download error:', error);
      showError(t('errors.fileDownloadFailed'));
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
      className='absolute right-0 top-0 h-full w-80 bg-neutral-100 border-l border-neutral-300 flex flex-col'
      style={{ zIndex: 'var(--z-fixed, 30)' }}
    >
      {/* File Transfer Header */}
      <div className='bg-white border-b border-neutral-300 px-4 py-3 flex items-center justify-between'>
        <h3 className='text-neutral-900 font-semibold'>{t('telemedicine.fileTransfer')}</h3>
        <Button
          variant='ghost'
          size='xs'
          iconOnly
          onClick={onClose}
          className='text-neutral-600 hover:text-neutral-900'
        >
          <XIcon className='icon icon-sm' />
        </Button>
      </div>

      {/* Upload Section */}
      <div className='p-4 border-b border-neutral-300 bg-neutral-50'>
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
          className={`block w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-center cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? t('telemedicine.uploadingProgress', { progress: uploadProgress }) : t('telemedicine.uploadFile')}
        </label>
        {uploading && (
          <div className='mt-2 w-full bg-neutral-200 rounded-full h-2'>
            <div
              className='bg-primary-600 h-2 rounded-full'
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        <p className='text-xs text-neutral-600 mt-2 text-center'>
          {t('telemedicine.maxFileSizeEncrypted')}
        </p>
      </div>

      {/* Files List */}
      <div className='flex-1 overflow-y-auto p-4 space-y-2'>
        {files.length === 0 ? (
          <div className='text-center text-neutral-600 text-sm mt-8'>{t('telemedicine.noFilesSharedYet')}</div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              className='bg-white border border-neutral-200 rounded-lg p-3 flex items-center justify-between hover:bg-neutral-50'
            >
              <div className='flex items-center space-x-3 flex-1 min-w-0'>
                <div className='w-10 h-10 bg-primary-600 rounded flex items-center justify-center flex-shrink-0'>
                  <DocumentIcon className='icon icon-md text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-neutral-900 text-sm font-medium truncate'>{file.fileName}</p>
                  <p className='text-neutral-600 text-xs'>
                    {formatFileSize(file.fileSize)} •{' '}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                iconOnly
                onClick={() => handleDownload(file)}
                className='ml-2 p-2 min-w-0 text-primary-600 hover:text-primary-700'
                title={t('telemedicine.downloadFile')}
              >
                <FileDownIcon className='icon icon-sm' />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
