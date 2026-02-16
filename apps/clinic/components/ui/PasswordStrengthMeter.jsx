'use client';

import { useI18n } from '@/contexts/I18nContext';

/**
 * PasswordStrengthMeter
 * Shows a segmented bar + label indicating password strength (0–4).
 *
 * Usage:
 *   <PasswordStrengthMeter password={value} />
 */

const RULE_KEYS = [
  'common.passwordRuleMinChars',
  'common.passwordRuleUppercase',
  'common.passwordRuleLowercase',
  'common.passwordRuleNumber',
  'common.passwordRuleSpecial',
];

const STRENGTH_KEYS = [
  'common.passwordStrengthTooWeak',
  'common.passwordStrengthWeak',
  'common.passwordStrengthFair',
  'common.passwordStrengthGood',
  'common.passwordStrengthStrong',
];
const SEGMENT_COLORS = [
  'bg-status-error',
  'bg-status-error',
  'bg-status-warning',
  'bg-status-success/70',
  'bg-status-success',
];

const RULES = [
  { test: (p) => p.length >= 8 },
  { test: (p) => /[A-Z]/.test(p) },
  { test: (p) => /[a-z]/.test(p) },
  { test: (p) => /[0-9]/.test(p) },
  { test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrengthMeter({ password = '' }) {
  const { t } = useI18n();
  const passed = RULES.filter((r) => r.test(password)).length;
  const strength = password.length === 0 ? 0 : Math.max(1, passed);

  return (
    <div className='mt-2 space-y-2'>
      {/* Segmented bar */}
      <div className='flex gap-1' role='progressbar' aria-valuenow={strength} aria-valuemax={5}>
        {RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < strength ? SEGMENT_COLORS[strength - 1] : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      {password.length > 0 && (
        <p
          className={`text-xs font-medium ${
            strength <= 1
              ? 'text-status-error'
              : strength === 2
              ? 'text-status-warning'
              : 'text-status-success'
          }`}
        >
          {t(STRENGTH_KEYS[strength])}
        </p>
      )}

      {/* Rule checklist */}
      {password.length > 0 && (
        <ul className='space-y-1'>
          {RULES.map((rule, idx) => {
            const ok = rule.test(password);
            return (
              <li key={RULE_KEYS[idx]} className='flex items-center gap-1.5 text-xs'>
                <span className={ok ? 'text-status-success' : 'text-neutral-400'}>
                  {ok ? '✓' : '○'}
                </span>
                <span className={ok ? 'text-neutral-700' : 'text-neutral-400'}>{t(RULE_KEYS[idx])}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
