/**
 * Theme init – runs before paint to avoid flash. Same-origin script so CSP script-src 'self' allows it.
 */
(function () {
  var k = 'clinic-dashboard-theme';
  var t = typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
  var dark =
    t === 'dark' ||
    (t !== 'light' &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  var r = document.documentElement;
  if (dark) {
    r.classList.add('dark');
    r.style.colorScheme = 'dark';
  } else {
    r.classList.remove('dark');
    r.style.colorScheme = 'light';
  }
})();
