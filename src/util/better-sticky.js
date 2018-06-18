import $ from 'jquery';

function betterSticky() {
    var iif = function ($, window, document, undefined) {
        "use strict";

        var $doc = $(document);
        var sections = [];
        var slice = Function.prototype.call.bind([].slice);

        function debounce(fn, delay) {
            var pending;

            function deb() {
                if (pending) { clearTimeout(pending); }
                pending = setTimeout.apply(window, [fn, delay].concat(slice(arguments)));
            }

            return deb;
        }

        function offsetTop($el) {
            return $el.offsetParent().position().top;
        }

        function registerSticky(el) {
            sections.push($(el));
        }

        function deregisterSticky() {
            sections = [];
            $('.global-sticky').remove();
        }

        function scrollHandler(event, update) {
            var top = $doc.scrollTop();
            var current = sections
                .reduce(function (acc, sect) {
                    return top > offsetTop(sect) ? sect : acc;
                }, 0)

            update(current);
        }

        function updateSticky(current) {
            $('.global-sticky').remove();

            if (current) {
                var $current = $(current),
                    isOn = $current.find('button i.on').length === 1;

                if (!isOn) return;

                var $clone = $current.clone();

                $clone
                    .find('h2').removeClass('pl-5').parent()
                    .find('button').remove();

                $('<div class="global-sticky">')
                    .append($clone)
                    .appendTo(document.body);
            }
        }

        document.addEventListener('scroll', function (event) {
            scrollHandler(event, debounce(updateSticky, 60));
        });

        return [registerSticky, deregisterSticky];
    };

    return iif(jQuery, window, document);
}

export { betterSticky };
