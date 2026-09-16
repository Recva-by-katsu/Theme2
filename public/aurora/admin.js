/**
 * Aurora Theme — admin enhancements (progressive, jQuery-based to match the
 * stock admin stack). All behaviors degrade gracefully if elements are absent.
 */
(function ($) {
    'use strict';

    $(function () {
        // Persist the AdminLTE sidebar collapse state across page loads.
        try {
            var KEY = 'aurora:admin-sidebar';
            if (window.localStorage.getItem(KEY) === 'collapsed') {
                $('body').addClass('sidebar-collapse');
            }
            $('.sidebar-toggle[data-toggle="push-menu"]').on('click', function () {
                window.setTimeout(function () {
                    try {
                        window.localStorage.setItem(
                            KEY,
                            $('body').hasClass('sidebar-collapse') ? 'collapsed' : 'open'
                        );
                    } catch (e) { /* ignore */ }
                }, 350);
            });
        } catch (e) { /* storage unavailable */ }

        // Auto-dismiss success alerts after a while (errors stay until closed).
        window.setTimeout(function () {
            $('.aurora-alert.alert-success').fadeOut(400, function () {
                $(this).remove();
            });
        }, 8000);

        // Generic confirmations for elements carrying data-confirm.
        $(document).on('click', '[data-confirm]', function (event) {
            var message = $(this).attr('data-confirm') || 'Are you sure?';
            if (!window.confirm(message)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        // Add a "back to top" affordance on long admin pages.
        var $toTop = $('<button type="button" class="aurora-to-top" aria-label="Back to top"><i class="fa fa-chevron-up"></i></button>');
        $('body').append($toTop);
        $(window).on('scroll', function () {
            $toTop.toggleClass('visible', $(window).scrollTop() > 600);
        });
        $toTop.on('click', function () {
            $('html, body').animate({ scrollTop: 0 }, 300);
        });
    });
})(window.jQuery);
