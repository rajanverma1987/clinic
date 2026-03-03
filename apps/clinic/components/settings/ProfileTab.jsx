'use client';

import { PencilIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { getAvatarPlaceholder } from '@/lib/utils/avatars';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AvailabilityForm } from './AvailabilityForm';
import { TwoFactorSetup } from './TwoFactorSetup';

const AVATAR_MAX_SIZE = 400;
const AVATAR_JPEG_QUALITY = 0.85;
const AVATAR_MAX_BYTES = 500 * 1024;
const CROP_SIZE = 320;

/** Profile photo validation: file size (MB) and dimensions (px). */
const AVATAR_FILE_MIN_MB = 0.01;
const AVATAR_FILE_MAX_MB = 5;
const AVATAR_MIN_WIDTH = 100;
const AVATAR_MIN_HEIGHT = 100;
const AVATAR_MAX_WIDTH = 4096;
const AVATAR_MAX_HEIGHT = 4096;

const AVATAR_FILE_MIN_BYTES = AVATAR_FILE_MIN_MB * 1024 * 1024;
const AVATAR_FILE_MAX_BYTES = AVATAR_FILE_MAX_MB * 1024 * 1024;

/**
 * Validate file size and image dimensions. Returns { valid: boolean, error?: string }.
 * Call after image is loaded (use naturalWidth/naturalHeight).
 */
function validateAvatarImage(file, width, height) {
  if (file.size < AVATAR_FILE_MIN_BYTES) {
    return {
      valid: false,
      error: 'uploadPhotoTooSmall',
      params: { minMB: AVATAR_FILE_MIN_MB, maxMB: AVATAR_FILE_MAX_MB },
    };
  }
  if (file.size > AVATAR_FILE_MAX_BYTES) {
    return {
      valid: false,
      error: 'uploadPhotoTooLarge',
      params: { minMB: AVATAR_FILE_MIN_MB, maxMB: AVATAR_FILE_MAX_MB },
    };
  }
  if (width < AVATAR_MIN_WIDTH || height < AVATAR_MIN_HEIGHT) {
    return {
      valid: false,
      error: 'uploadPhotoDimensionsTooSmall',
      params: {
        minWidth: AVATAR_MIN_WIDTH,
        minHeight: AVATAR_MIN_HEIGHT,
        maxWidth: AVATAR_MAX_WIDTH,
        maxHeight: AVATAR_MAX_HEIGHT,
      },
    };
  }
  if (width > AVATAR_MAX_WIDTH || height > AVATAR_MAX_HEIGHT) {
    return {
      valid: false,
      error: 'uploadPhotoDimensionsTooLarge',
      params: {
        minWidth: AVATAR_MIN_WIDTH,
        minHeight: AVATAR_MIN_HEIGHT,
        maxWidth: AVATAR_MAX_WIDTH,
        maxHeight: AVATAR_MAX_HEIGHT,
      },
    };
  }
  return { valid: true };
}

/** Resize image to fit within maxSize and return as JPEG data URL. */
function resizeImageToDataUrl(file, maxSize = AVATAR_MAX_SIZE, quality = AVATAR_JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, maxSize / Math.max(w, h));
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/** Crop image from canvas: draw visible region (position + scale) to CROP_SIZE x CROP_SIZE and return data URL. */
function cropImageToDataUrl(img, positionX, positionY, scale, quality = AVATAR_JPEG_QUALITY) {
  const canvas = document.createElement('canvas');
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  const sx = -positionX / scale;
  const sy = -positionY / scale;
  const sw = CROP_SIZE / scale;
  const sh = CROP_SIZE / scale;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE);
  return canvas.toDataURL('image/jpeg', quality);
}

