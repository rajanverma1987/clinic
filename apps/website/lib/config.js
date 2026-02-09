/**
 * Clinic app URL for Login and "Get Clinic Access" links.
 * Development: http://localhost:5053 (clinic app dev port).
 * Production: use NEXT_PUBLIC_CLINIC_APP_URL or default to accounts.doctorsclinic.services.
 */
export const CLINIC_APP_URL =
  process.env.NEXT_PUBLIC_CLINIC_APP_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5053'
    : 'https://accounts.doctorsclinic.services');
