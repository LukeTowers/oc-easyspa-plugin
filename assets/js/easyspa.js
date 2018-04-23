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
        if (!this.getData('currentUrl')) {
            this.setData('currentUrl', window.location.href)
        }

        // Attach the click handler to links in the specified container
        this.$el.on('click', 'a', $.proxy(this.onClick, this))

        // Only attach one popstate handler
        var popstateHandler = $.proxy(this.onStateChange, this)
        if (!this.getData('popstateBound')) {
            this.setData('popstateBound', true)
            $(window).bind('popstate', popstateHandler)
        }
    }

    EasySPALoader.prototype.getData = function (key) {
        return window.spaState.getData(key)
    }

    EasySPALoader.prototype.setData = function (key, value) {
        return window.spaState.setData(key, value)
    }

    EasySPALoader.prototype.onStateChange = function (ev) {
        this.loadUrl(window.location.href, true)
    }

    EasySPALoader.prototype.onClick = function(ev) {
        // Check to see if this is a link to the same
        // website before proceeding
        if (ev.currentTarget.host !== window.location.host || ev.currentTarget.href.indexOf("#") != -1) {
            return;
        }
        ev.preventDefault()

        this.loadUrl($(ev.currentTarget).attr('href'))
    }

    EasySPALoader.prototype.loadUrl = function (url, skipStateChange) {
        // Prevent the history state from being changed on this request
        skipStateChange = (typeof skipStateChange !== 'undefined') ?  skipStateChange : false;
        if (skipStateChange) {
            this.setData(url + '-skipStateChange', true)
        }

        // Don't do anything if the requested URL is the same as the current URL
        if (url === this.getData('currentUrl')) {
            return;
        }

        // Make the request for the page content
        $.request('onGetPage', {
            data: {
                url: url,
                refreshPartials: this.options.refreshPartials
            },
            loading: $.oc.stripeLoadIndicator,
            beforeUpdate: this.beforeUpdate,
            handleErrorMessage: this.handleErrorMessage
        })
    }

    // Handle updating the history as required
    EasySPALoader.prototype.beforeUpdate = function (data, status, jqXHR) {
        var assets = JSON.parse(data.X_EASYSPA_CHANGED_ASSETS)

        // Add any assets as required
        window.spaAssetManager.add(assets.add, $.proxy(function (assetsToRemove, newUrl, newTitle) {

            // Remove any assets as required
            window.spaAssetManager.remove(assetsToRemove, $.proxy(function () {

                // Check to see if we should update the state or not
                var skipStateChangeKey = newUrl + '-skipStateChange'
                if (window.spaState.getData(skipStateChangeKey)) {
                    window.spaState.setData(skipStateChangeKey, false)
                } else {
                    window.history.pushState({}, newTitle, newUrl)
                }

                // Update the document title if required
                if (newTitle) {
                    document.title = newTitle
                }

                // Update the current url
                window.spaState.setData('currentUrl', newUrl)
                window.scrollTo(0, 0)
            }), null)
        }, this, assets.remove, this.options.data.url, data.X_EASYSPA_RENDERED_TITLE))
    }

    // Handle any error messages that are returned
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
