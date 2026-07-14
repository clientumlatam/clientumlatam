/* global ajaxurl, jQuery */
(function ($) {
  'use strict';

  function setResult($el, text, type) {
    $el.removeClass('is-ok is-error is-loading');
    if (type) $el.addClass(type);
    $el.text(text || '');
  }

  async function postAjax(params) {
    const res = await fetch(ajaxurl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams(params),
      credentials: 'same-origin'
    });
    return res.json();
  }

  function applyTextareasPlaceholders() {
    document.querySelectorAll('textarea[data-gsw-placeholder]').forEach((el) => {
      if (el.getAttribute('placeholder')) return;
      try {
        const txt = JSON.parse(el.dataset.gswPlaceholder || '""');
        el.setAttribute('placeholder', txt);
      } catch (e) {}
    });
  }

  $(function () {
    applyTextareasPlaceholders();

    $(document).on('click', '.js-gsw-test-api', async function (e) {
      e.preventDefault();

      const $btn = $(this);
      const action = $btn.data('action');
      const nonce = $btn.data('nonce');
      const resultSel = $btn.data('result');
      const $out = resultSel ? $(resultSel) : $btn.closest('p').find('.gsw-ajax-result');

      if (!action || !nonce || !$out.length) return;

      setResult($out, $out.data('testing') || 'Testing...', 'is-loading');

      const payload = { action: action, nonce: nonce };

      const modelSelector = $btn.data('modelSelector');
      if (modelSelector) {
        const el = document.querySelector(modelSelector);
        payload.model = el ? (el.value || '').trim() : '';
      }

      try {
        const data = await postAjax(payload);

        if (data && data.success) {
          const msg = (data.data && data.data.message) ? data.data.message : 'OK';
          setResult($out, msg, 'is-ok');
        } else {
          const msg = (data && data.data && data.data.message) ? data.data.message : 'Error';
          setResult($out, msg, 'is-error');
        }
      } catch (err) {
        setResult($out, 'Request failed', 'is-error');
      }
    });
  });
})(jQuery);
