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

        // TODO: Get the assets from the current page and the assets from the new page,
        // remove any changed old ones and add any changed new ones

        $.request('onGetPage', {
            data: {
                url: requestedUrl,
                refreshPartials: this.options.refreshPartials
            },
            beforeUpdate: function (data, status, jqXHR) {
                window.history.pushState({}, '', this.options.data.url)
            }
        })
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
