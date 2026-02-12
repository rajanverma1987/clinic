/**
 * Chunk recovery script – auto hard-refresh when stale chunks cause module load failures.
 * Loaded early in <head> to catch errors before React/error boundaries run.
 * Prevents infinite reload loops via sessionStorage.
 */
(function () {
  var KEY = 'chunkReloadAttempted';
  var COOLDOWN_MS = 10000; // Don't re-reload within 10s if error recurs

  function isChunkOrStaleError(msg) {
    if (!msg || typeof msg !== 'string') return false;
    var s = msg.toLowerCase();
    return (
      s.indexOf("reading 'call'") !== -1 ||
      s.indexOf('chunkloaderror') !== -1 ||
      (s.indexOf('loading chunk') !== -1 && s.indexOf('failed') !== -1) ||
      s.indexOf('loading css chunk') !== -1 ||
      s.indexOf('failed to fetch dynamically imported module') !== -1 ||
      s.indexOf('import promise') !== -1
    );
  }

  function doReload() {
    window.location.reload();
  }

  function tryRecover() {
    try {
      var raw = sessionStorage.getItem(KEY);
      var last = raw ? parseInt(raw, 10) : 0;
      if (Date.now() - last < COOLDOWN_MS) return;
      sessionStorage.setItem(KEY, String(Date.now()));

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then(function (regs) {
            return Promise.all(
              regs.map(function (r) {
                return r.unregister();
              }),
            );
          })
          .then(doReload)
          .catch(doReload);
      } else {
        doReload();
      }
    } catch (e) {
      /* no-op */
    }
  }

  window.addEventListener(
    'error',
    function (ev) {
      if (ev.message && isChunkOrStaleError(ev.message)) {
        ev.preventDefault();
        tryRecover();
      }
    },
    true,
  );

  window.addEventListener('unhandledrejection', function (ev) {
    var msg = (ev.reason && ev.reason.message) || (ev.reason && String(ev.reason)) || '';
    if (isChunkOrStaleError(msg)) {
      ev.preventDefault();
      tryRecover();
    }
  });
})();
