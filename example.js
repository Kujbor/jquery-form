/*
 * Example of jQuery.Form plugin setup
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
define(["jquery", "jquery.form", "underscore"], function($) {

    "use strict";

    $.get("template.html", function(response) {
        $.fn.form.template = _.template(response);
    });
});
