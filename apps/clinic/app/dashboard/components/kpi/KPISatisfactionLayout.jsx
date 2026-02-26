'use client';

/**
 * KPI satisfaction layout components – design-only match to reference.
 * Gauges, horizontal bars, donuts, table; data comes from parent (existing dashboard stats).
 */
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

/** Single gauge: value (0–100 or mins), label, unit. Needle and arc reflect value; green/yellow/red. */
function Gauge({ value = 0, label, unit = 'mins' }) {
  const num = typeof value === 'number' ? value : 0;
  const pct = Math.min(100, Math.max(0, num > 50 ? num : num * 2));
  const rotation = -90 + (pct / 100) * 180;
  const arcLength = (pct / 100) * Math.PI * 40;
  const strokeColor =
    pct <= 33
      ? 'var(--color-status-success)'
      : pct <= 66
        ? 'var(--color-status-warning)'
        : 'var(--color-status-error)';
  return (
    <div className='kpi-gauge flex flex-col items-center flex-1 min-w-0'>
      <div className='kpi-gauge__dial relative w-full aspect-[2/1] max-w-[140px] mx-auto'>
        <svg viewBox='0 0 100 50' className='w-full h-full block'>
          <path
            d='M 10 45 A 40 40 0 0 1 90 45'
            fill='none'
            stroke='var(--color-neutral-200)'
            strokeWidth='8'
            strokeLinecap='round'
          />
          <path
            d='M 10 45 A 40 40 0 0 1 90 45'
            fill='none'
            stroke={strokeColor}
            strokeWidth='8'
            strokeLinecap='round'
            strokeDasharray={`${arcLength} 126`}
            strokeDashoffset={126 - arcLength}
          />
          <line
            x1='50'
            y1='45'
            x2={50 + 38 * Math.cos((rotation * Math.PI) / 180)}
            y2={45 + 38 * Math.sin((rotation * Math.PI) / 180)}
            stroke='var(--color-neutral-800)'
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
      </div>
      <p className='kpi-gauge__label text-body-xs text-neutral-600 dark:text-neutral-400 mt-2 text-center'>
        {label}
      </p>
      <p className='kpi-gauge__value text-base font-semibold text-neutral-900 dark:text-neutral-100'>
        {num} {unit}
      </p>
    </div>
  );
}

/** Card with 3 gauges. */
export function GaugeCard({ title, items, loading }) {
  const { t } = useI18n();
  if (loading) {
    return (
      <Card className='kpi-card kpi-card--gauges p-6 min-h-[280px]'>
        <div className='skeleton skeleton-text w-48 h-5 mb-6' />
        <div className='flex justify-between gap-6'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='skeleton flex-1 max-w-[140px] aspect-[2/1] rounded-lg' />
          ))}
        </div>
      </Card>
    );
  }
  return (
    <Card className='kpi-card kpi-card--gauges p-6 min-h-[280px] flex flex-col'>
      <h3 className='kpi-card__title text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6'>
        {title}
      </h3>
      <div className='flex justify-between gap-4 flex-1 items-start'>
        {(items || []).map((item, i) => (
          <Gauge key={i} value={item.value} label={item.label} unit={item.unit || 'mins'} />
        ))}
      </div>
    </Card>
  );
}

