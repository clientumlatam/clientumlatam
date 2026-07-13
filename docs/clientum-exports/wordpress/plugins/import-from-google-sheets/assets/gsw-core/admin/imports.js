(function () {
  var cb = document.getElementById('gsw-autoimp');
  if (!cb) return;

  var anyRunning = document.querySelector('.gsw-badge.running') !== null;
  var saved = sessionStorage.getItem('gsw_autoimp') === '1';

  cb.checked = saved;

  cb.addEventListener('change', function () {
    sessionStorage.setItem('gsw_autoimp', cb.checked ? '1' : '0');
  });

  if (saved && anyRunning) {
    var ms = 5000;
    if (window.gswImports && window.gswImports.autoReloadMs) {
      var parsed = parseInt(window.gswImports.autoReloadMs, 10);
      if (!isNaN(parsed) && parsed > 0) ms = parsed;
    }
    window.setTimeout(function () {
      window.location.reload();
    }, ms);
  }
})();
