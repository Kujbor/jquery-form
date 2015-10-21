jquery.form.js
===========

jQuery plugin for generation and processing Twitter Bootstrap v3.3.5 framework forms

Usage
-----

#### jQuery#form(schema, data, callback)

* schema — object fith structure of the form fields
* data — fith initialization data of the form fields
* callback — function to call upon successful validation

Before using the generator, you must assign a form templates functions (`$.fn.form.templates = [function, ...]`), for example you can use underscore.js library and templates.html from this repository.

#### Usage example

```javascript
require(["jquery.form", "underscore"], function($) {

    "use strict";

    $.get("templates.html", function(response) {

    	$.fn.form.templates = $(response).filter("[data-forms-template]").get()
    	.reduce(function(mem, elem, id, templates) {
    
    		mem[elem.dataset.formsTemplate] = _.template($(elem).html());
    		mem[elem.dataset.formsTemplate].wrapped = elem.dataset.wrapped !== "false";
    
    		return mem;
    
    	}, {});

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
            gender: {
                title: "Gender",
                type: "select",
                values: [{
                    id: 1,
                    title: "man"
                }, {
                    id: 2,
                    title: "woman"
                }],
                required: true,
                show_if: "data.last_name"
            },
            submit: {
                title: "Next &raquo;",
                type: "submit"
            }
        }, {
            first_name: "Oleg"
        }, function(data) {

            $("<p>").text(JSON.stringify(data)).insertAfter(this);

        }).appendTo($("<div class='container'>").appendTo($("body")));
    });
});
```
