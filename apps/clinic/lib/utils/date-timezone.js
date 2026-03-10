/**
 * Timezone-aware date helpers for building dates in a clinic's timezone.
 * Used so follow-up appointments use 9 AM clinic time, not server local or UTC midnight.
 */

/**
 * Get the timezone offset in minutes (positive = ahead of UTC) for a given UTC moment and IANA timezone.
 * @param {Date} dateUtc - A moment in time (UTC)
 * @param {string} timeZone - IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
 * @returns {number} Offset in minutes (e.g. 330 for IST)
 */
function getTimezoneOffsetMinutes(dateUtc, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(dateUtc);
    const get = (type) => parts.find((p) => p.type === type)?.value || '0';
    const localDay = parseInt(get('day'), 10);
    const localHour = parseInt(get('hour'), 10);
    const localMinute = parseInt(get('minute'), 10);
    const utcDay = dateUtc.getUTCDate();
    const utcHour = dateUtc.getUTCHours();
    const utcMinute = dateUtc.getUTCMinutes();
    const localMins = (localDay - 1) * 24 * 60 + localHour * 60 + localMinute;
    const utcMins = (utcDay - 1) * 24 * 60 + utcHour * 60 + utcMinute;
    return localMins - utcMins;
  } catch {
    return 0;
  }
}

/**
 * Build a Date (UTC) that represents a given local date and time in a timezone.
 * Use for scheduling (e.g. "9 AM on follow-up date" in clinic timezone).
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
    // Noon UTC on that day to get a stable offset for the date
    const noonUtc = new Date(trimmed + 'T12:00:00.000Z');
    const offsetMinutes = getTimezoneOffsetMinutes(noonUtc, timeZone);
    // Local time in minutes from midnight: we want (hour, minute) on that date in TZ
    const localMinutesFromMidnight = hour * 60 + minute;
    const utcMinutesFromMidnight = localMinutesFromMidnight - offsetMinutes;
    const midnightUtc = new Date(trimmed + 'T00:00:00.000Z');
    return new Date(midnightUtc.getTime() + utcMinutesFromMidnight * 60 * 1000);
  } catch {
    return new Date(trimmed + 'T09:00:00.000Z');
  }
}
