
/*
 * State Manager
 *
 * Usage: spaState.getData('key')
 *        spaState.setData('key', value)
 */

SPAStateManager = function() {

    var o = {
        data: {},

        getData: function (key) {
            return o.data[key]
        },

        setData: function (key, value) {
            return o.data[key] = value
        }
    };

    return o;
};

window.spaState = new SPAStateManager();
