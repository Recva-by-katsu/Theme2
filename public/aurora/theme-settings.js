/**
 * Aurora Theme — Theme Settings page behavior:
 *  - tab persistence, color/range input syncing
 *  - brand asset uploads (fetch + CSRF)
 *  - LIVE PREVIEW: form values → preview tokens without reload
 */
(function ($) {
    'use strict';

    function hexToRgba(hex, alpha) {
        var h = String(hex || '').replace('#', '');
        if (h.length === 3) {
            h = h.split('').map(function (c) { return c + c; }).join('');
        }
        var n = parseInt(h.slice(0, 6), 16);
        if (isNaN(n)) return 'rgba(79,124,255,' + alpha + ')';
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
    }

    var SHADOWS = {
        none: 'none',
        soft: '0 1px 2px rgba(2,6,23,.28), 0 4px 16px -4px rgba(2,6,23,.3)',
        medium: '0 2px 6px rgba(2,6,23,.32), 0 12px 32px -8px rgba(2,6,23,.45)',
        strong: '0 4px 12px rgba(2,6,23,.4), 0 24px 48px -12px rgba(2,6,23,.55)'
    };

    function field(name) {
        return $('[name="' + name + '"]');
    }

    function val(name) {
        var $el = field(name);
        if (!$el.length) return '';
        if ($el.attr('type') === 'checkbox') {
            return $el.is(':checked') ? '1' : '0';
        }
        return $el.val();
    }

    function applyPreview() {
        var $p = $('#auroraPreview');
        if (!$p.length) return;

        var mode = val('appearance[mode]');
        var light = mode === 'light';
        var colors = {};
        ['primary', 'secondary', 'accent', 'background', 'surface', 'card', 'text',
            'muted', 'border', 'success', 'warning', 'danger', 'info'].forEach(function (k) {
            colors[k] = val('colors[' + k + ']') || '#888888';
        });

        if (light) {
            colors.background = '#eef1f8';
            colors.surface = '#ffffff';
            colors.card = '#ffffff';
            colors.text = '#0e1526';
            colors.muted = '#5b6478';
            colors.border = '#dde3f0';
        }

        var radius = parseInt(val('appearance[radius]') || '14', 10);
        var radiusSm = Math.max(4, Math.round(radius * 0.55));

        $p.get(0).style.setProperty('--ap-primary', colors.primary);
        $p.get(0).style.setProperty('--ap-surface', colors.surface);
        $p.get(0).style.setProperty('--ap-card', colors.card);
        $p.get(0).style.setProperty('--ap-bg', colors.background);
        $p.get(0).style.setProperty('--ap-text', colors.text);
        $p.get(0).style.setProperty('--ap-muted', colors.muted);
        $p.get(0).style.setProperty('--ap-border', colors.border);
        $p.get(0).style.setProperty('--ap-success', colors.success);
        $p.get(0).style.setProperty('--ap-success-soft', hexToRgba(colors.success, 0.14));
        $p.get(0).style.setProperty('--ap-radius', radius + 'px');
        $p.get(0).style.setProperty('--ap-radius-sm', radiusSm + 'px');
        $p.get(0).style.setProperty('--ap-shadow', SHADOWS[val('appearance[shadow]')] || SHADOWS.soft);

        var baseSize = parseInt(val('typography[baseSize]') || '15', 10);
        $p.css('font-size', Math.max(11, baseSize - 2) + 'px');

        var pixel = val('pixel[enabled]') === '1';
        $p.attr('data-pixel', pixel ? '1' : '0');

        var cardStyle = val('login[cardStyle]') || 'glass';
        $('#auroraPreviewLogin').removeClass('glass solid outline').addClass(cardStyle);

        var brandName = val('brand[name]') || 'Your Panel';
        $('#auroraPreviewBrand').text(brandName);
        var logoUrl = val('brand[logoUrl]');
        var $logo = $('#auroraPreviewLogo');
        if (logoUrl) {
            $logo.attr('src', logoUrl).show();
            $('#auroraPreviewMark').hide();
        } else {
            $logo.hide();
            $('#auroraPreviewMark').show();
        }
    }

    $(function () {
        // Remember the active tab across saves.
        try {
            var lastTab = window.localStorage.getItem('aurora:settings-tab');
            if (lastTab && $('a[href="' + lastTab + '"][data-toggle="tab"]').length) {
                $('a[href="' + lastTab + '"][data-toggle="tab"]').tab('show');
            }
            $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                try { window.localStorage.setItem('aurora:settings-tab', $(e.target).attr('href')); } catch (err) {}
            });
        } catch (e) { /* ignore */ }

        // Color picker <-> hex text sync.
        $('.aurora-color-field').each(function () {
            var $wrap = $(this);
            var $picker = $wrap.find('input[type="color"]');
            var $text = $wrap.find('input[type="text"]');
            $picker.on('input', function () { $text.val($picker.val()); });
            $text.on('input', function () {
                if (/^#[0-9a-fA-F]{6}$/.test($text.val())) $picker.val($text.val());
            });
        });

        // Range outputs.
        $('input[type="range"][data-output]').each(function () {
            var $range = $(this);
            var $out = $($range.attr('data-output'));
            var render = function () { $out.text($range.val() + ($range.attr('data-suffix') || '')); };
            $range.on('input', render);
            render();
        });

        // Live preview binding (delegated: survives tab switches).
        $('#auroraThemeForm').on('input change', 'input, select', function () {
            applyPreview();
        });
        applyPreview();

        // Brand asset uploads.
        $('.aurora-upload-btn').on('click', function () {
            var slot = $(this).data('slot');
            var $input = $('#upload-' + slot);
            var file = $input.get(0).files[0];
            if (!file) {
                alert('Choose a file first.');
                return;
            }
            var data = new FormData();
            data.append('slot', slot);
            data.append('file', file);
            var $btn = $(this);
            $btn.prop('disabled', true).text('Uploading…');
            fetch($btn.data('url'), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content'), 'Accept': 'application/json' },
                body: data,
                credentials: 'same-origin'
            })
                .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, json: j }; }); })
                .then(function (r) {
                    $btn.prop('disabled', false).text('Upload');
                    if (!r.ok) {
                        alert(r.json.message || 'Upload failed.');
                        return;
                    }
                    field('brand[' + (slot === 'logo' ? 'logoUrl' : 'faviconUrl') + ']').val(r.json.url);
                    $('#preview-' + slot).attr('src', r.json.url);
                    applyPreview();
                })
                .catch(function () {
                    $btn.prop('disabled', false).text('Upload');
                    alert('Upload failed (network error).');
                });
        });

        // Import form file-name display.
        $('#import-file').on('change', function () {
            var name = this.files && this.files[0] ? this.files[0].name : 'Choose file…';
            $('#import-file-label').text(name);
        });

        // Alternate submit targets (preset apply / import / reset) share the
        // main form: temporarily drop the PATCH spoof and post elsewhere.
        $('.aurora-alt-submit').on('click', function () {
            var $btn = $(this);
            var confirmMsg = $btn.data('confirm');
            if (confirmMsg && !window.confirm(confirmMsg)) return;
            var $form = $('#auroraThemeForm');
            $form.find('input[name="_method"]').prop('disabled', true);
            $form.attr('action', $btn.data('action'));
            $form.attr('method', 'POST');
            $form.submit();
        });
    });
})(window.jQuery);
