'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/contexts/I18nContext';

/**
 * TwoFactorSetup
 * Embeds inside ProfileTab's Security card.
 * Drives the full enable/disable 2FA flow via existing API routes:
 *   POST /api/auth/2fa/setup   → returns { secret, qrCodeUrl }
 *   POST /api/auth/2fa/verify  → { code } → enables 2FA
 *   POST /api/auth/2fa/disable → { password, code? } → disables 2FA
 *
 * Props:
 *   is2FAEnabled {boolean}  — current 2FA state from server
 *   onStatusChange {fn}     — called with new boolean after success
 */
export function TwoFactorSetup({ is2FAEnabled, onStatusChange }) {
  const { t } = useI18n();
  const [step, setStep] = useState('idle'); // idle | setup | verify | disable
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const reset = () => {
    setStep('idle');
    setQrUrl('');
    setSecret('');
    setCode('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  /* ── Enable flow ── */
  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || t('auth.setupFailed'));
      setQrUrl(json.data.qrCodeUrl);
      setSecret(json.data.secret);
      setStep('verify');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setError(t('auth.enter6DigitCode')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || t('auth.verificationFailed'));
      setSuccess(t('auth.twoFactorEnabledSuccess'));
      onStatusChange?.(true);
      setTimeout(reset, 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Disable flow ── */
  const handleDisable = async () => {
    if (!password) { setError(t('auth.passwordRequiredFor2fa')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code: code || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || t('auth.setupFailed'));
      setSuccess(t('auth.twoFactorDisabledSuccess'));
      onStatusChange?.(false);
      setTimeout(reset, 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  if (success) {
    return (
      <p className='text-sm font-medium text-status-success py-2'>{success}</p>
    );
  }

  /* Idle — show status + action button */
  if (step === 'idle') {
    return (
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
              is2FAEnabled
                ? 'bg-status-success/10 text-status-success border border-status-success/20'
                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
            }`}
          >
            {is2FAEnabled ? t('auth.twoFactorEnabled') : t('auth.twoFactorDisabled')}
          </span>
        </div>
        {is2FAEnabled ? (
          <Button variant='danger' size='sm' onClick={() => setStep('disable')}>
            {t('auth.disable2fa')}
          </Button>
        ) : (
          <Button variant='secondary' size='sm' onClick={handleSetup} disabled={loading}>
            {loading ? t('auth.settingUp') : t('auth.enable2fa')}
          </Button>
        )}
      </div>
    );
  }

  /* Verify step — show QR + code input */
  if (step === 'verify') {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-neutral-600'>
          {t('auth.scanQRInstructions')}
        </p>
        {/* QR code rendered as an <img> from the otpauth URL via a free QR service */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
          alt='2FA QR Code'
          className='rounded-lg border border-neutral-200'
          width={180}
          height={180}
        />
        <p className='text-xs text-neutral-500 break-all'>
          Or enter manually: <span className='font-mono font-semibold'>{secret}</span>
        </p>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-neutral-700'>{t('auth.verificationCode')}</label>
          <Input
            type='text'
            inputMode='numeric'
            maxLength={6}
            placeholder={t('auth.verificationCodePlaceholder')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        {error && <p className='text-xs text-status-error'>{error}</p>}
        <div className='flex gap-2'>
          <Button variant='primary' size='sm' onClick={handleVerify} disabled={loading}>
            {loading ? t('auth.verifying') : t('auth.verifyAndEnable')}
          </Button>
          <Button variant='ghost' size='sm' onClick={reset}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  /* Disable step — password + optional TOTP */
  if (step === 'disable') {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-neutral-600'>
          {t('auth.passwordRequiredToDisable')}
        </p>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-neutral-700'>{t('auth.password')}</label>
          <Input
            type='password'
            placeholder={t('auth.currentPasswordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-neutral-700'>
            {t('auth.authenticatorCodeOptional')}
          </label>
          <Input
            type='text'
            inputMode='numeric'
            maxLength={6}
            placeholder={t('auth.verificationCodePlaceholder')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        {error && <p className='text-xs text-status-error'>{error}</p>}
        <div className='flex gap-2'>
          <Button variant='danger' size='sm' onClick={handleDisable} disabled={loading}>
            {loading ? t('auth.disabling') : t('auth.confirmDisable')}
          </Button>
          <Button variant='ghost' size='sm' onClick={reset}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
