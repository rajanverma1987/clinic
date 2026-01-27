/**
 * Service Worker Registration
 * Registers service worker for offline support.
 * Skipped on localhost so dev gets fresh CSS without double-refresh.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
  if (isLocal) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('/sw.js')
      .then(function (registration) {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch(function (error) {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
})();
