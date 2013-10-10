/*
 * example.js - example of jQuery makeForm plugin setup
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
 (function($, _) {

    "use strict";

    $.get('templates/form-controls.html', function(response) {
        $.makeForm.setup({
            template: _.template(response),
            lang: 'ru'
        });
    });

})($, _);