/** Horizontal bar chart: [{ label, value (0–100 or count), color? }]. */
export function HorizontalBarCard({ title, data, loading }) {
  const { t } = useI18n();
  const max = Math.max(...(data || []).map((d) => d.value), 1);
  if (loading) {
    return (
      <Card className='kpi-card kpi-card--bars p-6 min-h-[280px]'>
        <div className='skeleton skeleton-text w-56 h-5 mb-5' />
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='skeleton h-8 w-full rounded-lg' />
          ))}
        </div>
      </Card>
    );
  }
  return (
    <Card className='kpi-card kpi-card--bars p-6 min-h-[280px] flex flex-col'>
      <h3 className='kpi-card__title text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5'>
        {title}
      </h3>
      <div className='space-y-4 flex-1'>
        {(data || []).map((item, i) => (
          <div key={i} className='kpi-hbar flex items-center gap-3'>
            <span className='kpi-hbar__label text-body-sm text-neutral-600 dark:text-neutral-400 w-32 shrink-0'>
              {item.label}
            </span>
            <div className='kpi-hbar__track flex-1 min-w-0 h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden'>
              <div
                className='kpi-hbar__fill h-full rounded-lg transition-[width] duration-300'
                style={{
                  width: `${(item.value / max) * 100}%`,
                  minWidth: item.value > 0 ? '8px' : 0,
                }}
              />
            </div>
            <span className='kpi-hbar__value text-body-sm font-semibold text-neutral-800 dark:text-neutral-200 w-10 text-right'>
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Donut: segments [{ label, value, color }], centerLabel. Normalizes to 100% for full donut. */
export function DonutCard({ title, segments, centerLabel, loading }) {
  const raw = segments || [];
  const total = raw.reduce((s, seg) => s + seg.value, 0) || 1;
  const normalized = raw.map((s) => ({ ...s, value: Math.round((s.value / total) * 100) }));
  const r = 64;
  const C = 2 * Math.PI * r;
  const size = 200;
  const cx = size / 2;
  let offset = C;
  if (loading) {
    return (
      <Card className='kpi-card kpi-card--donut p-6 min-h-[320px] flex flex-col items-center justify-center'>
        <div className='skeleton skeleton-text w-40 h-5 mb-5' />
        <div className='skeleton w-[200px] h-[200px] rounded-full' />
      </Card>
    );
  }
  return (
    <Card className='kpi-card kpi-card--donut p-6 min-h-[320px] flex flex-col'>
      <h3 className='kpi-card__title text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5 text-center'>
        {title}
      </h3>
      <div className='kpi-donut relative flex justify-center items-center flex-1 min-h-[200px]'>
        <svg width={size} height={size} className='-rotate-90 shrink-0'>
          {normalized.map((seg, i) => {
            const ratio = seg.value / 100;
            const dash = ratio * C;
            const segOffset = offset;
            offset -= dash;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cx}
                r={r}
                fill='none'
                stroke={seg.color || 'var(--color-primary-500)'}
                strokeWidth='20'
                strokeDasharray={`${dash} ${C}`}
                strokeDashoffset={-segOffset + C}
                strokeLinecap='round'
              />
            );
          })}
        </svg>
        <div className='kpi-donut__center absolute inset-0 flex items-center justify-center pointer-events-none'>
          <span className='text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 text-center px-4'>
            {centerLabel}
          </span>
        </div>
      </div>
      <div className='kpi-donut__legend mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2'>
        {normalized.map((seg, i) => (
          <span key={i} className='flex items-center gap-2 text-body-sm'>
            <span
              className='w-3 h-3 rounded-full shrink-0'
              style={{ backgroundColor: seg.color || 'var(--color-primary-500)' }}
            />
            {seg.label} {seg.value}%
          </span>
        ))}
      </div>
    </Card>
  );
}

/** Table: rows = department names, cols = day labels, cells = duration (e.g. "18 min"). */
export function VisitLengthTableCard({ title, rows, columns, getCell, loading }) {
  const { t } = useI18n();
  if (loading) {
    return (
      <Card className='kpi-card kpi-card--table p-6 min-h-[280px] overflow-auto'>
        <div className='skeleton skeleton-text w-56 h-5 mb-5' />
        <div className='skeleton h-52 w-full rounded-lg' />
      </Card>
    );
  }
  const rowList = rows || [];
  const colList = columns || [];
  return (
    <Card className='kpi-card kpi-card--table p-6 min-h-[280px] flex flex-col overflow-hidden'>
      <h3 className='kpi-card__title text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5'>
        {title}
      </h3>
      <div className='kpi-table-wrap overflow-auto flex-1 min-h-0 rounded-lg border border-neutral-200 dark:border-neutral-600'>
        <table className='kpi-table w-full text-body-sm border-collapse'>
          <thead>
            <tr>
              <th className='kpi-table__th text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50'>
                {t('common.department')}
              </th>
              {colList.map((col, j) => (
                <th
                  key={j}
                  className='kpi-table__th py-3 px-3 font-semibold text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50 whitespace-nowrap'
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowList.map((row, i) => (
              <tr
                key={i}
                className='border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
              >
                <td className='kpi-table__td py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100'>
                  {row}
                </td>
                {colList.map((col, j) => (
                  <td
                    key={j}
                    className='kpi-table__td py-3 px-3 text-neutral-600 dark:text-neutral-400'
                  >
                    {getCell ? getCell(row, col, i, j) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
