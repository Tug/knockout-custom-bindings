define([
    'jquery',
    'knockout',
    'phpjs',
    'relative-date',
    'libs/JsonTree'
], function($, ko, phpjs, relativeDate, JsonTree) {

    ko.bindingHandlers.dateString = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            var pattern = allBindings.datePattern || 'Y-m-d - h:i A';
            $(element).text(phpjs.date(pattern, valueUnwrapped));
        }
    };

    ko.bindingHandlers.relativeDate = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            var referenceUnwrapped = ko.utils.unwrapObservable(allBindings.reference);
            var localeDataUnwrapped = ko.utils.unwrapObservable(allBindings.localeData);
            var pattern = allBindings.datePattern || 'Y-m-d - h:i A';
            var refresh = allBindings.refresh || false;
            function update() {
                $(element).text(relativeDate(valueUnwrapped, referenceUnwrapped, localeDataUnwrapped));
                $(element).attr("title", phpjs.date(pattern, valueUnwrapped));
            }
            update();
            if(refresh) {
                var interval = setInterval(function() {
                    if($(element).length === 0) {
                        clearInterval(interval);
                        return;
                    }
                    update();
                }, 60 * 1000);
            }
        }
    };

    ko.bindingHandlers.animate = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            $(element).animate(valueUnwrapped, 1000);
        }
    };

    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value));
        },
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };

    ko.bindingHandlers.slideVisible = {
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            $(element).slideDown(value);
        }
    };

    ko.bindingHandlers.foreachprop = {
        transformObject: function (obj) {
            var properties = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    properties.push({ key: key, value: obj[key] });
                }
            }
            return properties;
        },
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                properties = ko.bindingHandlers.foreachprop.transformObject(value);
            ko.applyBindingsToNode(element, { foreach: properties }, bindingContext);
            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers.valueKeep = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var initialValue = element.getAttribute('value');
            ko.bindingHandlers.value.init(element, valueAccessor, allBindingsAccessor, viewModel);
            valueAccessor()(initialValue);
        },
        'update': ko.bindingHandlers.value.update
    };

    ko.bindingHandlers.init = {
        'init': function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var initFunction = valueAccessor();
            setTimeout(function(){
                initFunction.call(viewModel, element);
            }, 0);
        }
    };

    ko.bindingHandlers.radio = {
        init: function(element, valueAccessor, allBindings, data, context) {
            var $buttons, $element, observable;
            observable = valueAccessor();
            if (!ko.isWriteableObservable(observable)) {
                throw "You must pass an observable or writeable computed";
            }
            $element = $(element);
            if ($element.hasClass("btn")) {
                $buttons = $element;
            } else {
                $buttons = $(".btn", $element);
            }
            var elementBindings = allBindings();
            $buttons.each(function() {
                var $btn, btn, radioValue;
                btn = this;
                $btn = $(btn);
                radioValue = elementBindings.radioValue || $btn.attr("data-value") || $btn.attr("value") || $btn.text();
                $btn.on("click", function() {
                    observable(ko.utils.unwrapObservable(radioValue));
                });
                return ko.computed({
                    disposeWhenNodeIsRemoved: btn,
                    read: function() {
                        $btn.toggleClass("active", observable() === ko.utils.unwrapObservable(radioValue));
                    }
                });
            });
        }
    };

    ko.bindingHandlers.checkbox = {
        init: function(element, valueAccessor, allBindings, data, context) {
            var $element, observable;
            observable = valueAccessor();
            if (!ko.isWriteableObservable(observable)) {
                throw "You must pass an observable or writeable computed";
            }
            $element = $(element);
            $element.on("click", function() {
                observable(!observable());
            });
            ko.computed({
                disposeWhenNodeIsRemoved: element,
                read: function() {
                    $element.toggleClass("active", observable());
                }
            });
        }
    };

    ko.bindingHandlers.bootstrapSwitchOn = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $elem = $(element);
            $elem.bootstrapSwitch({
                state: ko.utils.unwrapObservable(valueAccessor()),
                onSwitchChange: function(el, state) {
                    valueAccessor()(state);
                }
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $elem = $(element);
            var vStatus = $elem.bootstrapSwitch('state');
            var vmStatus = ko.utils.unwrapObservable(valueAccessor());
            if(vStatus != vmStatus) {
                $elem.bootstrapSwitch('state', vmStatus);
            }
        }
    };

    ko.bindingHandlers.bootstrapSwitchOptions = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var $elem = $(element);
            var options = ko.utils.unwrapObservable(valueAccessor()) || {};
            for(var k in options) {
                if(options.hasOwnProperty(k)) {
                    var value = options[k];
                    if(ko.isObservable(value)) {
                        (function(k) {
                            value.subscribe(function(val) {
                                $elem.bootstrapSwitch(k, val);
                            });
                        })(k);
                    } else {
                        $elem.bootstrapSwitch(k, value);
                    }
                }
            }
        },
        update: function(element, valueAccessor, allBindingAccessor, viewModel) {
            var $elem = $(element);
            var options = ko.utils.unwrapObservable(valueAccessor()) || {};
            for(var k in options) {
                if(options.hasOwnProperty(k)) {
                    var value = options[k];
                    if(!ko.isObservable(value)) {
                        $elem.bootstrapSwitch(k, value);
                    }
                }
            }
        }
    };

    ko.bindingHandlers.scrollFollow = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            var observable = value.observe || value;
            var activate = value.activate || function() { return true; };
            function checkScroll() {
                if(activate()) {
                    // have to push our code outside of the stack since the text hasn't updated yet
                    setTimeout(function () { element.scrollTop = element.scrollHeight - element.clientHeight; }, 0);
                }
            }
            observable.subscribe(checkScroll);
            checkScroll();
        }
    };

    ko.bindingHandlers.enterkey = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();
            $(element).keyup(function (event) {
                var keyCode = (event.which ? event.which : event.keyCode);
                if (keyCode === 13) {
                    event.preventDefault();
                    allBindings.enterkey.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };

    ko.bindingHandlers.slickGrid = {
        init: function(element, valueAccessor) {
            var settings = valueAccessor();
            var data = ko.utils.unwrapObservable(settings.data);
            var columns = ko.utils.unwrapObservable(settings.columns);
            var options = ko.utils.unwrapObservable(settings.options) || {};
            var grid = new Slick.Grid(element, data, columns, options);
            $.data(element, "grid", grid);
        },
        update: function(element, valueAccessor, allBindingAccessor, viewModel) {
            var settings = valueAccessor();
            var data = ko.utils.unwrapObservable(settings.data); //just for subscription
            var grid = $.data(element, "grid");
            grid.resizeCanvas(); // NB Very important for when a scrollbar appears
            grid.setData(data,true); // This is what was missing
            grid.render();
        }
    };

    ko.bindingHandlers.numericText = {
        update: function(element, valueAccessor, allBindingsAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()),
                precision = ko.utils.unwrapObservable(allBindingsAccessor().precision) || ko.bindingHandlers.numericText.defaultPrecision,
                displayZeros = (ko.utils.unwrapObservable(allBindingsAccessor().displayZeros) !== undefined) ? ko.utils.unwrapObservable(allBindingsAccessor().displayZeros) : ko.bindingHandlers.numericText.defaultDisplayZeros,
                formattedValue = value.toFixed(precision);
            if(!displayZeros) formattedValue = formattedValue.replace(/\.?0+$/, '');

            ko.bindingHandlers.text.update(element, function() { return formattedValue; });
        },
        defaultPrecision: 1,
        defaultDisplayZeros: true
    };

    ko.bindingHandlers.jsonSelector = {
        update: function(element, valueAccessor) {
            var settings = valueAccessor();
            var json = ko.utils.unwrapObservable(settings.json);
            var pathCallback = settings.path;
            $(element).empty();
            JsonTree.print($(element), json);
            $(element).click(function(e) {
                var jsonPath = e.target && e.target.getAttribute("data-jsonpath");
                if(jsonPath) pathCallback(decodeURI(jsonPath));
            });
        }
    };

    ko.bindingHandlers.slideIn = {
        init: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).toggle(value);
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            value ? $(element).slideDown() : $(element).slideUp();
        }
    };

    ko.bindingHandlers.cardNumber = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = valueAccessor();
            if(ko.isObservable(settings)) {
                settings = { value: settings };
            }
            settings.value = ko.isObservable(settings.value) ? settings.value : ko.observable();
            settings.card = ko.isObservable(settings.card) ? settings.card : ko.observable();
            var textInputValueAccessor = function() {
                return settings.value;
            };
            ko.bindingHandlers.textInput.init(element, textInputValueAccessor, allBindingsAccessor, viewModel, bindingContext);

            // From: https://github.com/omarshammas/jquery.formance/blob/master/lib/jquery.formance.js
            var defaultFormat = /(\d{1,4})/g;
            var cards = [
                {
                    type: 'maestro',
                    pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
                    format: defaultFormat,
                    length: [12, 13, 14, 15, 16, 17, 18, 19],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'dinersclub',
                    pattern: /^(36|38|30[0-5])/,
                    format: defaultFormat,
                    length: [14],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'laser',
                    pattern: /^(6706|6771|6709)/,
                    format: defaultFormat,
                    length: [16, 17, 18, 19],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'jcb',
                    pattern: /^35/,
                    format: defaultFormat,
                    length: [16],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'unionpay',
                    pattern: /^62/,
                    format: defaultFormat,
                    length: [16, 17, 18, 19],
                    cvcLength: [3],
                    luhn: false
                }, {
                    type: 'discover',
                    pattern: /^(6011|65|64[4-9]|622)/,
                    format: defaultFormat,
                    length: [16],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'mastercard',
                    pattern: /^5[1-5]/,
                    format: defaultFormat,
                    length: [16],
                    cvcLength: [3],
                    luhn: true
                }, {
                    type: 'amex',
                    pattern: /^3[47]/,
                    format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
                    length: [15],
                    cvcLength: [3, 4],
                    luhn: true
                }, {
                    type: 'visa',
                    pattern: /^4/,
                    format: defaultFormat,
                    length: [13, 14, 15, 16],
                    cvcLength: [3],
                    luhn: true
                }
            ];
            function cardFromNumber(num) {
                var card, _i, _len;
                for (_i = 0, _len = cards.length; _i < _len; _i++) {
                    card = cards[_i];
                    if (card.pattern.test(num)) {
                        return card;
                    }
                }
            }
            function groupBy(value, groups, maxLength) {
                var output = '';
                var index = 0;
                var it = 0;
                value = (value + '').replace(/\D/g, '');
                while(index < value.length && index < maxLength) {
                    var groupSize = groups[it] || groups;
                    if(index > 0) output += ' ';
                    output += value.substr(index, groupSize);
                    index += groupSize;
                    it++;
                }
                return output;
            }
            function formatNumber(value, card) {
                var maxLength = card && Math.max.apply(null, card.length) || 19;
                if (card && card.type === 'amex') {
                    return groupBy(value, [4, 6, 5], maxLength);
                } else {
                    return groupBy(value, 4, maxLength);
                }
            }
            // Code from http://stackoverflow.com/questions/2897155/get-cursor-position-in-characters-within-a-text-input-field
            function getCaretPosition (elem) {
                // Initialize
                var caretPos = 0;

                // IE Support
                if (document.selection) {
                    // Set focus on the element
                    elem.focus ();
                    // To get cursor position, get empty selection range
                    var sel = document.selection.createRange ();
                    // Move selection start to 0 position
                    sel.moveStart ('character', -elem.value.length);
                    // The caret position is selection length
                    caretPos = sel.text.length;
                }

                // Firefox support
                else if (elem.selectionStart || elem.selectionStart == '0'){
                    caretPos = elem.selectionStart;
                }

                // Return results
                return (caretPos);
            }
            // Code from http://stackoverflow.com/questions/512528/set-cursor-position-in-html-textbox
            function setCaretPosition(elem, caretPos) {
                if(elem != null) {
                    if(elem.createTextRange) {
                        var range = elem.createTextRange();
                        range.move('character', caretPos);
                        range.select();
                    }
                    else {
                        if(elem.selectionStart) {
                            elem.focus();
                            elem.setSelectionRange(caretPos, caretPos);
                        }
                        else
                            elem.focus();
                    }
                }
            }
            function countChar(str, char) {
                return (str.match(new RegExp(char, "g")) || []).length;
            }

            var caretPos;
            var spaceCountBefore = 0;
            settings.value.subscribe(function(value) {
                caretPos = getCaretPosition(element);
                spaceCountBefore = countChar((value || '').substring(0, caretPos), " ");
            }, null, "beforeChange");

            settings.value.subscribe(function(value) {
                var num = (value + '').replace(/\D/g, '');
                var card = cardFromNumber(num);
                settings.card(card && card.type);
                // should not loop forever because knockout does not call subscribe when there is no change
                var newVal = formatNumber(num, card);
                var spaceCount = countChar(newVal.substring(0, caretPos), " ");
                settings.value(newVal);
                var delta = spaceCount-spaceCountBefore;
                // if delta is greater than 1 it means we copied text from an external source (or removed more than 1 digit)
                if(Math.abs(delta) > 1) delta = spaceCount;
                setCaretPosition(element, caretPos+delta);
            });
        }
    };

    ko.bindingHandlers.monthYear = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = valueAccessor();
            settings.value = settings.value || ko.observable();
            settings.month = settings.month || ko.observable();
            settings.year = settings.year || ko.observable();
            settings.separator = settings.separator || " / ";

            var textInputValueAccessor = function() {
                return settings.value;
            };

            ko.bindingHandlers.textInput.init(element, textInputValueAccessor, allBindingsAccessor, viewModel, bindingContext);

            settings.value.subscribeChanged(function(value, oldValue) {
                var adding = (value && value.length || 0) > (oldValue && oldValue.length || 0);
                var matches = /^(\d{1,2})(\s?\/?\s?)?(\d{1,4})?$/.exec(value);
                // force to match this pattern
                if(value && (!matches || matches.length <= 1)) {
                    settings.value( oldValue );
                    return;
                }
                var month = matches && matches[1] || '';
                var year = matches && matches[3] || '';
                // force month and year to be numbers
                if(adding && (month && isNaN(month)) || (year && isNaN(year))) {
                    settings.value( oldValue );
                    return;
                }
                var month_num = parseInt(month, 10);
                var year_num = parseInt(year, 10);
                settings.month(month_num);
                settings.year(year_num);
                // auto add / once a valid month is entered
                if(adding && value.length <= 2 && !isNaN(month_num)) {
                    month = (month.length === 1 && (value.length === 2 || month_num > 1) && month_num <= 9 ? '0' : '') + month;
                    settings.value( month + (value.length === 2 ? settings.separator : '') );
                    return;
                }
                // auto remove / if we are removing
                if(!adding && value && value.length > 2 && value.length < 2 + settings.separator.length) {
                    settings.value( month.substring(0,1) );
                    return;
                }
            });
        }
    };

    ko.bindingHandlers.jqueryPlugin = {
        init: function(element, valueAccessor) {
            var settings = valueAccessor();
            var name = ko.utils.unwrapObservable(settings.name);
            var options = ko.utils.unwrapObservable(settings.options);
            $(element)[name](options);
        }
    };

    ko.bindingHandlers.truncatedText = {
        update: function (element, valueAccessor, allBindingsAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || "",
                length = ko.utils.unwrapObservable(allBindingsAccessor().length) || ko.bindingHandlers.truncatedText.defaultLength,
                truncatedValue = value.length > length ? value.substring(0, Math.min(value.length, length)) + " ..." : value;

            ko.bindingHandlers.text.update(element, function () { return truncatedValue; });
        },
        defaultLength: 15
    };

    ko.bindingHandlers.editableText = {
        init: function(element, valueAccessor) {
            $(element).on('blur', function() {
                var observable = valueAccessor();
                observable( $(this).text() );
            });
        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).text(value);
        }
    };

});