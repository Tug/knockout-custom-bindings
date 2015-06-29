
define(['jquery', 'knockout'], function($, ko) {

    var inject_binding = function (allBindings, key, value) {
        //https://github.com/knockout/knockout/pull/932#issuecomment-26547528
        var has = allBindings.has;
        var get = allBindings.get;
        return {
            has: function (bindingKey) {
                return (bindingKey == key) || has.call(allBindings,bindingKey);
            },
            get: function (bindingKey) {
                var binding = get.call(allBindings,bindingKey);
                if (bindingKey == key) {
                    binding = binding ? [].concat(binding, value) : value;
                }
                return binding;
            }
        };
    };

    ko.bindingHandlers.selectize = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var items = valueAccessor();
            var allBindings = allBindingsAccessor();

            // TODO: allow functions for optionsText, optionsValue, optionsCaption...
            allBindings.optionsText = ko.utils.unwrapObservable(allBindings.optionsText) || 'name';
            allBindings.optionsValue = ko.utils.unwrapObservable(allBindings.optionsValue) || 'id';
            allBindings.optionsCaption = ko.utils.unwrapObservable(allBindings.optionsCaption) || 'Choose...';
            allBindings.options = ko.utils.unwrapObservable(allBindings.options) || {};

            // call the options bindingHandlers as if "selectize: items" was "options: items"
            // no worry, allBindings.options won't be read by ko.bindingHandlers.options
            // options.init does nothing beside emptying the options in the select
            ko.bindingHandlers.options.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);

            var options = {
                valueField: allBindings.optionsValue,
                labelField: allBindings.optionsText,
                searchField: allBindings.optionsText
            };

            for(var optName in allBindings.options) {
                options[optName] = allBindings.options[optName];
            }

            var $select = $(element).selectize(options)[0].selectize;

            if (ko.isObservable(allBindings.value)) {
                $select.addItem(allBindings.value());
                allBindings.value.subscribe(function(newVal) {
                    $select.addItem(newVal);
                });
            }

            if (ko.isObservable(allBindings.selectedOptions)) {
                allBindings.selectedOptions.subscribe(function(newSelectedOptions) {
                    var currentSelection = $select.getValue();
                    if($.isArray(currentSelection)) {
                        for (var i = 0; i < currentSelection.length; i++) {
                            var valueSelected = currentSelection[i];
                            if (newSelectedOptions.indexOf(valueSelected) === -1) {
                                $select.removeItem(valueSelected);
                            }
                        }
                        for (var i = 0; i < newSelectedOptions.length; i++) {
                            $select.addItem(newSelectedOptions[i]);
                        }
                        // Do not use selectedItems for large array of items or maintain a map of { id: item } here
                        if (allBindings.selectedItems !== undefined) {
                            var selectedItems = $.grep(items(), function (item) {
                                return currentSelection.indexOf(ko.utils.unwrapObservable(item[allBindings.optionsValue])) >= 0;
                            });
                            allBindings.selectedItems(selectedItems || []);
                        }
                    }
                });
                var selectedOptions = allBindings.selectedOptions();
                for (var i = 0; i < selectedOptions.length; i++) {
                    $select.addItem(selectedOptions[i]);
                }
                if (ko.isObservable(allBindings.selectedItems) && allBindings.selectedItems().length > 0) {
                    allBindings.selectedOptions(allBindings.selectedItems().map(function(item) {
                        return item[allBindings.optionsValue];
                    }));
                }
            }

            if (ko.isObservable(items)) {
                items.subscribe(function (changes) {
                    var addedItems = [];
                    changes.forEach(function (change) {
                        switch (change.status) {
                            case 'added':
                                addedItems.push(change.value);
                                break;
                            case 'deleted':
                                var itemId = change.value[options.valueField];
                                if (itemId != null) $select.removeOption(itemId);
                        }
                    });
                    addedItems.forEach(function (item) {
                        $select.addOption(item);
                    });

                }, null, "arrayChange");
            }

            /* // if we need to auto create (won't work for objects)
            $select.on('option_add', function(value, data) { items.push(value); } );
            $select.on('option_remove', function(value) { items.remove(value); } );
            */

        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var allBindings = allBindingsAccessor();
            var items = valueAccessor();
            var optionsValue = ko.utils.unwrapObservable(allBindings.optionsValue) || 'id';
            if (allBindings.selectedItem !== undefined) {
                var selectedItem = $.grep(items(), function (item) {
                    return ko.utils.unwrapObservable(item[optionsValue]) === allBindings.value();
                })[0];
                allBindings.selectedItem(selectedItem || undefined);
            }
        }
    };

});