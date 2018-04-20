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
            beforeUpdate: this.beforeUpdate //$.proxy(this.beforeUpdate)
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


/*
 * Asset Manager
 *
 * Usage: spaAssetManager.load({ css:[], js:[], img:[] }, onLoadedCallback)
 *        spaAssetManager.unload({ css:[], js:[] }, onLoadedCallback)
 */

SPAAssetManager = function() {

    var o = {
        remove: function(collection, callback) {
            var jsList = (collection.js) ? collection.js : [],
                cssList = (collection.css) ? collection.css : []

            jsList = $.grep(jsList, function(item){
                return $('script[src="'+item+'"]').length > 0
            })

            cssList = $.grep(cssList, function(item){
                return $('link[href="'+item+'"]').length > 0
            })

            if (jsList.length === 0 && cssList.length === 0) {
                callback && callback()
                return
            }

            $.each(jsList, function (index, source) {
                $('script[src="'+source+'"]').remove()
            });
            $.each(cssList, function (index, source) {
                $('link[href="'+source+'"]').remove()
            })

            callback && callback()
        },
        add: function(collection, callback) {
            var jsList = (collection.js) ? collection.js : [],
                cssList = (collection.css) ? collection.css : [],
                imgList = (collection.img) ? collection.img : []

            jsList = $.grep(jsList, function(item){
                return $('script[src="'+item+'"]').length == 0
            })

            cssList = $.grep(cssList, function(item){
                return $('link[href="'+item+'"]').length == 0
            })

            var cssCounter = 0,
                jsLoaded = false,
                imgLoaded = false

            if (jsList.length === 0 && cssList.length === 0 && imgList.length === 0) {
                callback && callback()
                return
            }

            o.loadJavaScript(jsList, function(){
                jsLoaded = true
                checkLoaded()
            })

            $.each(cssList, function(index, source){
                o.loadStyleSheet(source, function(){
                    cssCounter++
                    checkLoaded()
                })
            })

            o.loadImage(imgList, function(){
                imgLoaded = true
                checkLoaded()
            })

            function checkLoaded() {
                if (!imgLoaded)
                    return false

                if (!jsLoaded)
                    return false

                if (cssCounter < cssList.length)
                    return false

                callback && callback()
            }
        },

        /*
         * Loads StyleSheet files
         */
        loadStyleSheet: function(source, callback) {
            var cssElement = document.createElement('link')

            cssElement.setAttribute('rel', 'stylesheet')
            cssElement.setAttribute('type', 'text/css')
            cssElement.setAttribute('href', source)
            cssElement.addEventListener('load', callback, false)

            if (typeof cssElement != 'undefined') {
                document.getElementsByTagName('head')[0].appendChild(cssElement)
            }

            return cssElement
        },

        /*
         * Loads JavaScript files in sequence
         */
        loadJavaScript: function(sources, callback) {
            if (sources.length <= 0)
                return callback()

            var source = sources.shift(),
                jsElement = document.createElement('script');

            jsElement.setAttribute('type', 'text/javascript')
            jsElement.setAttribute('src', source)
            jsElement.addEventListener('load', function() {
                o.loadJavaScript(sources, callback)
            }, false)

            if (typeof jsElement != 'undefined') {
                document.getElementsByTagName('head')[0].appendChild(jsElement)
            }
        },

        /*
         * Loads Image files
         */
        loadImage: function(sources, callback) {
            if (sources.length <= 0)
                return callback()

            var loaded = 0
            $.each(sources, function(index, source){
                var img = new Image()
                img.onload = function() {
                    if (++loaded == sources.length && callback)
                        callback()
                }
                img.src = source
            })
        }

    };

    return o;
};

spaAssetManager = new SPAAssetManager();
