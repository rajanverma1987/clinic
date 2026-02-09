/**
 * Utility to map region to default country code
 */

export function getCountryCodeFromRegion(region) {
  const regionToCountryCode = {
    'US': '+1',      // United States
    'CA': '+1',      // Canada
    'EU': '+44',     // Europe (default to UK)
    'IN': '+91',     // India
    'ME': '+971',    // Middle East (default to UAE)
    'APAC': '+61',   // Asia Pacific (default to Australia)
    'AU': '+61',     // Australia
  };

  return regionToCountryCode[region] || '+1'; // Default to US
}

export function getCountryCodeFromLocale(locale) {
  // Extract country code from locale (e.g., 'en-US' -> 'US')
  const parts = locale.split('-');
  if (parts.length === 2) {
    return getCountryCodeFromRegion(parts[1]);
  }
  
  // Try to match first part to common patterns
  const localeToCountryCode = {
    'en': '+1',   // English - default US
    'hi': '+91',  // Hindi - India
    'ar': '+971', // Arabic - UAE
    'zh': '+86',  // Chinese - China
    'ja': '+81',  // Japanese - Japan
    'ko': '+82',  // Korean - Korea
    'fr': '+33',  // French - France
    'de': '+49',  // German - Germany
    'es': '+34',  // Spanish - Spain
  };
  
  return localeToCountryCode[parts[0]] || '+1';
}

