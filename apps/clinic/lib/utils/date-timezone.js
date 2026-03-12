/**
 * Timezone-aware date helpers for building dates in a clinic's timezone.
 * Used so follow-up appointments use 9 AM clinic time, not server local or UTC midnight.
 */

/**
 * Get the timezone offset in minutes (positive = ahead of UTC) for a given UTC moment and IANA timezone.
 * Uses both UTC and TZ formatting so the same instant is compared (avoids Intl part quirks).
 * @param {Date} dateUtc - A moment in time (UTC)
 * @param {string} timeZone - IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
 * @returns {number} Offset in minutes (e.g. 330 for IST)
 */
function getTimezoneOffsetMinutes(dateUtc, timeZone) {
  try {
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false, day: '2-digit', month: '2-digit', year: 'numeric' };
    const tzFormatter = new Intl.DateTimeFormat('en-GB', { ...opts, timeZone });
    const utcFormatter = new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' });
    const get = (formatter) => {
      const parts = formatter.formatToParts(dateUtc);
      const g = (type) => parts.find((p) => p.type === type)?.value || '0';
      const day = parseInt(g('day'), 10);
      const hour = parseInt(g('hour'), 10);
      const minute = parseInt(g('minute'), 10);
      return (day - 1) * 24 * 60 + hour * 60 + minute;
    };
    const localMins = get(tzFormatter);
    const utcMins = get(utcFormatter);
    return localMins - utcMins;
  } catch {
    return 0;
  }
}

/**
 * Get the local date (YYYY-MM-DD) and time (hour, minute) when a UTC moment is shown in a timezone.
 */
function formatUtcInTz(utcMs, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(new Date(utcMs));
  const g = (type) => parts.find((p) => p.type === type)?.value || '0';
  const y = String(parseInt(g('year'), 10) || 0);
  const m = String(parseInt(g('month'), 10) || 0).padStart(2, '0');
  const d = String(parseInt(g('day'), 10) || 0).padStart(2, '0');
  return {
    dateKey: `${y}-${m}-${d}`,
    hour: parseInt(g('hour'), 10),
    minute: parseInt(g('minute'), 10),
  };
}

/**
 * Build a Date (UTC) that represents a given local date and time in a timezone.
 * Uses binary search so the result is exact (no 15-min offset drift).
 *
 * @param {string} dateStr - Date as YYYY-MM-DD
 * @param {number} hour - Hour in 0-23 (e.g. 9 for 9 AM)
 * @param {number} minute - Minute 0-59 (default 0)
 * @param {string} timeZone - IANA timezone (e.g. 'Asia/Kolkata')
 * @returns {Date} The equivalent UTC Date, or a fallback date if parsing fails
 */
export function dateAtTimeInTimezone(dateStr, hour = 9, minute = 0, timeZone = 'UTC') {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(NaN);
  }
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(NaN);
  }
  try {
    const midnightUtc = new Date(trimmed + 'T00:00:00.000Z').getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    let low = midnightUtc - 14 * dayMs;
    let high = midnightUtc + 14 * dayMs;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const { dateKey, hour: h, minute: m } = formatUtcInTz(mid, timeZone);
      const cmp =
        dateKey !== trimmed ? (dateKey < trimmed ? -1 : 1) : h !== hour ? h - hour : m - minute;
      if (cmp < 0) low = mid + 1;
      else if (cmp > 0) high = mid - 1;
      else {
        return new Date(Math.floor(mid / 60000) * 60000);
      }
    }

    const fallback = midnightUtc + (hour * 60 + minute) * 60 * 1000 - getTimezoneOffsetMinutes(new Date(midnightUtc), timeZone) * 60 * 1000;
    return new Date(fallback);
  } catch {
    return new Date(trimmed + 'T09:00:00.000Z');
  }
}

/**
 * Get UTC timestamps for the start and end of a calendar day in a given timezone.
 * Use for filtering appointments by "this date in clinic timezone".
 *
 * @param {string} dateStr - Date as YYYY-MM-DD
 * @param {string} timeZone - IANA timezone (e.g. 'Asia/Kolkata')
 * @returns {{ startOfDayUtc: Date, endOfDayUtc: Date } | null}
 */
export function getDayRangeInTimezone(dateStr, timeZone = 'UTC') {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  try {
    const startOfDayUtc = dateAtTimeInTimezone(trimmed, 0, 0, timeZone);
    const endOfDayUtc = dateAtTimeInTimezone(trimmed, 23, 59, timeZone);
    endOfDayUtc.setSeconds(59, 999);
    if (Number.isNaN(startOfDayUtc.getTime()) || Number.isNaN(endOfDayUtc.getTime())) return null;
    return { startOfDayUtc, endOfDayUtc };
  } catch {
    return null;
  }
}
