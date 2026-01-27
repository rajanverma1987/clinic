/**
 * Next.js instrumentation – runs when the Node process starts (build + runtime).
 * Polyfills browser globals used by dependencies (e.g. "self") so server/build don't throw.
 */
export async function register() {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
}
