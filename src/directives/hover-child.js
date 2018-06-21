import $ from 'jquery';

let hoverChildDirective = {
    bind: (el, binding) => {
        $(el)
            .on('mouseenter', function(event) {
                $(el).children('.icon').addClass(binding.value);
            })
            .on('mouseleave', function(event) {
                $(el).children('.icon').removeClass(binding.value);
            });
    }
};

export { hoverChildDirective };
