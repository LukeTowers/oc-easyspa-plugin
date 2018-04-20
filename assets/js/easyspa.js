/*
 * Easy SPA Loader plugin
 *
 * Data attributes:
 * - data-control="easy-spa-loader" - enables the plugin on an element
 * - data-refresh-partials="partial-path:#partial-selector&other-partial-path:#other-partial-selector" - ampersand separated list of partials to update
 *
 * JavaScript API:
 * $('div').easySPALoader()
 */

+function ($) { "use strict";

    // EASY SPA LOADER CLASS DEFINITION
    // ============================

    var EasySPALoader = function(element, options) {
        this.options   = options
        this.$el       = $(element)

        // Init
        this.init()
    }

    EasySPALoader.DEFAULTS = {}

    EasySPALoader.prototype.init = function() {
        this.$el.on('click', 'a', $.proxy(this.onClick, this))
    }

    EasySPALoader.prototype.onClick = function(ev) {
        ev.preventDefault()
        var requestedUrl = $(ev.currentTarget).attr('href')

        $.request('onGetPage', {
            data: {
                url: requestedUrl,
                refreshPartials: this.options.refreshPartials
            },
            loading: $.oc.stripeLoadIndicator,
            beforeUpdate: this.beforeUpdate,
            handleErrorMessage: this.handleErrorMessage
        })
    }

    EasySPALoader.prototype.beforeUpdate = function (data, status, jqXHR) {
        var assets = JSON.parse(data.X_EASYSPA_CHANGED_ASSETS)
        window.spaAssetManager.add(assets.add, $.proxy(function (assetsToRemove, newUrl) {
            window.spaAssetManager.remove(assetsToRemove, $.proxy(function () {
                window.history.pushState({}, '', newUrl)
            }), null)
        }, this, assets.remove, this.options.data.url))
    }

    EasySPALoader.prototype.handleErrorMessage = function (message) {
        var _event = jQuery.Event('ajaxErrorMessage')
        $(window).trigger(_event, [message])
        if (_event.isDefaultPrevented()) return
        if (message) {
            // Handle returned error page
            if (message.includes('<html')) {
                window.history.pushState({}, '', this.context.options.data.url)
                if (message.includes('easyspa-container')) {
                    $('#easyspa-container').html($('#easyspa-container', message).html())
                } else {
                    document.write(message)
                }
            }
        } else {
            alert(message)
        }
    }

    // EASY SPA LOADER PLUGIN DEFINITION
    // ============================

    var old = $.fn.easySPALoader

    $.fn.easySPALoader = function (option) {
        var args = Array.prototype.slice.call(arguments, 1), result
        this.each(function () {
            var $this   = $(this)
            var data    = $this.data('oc.easySPALoader')
            var options = $.extend({}, EasySPALoader.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data) $this.data('oc.easySPALoader', (data = new EasySPALoader(this, options)))
            if (typeof option == 'string') result = data[option].apply(data, args)
            if (typeof result != 'undefined') return false
        })

        return result ? result : this
    }

    $.fn.easySPALoader.Constructor = EasySPALoader

    // EASY SPA LOADER NO CONFLICT
    // =================

    $.fn.easySPALoader.noConflict = function () {
        $.fn.easySPALoader = old
        return this
    }

    // EASY SPA LOADER DATA-API
    // ===============

    $(document).render(function() {
        $('[data-control="easy-spa-loader"]').easySPALoader()
    });

}(window.jQuery);