export function ProfileTab({
  currentUser,
  logout,
  saving,
  onToggleStatus,
  availabilityForm,
  setAvailabilityForm,
  onEditProfileClick,
  on2FAStatusChange,
  onAvatarUploaded,
}) {
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const fileInputRef = useRef(null);
  const cropImageRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropPreviewUrl, setCropPreviewUrl] = useState('');
  const [cropImageSize, setCropImageSize] = useState({ w: 0, h: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);

  const handleCropImageLoad = useCallback(() => {
    const img = cropImageRef.current;
    if (!img || !img.naturalWidth) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    setCropImageSize({ w, h });
    setCropScale(scale);
    setCropPosition({
      x: (CROP_SIZE - w * scale) / 2,
      y: (CROP_SIZE - h * scale) / 2,
    });
  }, []);

  const handleCropMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDraggingCrop(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: cropPosition.x,
        posY: cropPosition.y,
      };
    },
    [cropPosition.x, cropPosition.y],
  );

  const handleCropMouseMove = useCallback(
    (e) => {
      if (!isDraggingCrop) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const img = cropImageRef.current;
      if (!img || !cropImageSize.w) return;
      const scale = cropScale;
      const maxX = 0;
      const minX = CROP_SIZE - cropImageSize.w * scale;
      const maxY = 0;
      const minY = CROP_SIZE - cropImageSize.h * scale;
      setCropPosition({
        x: Math.min(maxX, Math.max(minX, dragStartRef.current.posX + dx)),
        y: Math.min(maxY, Math.max(minY, dragStartRef.current.posY + dy)),
      });
    },
    [isDraggingCrop, cropImageSize.w, cropImageSize.h, cropScale],
  );

  const handleCropMouseUp = useCallback(() => {
    setIsDraggingCrop(false);
  }, []);

  useEffect(() => {
    if (!showCropModal) return;
    const onMove = (e) => handleCropMouseMove(e);
    const onUp = () => handleCropMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [showCropModal, handleCropMouseMove, handleCropMouseUp]);

  const handleCloseCropModal = useCallback(() => {
    if (cropPreviewUrl) URL.revokeObjectURL(cropPreviewUrl);
    setCropPreviewUrl('');
    setShowCropModal(false);
  }, [cropPreviewUrl]);

  const handleApplyCrop = useCallback(async () => {
    const img = cropImageRef.current;
    if (!img || !cropImageSize.w) return;
    const userId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = cropImageToDataUrl(img, cropPosition.x, cropPosition.y, cropScale);
      const response = await apiClient.put(`/users/${userId}`, { avatar: dataUrl });
      handleCloseCropModal();
      if (response?.success) {
        showSuccess(t('settings.profilePhotoUpdated') || 'Profile photo updated.');
        onAvatarUploaded?.();
      } else {
        showError(response?.error?.message || t('errors.generic') || 'Failed to update photo.');
      }
    } catch (err) {
      showError(err?.message || t('errors.generic') || 'Failed to update photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [
    currentUser,
    cropPosition,
    cropScale,
    cropImageSize.w,
    onAvatarUploaded,
    handleCloseCropModal,
    t,
  ]);

  const handleLogoutClick = () => {
    openConfirm({
      title: t('auth.confirmLogout', 'Confirm Sign Out'),
      message:
        t('auth.logoutConfirmMessage') ||
        'Are you sure you want to sign out? You will need to sign in again to access your account.',
      variant: 'danger',
      onConfirm: () => logout(),
    });
  };

  const handleAvatarFileSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      showError(
        t('settings.uploadPhotoInvalid') || 'Please select an image file (JPEG, PNG, GIF).',
      );
      return;
    }
    if (file.size < AVATAR_FILE_MIN_BYTES) {
      showError(
        t('settings.uploadPhotoTooSmall', {
          minMB: AVATAR_FILE_MIN_MB,
          maxMB: AVATAR_FILE_MAX_MB,
        }) || `Image must be between ${AVATAR_FILE_MIN_MB} MB and ${AVATAR_FILE_MAX_MB} MB.`,
      );
      return;
    }
    if (file.size > AVATAR_FILE_MAX_BYTES) {
      showError(
        t('settings.uploadPhotoTooLarge', {
          minMB: AVATAR_FILE_MIN_MB,
          maxMB: AVATAR_FILE_MAX_MB,
        }) || `Image must be between ${AVATAR_FILE_MIN_MB} MB and ${AVATAR_FILE_MAX_MB} MB.`,
      );
      return;
    }
    e.target.value = '';
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const result = validateAvatarImage(file, w, h);
      if (!result.valid) {
        URL.revokeObjectURL(url);
        const msg =
          result.error === 'uploadPhotoDimensionsTooSmall'
            ? t('settings.uploadPhotoDimensionsTooSmall', result.params) ||
              `Image dimensions must be between ${AVATAR_MIN_WIDTH}×${AVATAR_MIN_HEIGHT} and ${AVATAR_MAX_WIDTH}×${AVATAR_MAX_HEIGHT} px.`
            : result.error === 'uploadPhotoDimensionsTooLarge'
              ? t('settings.uploadPhotoDimensionsTooLarge', result.params) ||
                `Image dimensions must be between ${AVATAR_MIN_WIDTH}×${AVATAR_MIN_HEIGHT} and ${AVATAR_MAX_WIDTH}×${AVATAR_MAX_HEIGHT} px.`
              : t(`settings.${result.error}`, result.params);
        showError(msg);
        return;
      }
      setCropPreviewUrl(url);
      setCropImageSize({ w: 0, h: 0 });
      setCropPosition({ x: 0, y: 0 });
      setShowCropModal(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showError(t('settings.uploadPhotoInvalid') || 'Failed to load image.');
    };
    img.src = url;
  };

  const getRoleLabel = useCallback(
    (role) => {
      const roleKeys = {
        super_admin: 'common.roleSuperAdmin',
        clinic_admin: 'common.roleClinicAdmin',
        doctor: 'common.roleDoctor',
        nurse: 'settings.roleNurse',
        receptionist: 'settings.roleReceptionist',
        accountant: 'settings.roleAccountant',
        pharmacist: 'settings.rolePharmacist',
        lab_tech: 'staff.labTech',
        staff: 'common.roleStaff',
        manager: 'settings.roleManager',
      };
      return roleKeys[role] ? t(roleKeys[role]) : (role ? String(role).replace(/_/g, ' ') : '—');
    },
    [t],
  );

  return (
    <div className='w-full max-w-4xl space-y-6 text-left'>
      {/* No section heading: page title and tab already show "Profile" */}
      {/* Profile overview card – avatar, name, role, status, actions in a single clear row */}
      <Card>
        <div className='p-6'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
            {/* Avatar – 120px, edit icon top-right */}
            <div className='flex-shrink-0'>
              <div className='relative w-[120px] h-[120px] rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 ring-2 ring-neutral-200 dark:ring-neutral-600'>
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar}
                    alt={
                      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                      'Profile'
                    }
                    className='w-full h-full object-cover'
                  />
                ) : (
                  (() => {
                    const displayName =
                      `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
                      currentUser?.email ||
                      '';
                    const { initials, color } = getAvatarPlaceholder(displayName);
                    return (
                      <div
                        className={`w-full h-full flex items-center justify-center text-2xl font-semibold text-white ${color}`}
                        aria-hidden
                      >
                        {initials}
                      </div>
                    );
                  })()
                )}
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  iconOnly
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar || saving}
                  className='absolute top-1.5 right-1.5 w-8 h-8 min-w-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 shadow-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  aria-label={
                    t('settings.uploadPhoto') || t('common.uploadPhoto') || 'Upload photo'
                  }
                >
                  <PencilIcon className='icon icon-xs' ariaHidden />
                </Button>
                <div
                  className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-800 ${
                    currentUser?.isActive ? 'bg-status-success' : 'bg-status-error'
                  }`}
                  title={currentUser?.isActive ? t('common.active') : t('common.inactive')}
                  aria-hidden
                />
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/gif,image/webp'
                className='sr-only'
                aria-label={t('settings.uploadPhoto') || t('common.uploadPhoto') || 'Upload photo'}
                onChange={handleAvatarFileSelect}
              />
            </div>

            {/* Name, role, email, status – single column */}
            <div className='flex-1 min-w-0 text-center sm:text-left'>
              <h2 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>
                {currentUser?.role === 'doctor'
                  ? `Dr. ${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
                  : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()}
              </h2>
              <p className='mt-1 text-sm text-neutral-600 dark:text-neutral-400'>
                {getRoleLabel(currentUser?.role)}
              </p>
              <p className='mt-0.5 text-sm text-neutral-500 dark:text-neutral-500'>
                {currentUser?.email}
              </p>
              <div className='mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3'>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    currentUser?.isActive
                      ? 'bg-status-success/10 text-status-success dark:bg-status-success/20'
                      : 'bg-status-error/10 text-status-error dark:bg-status-error/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentUser?.isActive ? 'bg-status-success' : 'bg-status-error'
                    }`}
                  />
                  {currentUser?.isActive ? t('common.active') : t('common.inactive')}
                </span>
                <span className='text-xs text-neutral-500 dark:text-neutral-400'>
                  {t('settings.toggleStatus')}
                </span>
                <Toggle
                  checked={currentUser?.isActive || false}
                  onChange={onToggleStatus}
                  disabled={saving}
                />
              </div>
              <div className='mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2'>
                {currentUser?.role === 'doctor' ? (
                  <Link href='/doctors/profile'>
                    <Button variant='primary' size='sm'>
                      {t('settings.editProfile')}
                    </Button>
                  </Link>
                ) : onEditProfileClick ? (
                  <Button variant='primary' size='sm' onClick={onEditProfileClick}>
                    {t('settings.editProfile')}
                  </Button>
                ) : (
                  <Link href='/settings?tab=profile'>
                    <Button variant='primary' size='sm'>
                      {t('settings.editProfile')}
                    </Button>
                  </Link>
                )}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleLogoutClick}
                  className='border border-neutral-200 dark:border-neutral-700 !border-neutral-200 dark:!border-neutral-700 bg-white dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:border-status-error/50 hover:bg-status-error/10 hover:text-status-error dark:hover:border-status-error/50 dark:hover:bg-status-error/10 dark:hover:text-status-error'
                >
                  {t('auth.logout')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Crop photo modal */}
      <Modal
        isOpen={showCropModal}
        onClose={handleCloseCropModal}
        title={t('settings.cropPhoto') || 'Crop photo'}
        size='md'
      >
        <div className='p-4'>
          <p className='text-sm text-neutral-600 mb-4'>
            {t('settings.cropPhotoHint') ||
              'Drag the image to position it. The square area will be used as your profile photo.'}
          </p>
          <div
            className='relative mx-auto overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700 select-none'
            style={{
              width: CROP_SIZE,
              height: CROP_SIZE,
              cursor: isDraggingCrop ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleCropMouseDown}
            role='img'
            aria-label={t('settings.cropArea')}
          >
            {cropPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={cropImageRef}
                src={cropPreviewUrl}
                alt=''
                className='absolute select-none pointer-events-none'
                style={{
                  width: cropImageSize.w ? cropImageSize.w * cropScale : 'auto',
                  height: cropImageSize.h ? cropImageSize.h * cropScale : 'auto',
                  left: cropPosition.x,
                  top: cropPosition.y,
                }}
                draggable={false}
                onLoad={handleCropImageLoad}
              />
            )}
          </div>
          <div className='flex justify-end gap-2 mt-6'>
            <Button variant='ghost' onClick={handleCloseCropModal}>
              {t('common.cancel')}
            </Button>
            <Button
              variant='primary'
              onClick={handleApplyCrop}
              disabled={uploadingAvatar || !cropImageSize.w}
            >
              {uploadingAvatar ? t('common.uploading') || 'Uploading…' : t('common.apply')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Personal information & Security – two columns */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('auth.personalInformation')}
            </h3>
            <dl className='space-y-3'>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide'>
                  {t('auth.firstName')}
                </dt>
                <dd className='mt-0.5 text-sm text-neutral-900 dark:text-neutral-100'>
                  {currentUser?.firstName || '—'}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide'>
                  {t('auth.lastName')}
                </dt>
                <dd className='mt-0.5 text-sm text-neutral-900 dark:text-neutral-100'>
                  {currentUser?.lastName || '—'}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide'>
                  {t('auth.email')}
                </dt>
                <dd className='mt-0.5 text-sm text-neutral-900 dark:text-neutral-100 break-all'>
                  {currentUser?.email || '—'}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide'>
                  {t('common.role')}
                </dt>
                <dd className='mt-0.5 text-sm text-neutral-900 dark:text-neutral-100'>
                  {getRoleLabel(currentUser?.role) || '—'}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide'>
                  {t('settings.subscriptionPlan')}
                </dt>
                <dd className='mt-0.5 text-sm text-neutral-900 dark:text-neutral-100'>
                  {currentUser?.subscriptionPlan?.name || t('settings.noPlan')}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.security')}
            </h3>
            <div className='space-y-5'>
              <div>
                <p className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                  {t('auth.password')}
                </p>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                  {t('settings.changePasswordHint')}
                </p>
                <Link href='/change-password' className='inline-block mt-2'>
                  <Button variant='primary' size='sm'>
                    {t('settings.changePasswordLabel')}
                  </Button>
                </Link>
              </div>
              <div className='pt-4 border-t border-neutral-200 dark:border-neutral-600'>
                <p className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                  {t('auth.twoFactorAuthentication')}
                </p>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
                  {t('auth.twoFactorDescription')}
                </p>
                <div className='mt-3'>
                  <TwoFactorSetup
                    is2FAEnabled={!!currentUser?.twoFactorEnabled}
                    onStatusChange={on2FAStatusChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {currentUser?.role === 'doctor' && (
        <Card>
          <div className='p-5'>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4'>
              {t('settings.availabilitySettings')}
            </h3>
            <AvailabilityForm
              availabilityForm={availabilityForm}
              setAvailabilityForm={setAvailabilityForm}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
