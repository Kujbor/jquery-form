/*
 * Example of jQuery.Form plugin setup
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
define("example", ["jquery.form", "underscore"], function() {

    "use strict";

    $.get("template.html", function(response) {
        $.form.setup({
            template: _.template(response),
            lang: "ru"
        });
    });
})();
