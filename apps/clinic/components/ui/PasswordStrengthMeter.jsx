'use client';

/**
 * PasswordStrengthMeter
 * Shows a segmented bar + label indicating password strength (0–4).
 *
 * Usage:
 *   <PasswordStrengthMeter password={value} />
 */

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character (@$!%*?&)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const SEGMENT_COLORS = [
  'bg-status-error',
  'bg-status-error',
  'bg-status-warning',
  'bg-status-success/70',
  'bg-status-success',
];

export function PasswordStrengthMeter({ password = '' }) {
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
          {STRENGTH_LABELS[strength]}
        </p>
      )}

      {/* Rule checklist */}
      {password.length > 0 && (
        <ul className='space-y-1'>
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li key={rule.label} className='flex items-center gap-1.5 text-xs'>
                <span className={ok ? 'text-status-success' : 'text-neutral-400'}>
                  {ok ? '✓' : '○'}
                </span>
                <span className={ok ? 'text-neutral-700' : 'text-neutral-400'}>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
