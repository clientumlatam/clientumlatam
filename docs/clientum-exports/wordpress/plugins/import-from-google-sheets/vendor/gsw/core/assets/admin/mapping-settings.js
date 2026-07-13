/* global jQuery */
(function ($) {
  'use strict';

  function toggleMarkup($row) {
    var on = $row.find('.js-use-markup').is(':checked');
    $row.find('.js-markup-wrap').toggle(on);
  }

  function toggleImages($row) {
    var on = $row.find('.js-use-images').is(':checked');
    $row.find('.js-images-wrap').toggle(on);
  }

  function rebuildSizeCols($row) {
    var on = $row.find('.js-use-sizes').is(':checked');
    var $wrap = $row.find('.js-sizes-wrap');
    $wrap.toggle(on);

    var idx = parseInt($row.attr('data-index') || '0', 10);

    var saved = [];
    var savedRaw = $row.find('.js-size-cols-saved').val();
    if (savedRaw) {
      try { saved = JSON.parse(savedRaw); } catch (e) { saved = []; }
    }
    if (!Array.isArray(saved)) saved = [];

    var count = parseInt($row.find('.js-sizes-count').val() || '0', 10);
    count = Math.max(0, Math.min(20, count));

    var $container = $row.find('.js-size-cols');

    var current = [];
    $container.find('input').each(function (i) { current[i] = $(this).val(); });

    $container.empty();

    for (var i = 0; i < count; i++) {
      var name = 'gsw_import_configs[' + idx + '][size_cols][' + i + ']';
      var val = current[i] ? current[i] : (saved[i] ? saved[i] : '');

      var $inp = $('<input>', {
        type: 'number',
        min: 1,
        class: 'col-small js-size-col',
        name: name,
        value: val
      });

      var $lbl = $('<label>').append($('<span>').text('#' + (i + 1) + ' ')).append($inp);
      $container.append($lbl);
    }

    $row.find('.js-size-col, .js-sizes-count').prop('disabled', !on);
  }

  function renumberIndexes() {
    $('#gsw-rows tbody tr').each(function (i) {
      var $row = $(this);
      $row.attr('data-index', i);

      $row.find('[name]').each(function () {
        var name = $(this).attr('name');
        name = name.replace(/gsw_import_configs\[[^\]]+\]/g, 'gsw_import_configs[' + i + ']');
        $(this).attr('name', name);
      });
    });
  }

  function addRow() {
    var idx = $('#gsw-rows tbody tr').length;
    var tpl = document.getElementById('gsw-row-template');
    if (!tpl) return;

    var html = (tpl.innerHTML || '').replace(/__i__/g, idx);
    var $row = $(html.trim());

    $('#gsw-rows tbody').append($row);

    toggleMarkup($row);
    rebuildSizeCols($row);
    toggleImages($row);
  }

  $(document)
    .on('click', '.js-add-row', function (e) {
      e.preventDefault();
      addRow();
    })
    .on('click', '.js-remove-row', function (e) {
      e.preventDefault();
      $(this).closest('tr').remove();
      renumberIndexes();
    })
    .on('change', '.js-use-markup', function () {
      toggleMarkup($(this).closest('tr'));
    })
    .on('change', '.js-use-sizes, .js-sizes-count', function () {
      rebuildSizeCols($(this).closest('tr'));
    })
    .on('change', '.js-use-images', function () {
      toggleImages($(this).closest('tr'));
    });

  $(function () {
    $('#gsw-rows tbody tr').each(function () {
      var $row = $(this);
      toggleMarkup($row);
      rebuildSizeCols($row);
      toggleImages($row);
    });
  });

})(jQuery);
