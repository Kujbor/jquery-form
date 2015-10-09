jquery.form.js
===========

jQuery plugin for generation and processing Twitter Bootstrap v3.3.5 framework forms

Usage
-----

#### jQuery#form(fieldsSchema, fieldsData, callback)

* fieldsSchema — object fith structure of the form fields
* fieldsData — object fith initialization data of the form fields
* callback — function to call upon successful validation

#### Usage example

```javascript
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
```
