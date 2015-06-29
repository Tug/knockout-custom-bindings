define(['jquery', 'knockout'], function($, ko) {

    ko.subscribable.fn.subscribeChanged = function (callback) {
        var savedValue = this.peek();
        return this.subscribe(function (latestValue) {
            var oldValue = savedValue;
            savedValue = latestValue;
            callback(latestValue, oldValue);
        });
    };

    ko.subscribable.fn.watch = function(callback) {
        var subscription = this.subscribeChanged(callback);
        var value = this();
        if(value) setTimeout(function() { callback(value); }, 0);
        return subscription;
    };

});