/*
 * Example of jQuery makeForm plugin setup
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
$(function() {

    "use strict";

    $.get('templates/form-controls.html', function(response) {
        $.form.setup({
            template: _.template(response),
            lang: fg.config.lang
        });
    });

})();
