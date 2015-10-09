/*
 * Example of jQuery.Form plugin setup
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
require(["jquery", "jquery.form", "underscore"], function($) {

    "use strict";

    $.get("template.html", function(response) {

        $.fn.form.template = _.template(response);

        $("<form>").form({
            first_name: {
                title: "First name",
                required: true,
                type: "text"
            },
            last_name: {
                title: "Last name",
                type: "text"
            },
            submit: {
                title: "Next &raquo;",
                type: "submit"
            }
        }, {
            first_name: "Oleg",
            last_name: "Taranov"
        }, function(data) {

            $("<p class='text-success'>").text(JSON.stringify(data)).insertAfter(this);

        }).appendTo("body");
    });
});
