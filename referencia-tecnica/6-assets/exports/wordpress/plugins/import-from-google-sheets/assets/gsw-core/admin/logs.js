/* global ajaxurl, jQuery */
(function ($) {
  'use strict';

  $(function () {
    var $app = $('#gsw-log-app');
    if (!$app.length) return;

    var nonce = $app.data('nonce');
    var $limit = $('#gsw-limit');
    var $log = $('#gsw-log');
    var timer = null;

    function fetchLog() {
      $.post(ajaxurl, {
        action: 'gsw_fetch_log',
        _ajax_nonce: nonce,
        row_id: $('#gsw-row-filter').val(),
        limit: $limit.val()
      }).done(function (res) {
        if (res && res.success && res.data && typeof res.data.text === 'string') {
          $log.text(res.data.text);
          $log.scrollTop($log[0].scrollHeight);
        }
      });
    }

    $('#gsw-refresh').on('click', fetchLog);

    $('#gsw-autoref').on('change', function () {
      if ($(this).is(':checked')) {
        if (timer) clearInterval(timer);
        timer = setInterval(fetchLog, 3000);
      } else {
        if (timer) clearInterval(timer);
        timer = null;
      }
    });

    $(document).on('click', '.js-gsw-clear-log', function (e) {
      var msg = $(this).data('confirm');
      if (msg && !window.confirm(msg)) {
        e.preventDefault();
      }
    });

    // Load once
    fetchLog();
  });

})(jQuery);
