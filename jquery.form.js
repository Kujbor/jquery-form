/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap 3 framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2015: CubeComp Development
 */
define(["jquery", "bootstrap"], function($) {

    "use strict";


    /**
     * Form builder
     *
     * @param {Object} object with structure of the form's fields
     * @param {Object} object with initialization data of the form's fields
     * @param {Function} function to call upon successful validation
     * @returns {Object} jQuery object with advanced methods
     */
    $.fn.form = function(schema, data, callback) {

        // Checking for the second parameter may be callback
        if (!callback && typeof data === "function") {
            callback = data;
        }

        // Checking for the first parameter may be callback
        if (!data && !callback && typeof schema === "function") {
            callback = schema;
        }


        /**
         * jQuery object of the form
         */
        var $form = this;


        /**
         * Method generates form's controls
         *
         * @param {Object} object with structure of the form's fields
         * @param {Object} object with initialization data of the form's fields
         * @returns {Object} jQuery object with advanced methods
         */
        $form.render = function(schema, data) {

            $form.schema = schema;
            $form.find("*").remove();
            $form.visiblityConditions = [];

            var $row = $("<div class='row'>").appendTo($form);

            (function makeControls(schema, parent) {

                $.each(schema, function(field, schema) {

                    var id = parent ? parent + "-" + field : field;
                    var value = $form.getFieldValue(id, data);

                    if (schema.type === "group") {

                        makeControls(schema.values, id);

                    } else {

                        var $field, dataset = {
                            id: id,
                            schema: schema,
                            value: typeof value === "string" ? value.replace(/[&<>"'\/]/g, function(s) {
                                return {
                                    "&": "&amp;",
                                    "<": "&lt;",
                                    ">": "&gt;",
                                    '"': "&quot;",
                                    "'": "&#39;",
                                    "/": "&#x2F;"
                                }[s];
                            }) : value,
                            title: schema.title
                        };

                        dataset.control = $form.form.templates[schema.type] || $form.form.templates.text;
                        dataset.$control = dataset.control(dataset);

                        if (dataset.control.wrapped) {
                            $field = $($form.form.templates.wrapper(dataset)).appendTo($row).find("#" + id);
                        } else {
                            $field = $(dataset.$control).appendTo($row);
                        }

                        if (schema.show_if) {

                            $form.visiblityConditions.push({
                                show_if: schema.show_if,
                                $field: $field.closest(".form-group").parent()
                            });
                        }
                    }
                });

            })($form.schema);

            return $form.trigger("change");
        };


        /**
         * Method sets data to form fields
         *
         * @param {Object} form data object
         * @returns {Object} form's data object
         */
        $form.set = function(data) {

            $form.find("[name]").each(function() {

                var value = $form.getFieldValue(this.name, data);

                if (typeof value !== "undefined") {

                    $(this).val(value);
                }

            });

            return $form.trigger("change");
        };


        /**
         * Method returns the current data form fields
         *
         * @returns {Object} form's data object
         */
        $form.toJSON = function() {

            var newData = $form.serializeArray();
            var formJSON = {};

            $.each(newData, function() {

                var names = this.name.split("-");
                var obj = formJSON;
                var parent = null;
                var field = null;
                var value = this.value;

                try {
                    value = ["object", "boolean"].indexOf(typeof JSON.parse(value)) === -1 ? value : JSON.parse(value);
                } catch (e) {}

                /* <<<<<< TODO: Transform mechanism under the scheme work instead DOM */
                // Forming path to a variable in the array by its name
                $.each(names, function() {

                    field = this;

                    parent = obj;

                    if (!obj[this]) {
                        obj[this] = {};
                    }

                    obj = obj[this];
                });

                var $control = $form.find("#" + this.name);

                if ($control.attr("multiple") || $control.attr("type") === "checkbox") {

                    if (parent[field].push) {

                        parent[field].push(value);

                    } else {

                        parent[field] = [value];
                    }

                } else {

                    parent[field] = value;
                }
                /* >>>>>> TODO: Transform mechanism under the scheme work instead DOM */
            });

            return formJSON;
        };


        /**
         * Method checks the validity of the form and causes errors or callback
         *
         * @param {Function} function to call upon successful validation
         */
        $form.validate = function(selfCallback) {

            var data = $form.toJSON();

            $form.find(".form-group.has-error").removeClass("has-error").tooltip("destroy");

            var errors = [];

            (function checkValide(schema, parent) {

                $.each(schema, function(field, schema) {

                    var id = parent ? parent + "-" + field : field;
                    var value = $form.getFieldValue(id, data);

                    if (schema.type === "group") {

                        checkValide(schema.values, id);

                    } else if (schema.required && !value) {

                        if (schema.show_if) {

                            for (var i in schema.show_if) {

                                if (!$form.getVisiblityCondition(schema.show_if)) {
                                    return true;
                                }
                            }
                        }

                        errors.push($form.find("#" + id));
                    }
                });

            })($form.schema);

            if (!errors.length) {

                (typeof selfCallback === "function" ? selfCallback : callback).call($form, data);

            } else {

                setTimeout(function() {
                    errors.reverse().map($form.throwError);
                }, 150);
            }

            return false; // Need for prevent native form's submit action
        };


        /**
         * Method hangs the error's identifier on the form field
         *
         * @param {Object} jQuery object of the form's field
         * @param {String} text of the error
         * @returns {Object} jQuery object with advanced methods
         */
        $form.throwError = function($elem, text) {

            var $group = $elem.focus().closest(".form-group").addClass("has-error");

            if (typeof text === "string") {

                $group.tooltip({
                    title: text,
                    trigger: "manual"
                }).tooltip("show");
            }

            return $form;
        };


        /**
         * Method hangs the error's identifiers on the form fields
         *
         * @param {Object} form's error's object
         * @param {Text} previous parent's ids - internal method's param
         * @returns {Object} jQuery object with advanced methods
         */
        $form.throwErrors = function(errors, _context) {

            for (var i in errors) {

                if (isNaN(errors[i].length)) { // Value is a form errors object

                    $form.throwErrors(errors[i], (_context ? _context + "-" : "") + i);

                } else { // Value is a field errors array

                    for (var j = 0; j < errors[i].length; j++) {

                        $form.throwError($form.find("#" + (_context ? _context + "-" : "") + i), errors[i][j]);
                    }
                }
            }

            return $form;
        };


        /**
         * Method returns value of the form field from the form's data object
         *
         * @param {String} form field id
         * @param {Object} form data object
         * @returns {Any} value of a form field
         */
        $form.getFieldValue = function(field, data) {

            var fieldPath = field.split("-");

            if (fieldPath.length > 1) {
                return data ? $form.getFieldValue(fieldPath.slice(1).join("-"), data[fieldPath[0]]) : undefined;
            } else {
                return data && data[field] !== null ? data[field] : undefined;
            }
        };


        /**
         * Method updates fields visiblity state
         *
         * @returns {Object} jQuery object with advanced methods
         */
        $form.updateVisiblityState = function() {

            for (var i = 0; i < $form.visiblityConditions.length; i++) {

                var $field = $form.visiblityConditions[i].$field;
                var show_if = $form.visiblityConditions[i].show_if;

                $field[$form.getVisiblityCondition(show_if) ? "show" : "hide"]();
            }

            return $form;
        };


        /**
         * Method returns curent field's visiblity status
         *
         * @param {String} form field's show_if condition
         * @returns {Boolean} current field's visiblity
         */
        $form.getVisiblityCondition = function(show_if) {
            return new Function("data", "return " + show_if).call($form, $form.toJSON());
        };


        // Build the form if form's data exists
        return $form
            .render(schema, data)
            .off("submit", $form.validate)
            .on("submit", $form.validate)
            .off("input change", $form.updateVisiblityState)
            .on("input change", $form.updateVisiblityState);
    };
});
