define(['jquery', 'knockout'], function($, ko) {

    var kgGridEvents = function (options) {

        var self = this;
        self.grid = null;

        // The init method gets called during the koGrid binding handler execution.
        self.onGridInit = function (grid) {
            self.grid = grid;
            self.assignEvents();
            if(options.onGridInit) {
                options.onGridInit(grid);
            }
        };

        //internal funcs
        self.assignEvents = function () {
            if(options.onScroll) {
                self.grid.$viewport.on('scroll', options.onScroll);
            }
            if(options.onBeforeResize) {
                self.grid.$viewport.on('grid:resize:before', options.onBeforeResize);
            }
        };

    };

    return kgGridEvents;

});
