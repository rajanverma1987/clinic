/**
 * Server-only polyfill for 'self' (browser global). Used by webpack ProvidePlugin
 * so dependencies that reference 'self' work during Next.js server/build.
 */
module.exports = typeof global !== 'undefined' ? global : {};
