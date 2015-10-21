/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap 3 framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2015: CubeComp Development
 */
define(["jquery", "bootstrap"], function($) {

    "use strict";


    /**
     * Form constructor
     *
     * @param {Object} object fith structure of the form fields
     * @param {Object} object fith initialization data of the form fields
     * @param {Function} function to call upon successful validation
     * @returns {Object} jQuery object with advanced methods
     */
    $.fn.form = function(schema, data, callback) {

        // Checking for the second parameter may be callback
        if (!callback && typeof data === "function") {
            callback = data;
        }


        /**
         * Method generates form controls
         *
         * @param {Object} object fith structure of the form fields
         * @param {Object} object fith initialization data of the form fields
         * @returns {Object} jQuery object with advanced methods
         */
        this.render = function(schema, data) {

            var $this = this;

            var $row = $("<div class='row'>").appendTo($this);

            if (!schema.submit) {

                schema = $.extend({}, schema, {
                    submit: {
                        type: "submit",
                        title: "Submit &raquo;"
                    }
                });
            }

            (function makeControls(schema, parent) {

                $.each(schema, function(field, schema) {

                    var id = parent ? parent + "-" + field : field;
                    var value = $this.getFieldValue(id, data);

                    if (schema.type === "group") {

                        makeControls(schema.values, id);

                    } else {

                        var $field, dataset = {
                            id: id,
                            schema: schema,
                            value: typeof value === "string" ? value.replace(/"/g, "&quot;") : value,
                            title: schema.title
                        };

                        dataset.control = $this.form.templates[schema.type](dataset);

                        if (!$this.form.templates[schema.type].wrapped) {
                            $field = $(dataset.control).appendTo($row);
                        } else {
                            $field = $($this.form.templates.wrapper(dataset)).appendTo($row).find("[name]");
                        }

                        if (schema.show_if) {

                            $this.on("input change", function() {

                                $field.closest(".form-group")[$this.getVisiblityCondition(schema.show_if) ? "show" : "hide"]();
                            });
                        }
                    }
                });

            })(schema);

            $this.find("[name]").each(function() {
                $(this).trigger("change");
            });

            return $this;
        };


        /**
         * Method sets data to form fields
         *
         * @param {Object} form data object
         */
        this.set = function(data) {

            var $this = this;

            $this.find("[name]").each(function() {

                var value = $this.getFieldValue(this.name, data);

                if (typeof value !== "undefined") {

                    $(this).val(value);
                }
            });
        };


        /**
         * Method returns the current data form fields
         *
         * @returns {Object} form data object
         */
        this.toJSON = function() {

            var $this = this;

            var newData = $this.serializeArray();
            var formJSON = {};

            $.each(newData, function() {

                var names = this.name.split("-");
                var obj = formJSON;
                var parent = null;
                var field = null;
                var value = this.value;

                // Forming path to a variable in the array by its name
                $.each(names, function() {

                    field = this;

                    parent = obj;

                    if (!obj[this]) {
                        obj[this] = {};
                    }

                    obj = obj[this];
                });

                var $control = $this.find("#" + this.name);

                if ($control.attr("multiple") || $control.attr("type") === "checkbox") {

                    if (parent[field].push) {

                        parent[field].push(value);

                    } else {

                        parent[field] = [value];
                    }

                } else {

                    parent[field] = value;
                }
            });

            return formJSON;
        };


        /**
         * Method checks the validity of the form and causes errors or callback
         *
         * @param {Function} function to call upon successful validation
         */
        this.onSubmit = function(callback) {

            var $this = this;
            var data = this.toJSON();

            $this.find(".form-group.has-error").removeClass("has-error").tooltip("destroy");

            var errors = [];

            (function checkValide(schema, parent) {

                $.each(schema, function(field, schema) {

                    var id = parent ? parent + "-" + field : field;
                    var value = $this.getFieldValue(id, data);

                    if (schema.type === "group") {

                        checkValide(schema.values, id);

                    } else if (schema.required && !value) {

                        if (schema.show_if) {

                            for (var i in schema.show_if) {

                                if (!$this.getVisiblityCondition(schema.show_if)) {
                                    return true;
                                }
                            }
                        }

                        errors.push($this.find("#" + id));
                    }
                });

            })(schema);

            if (!errors.length) {

                callback.call(this, data);

            } else {

                setTimeout(function() {
                    errors.reverse().map($this.throwError);
                }, 150);
            }

            return false;
        };


        /**
         * Method hangs the error identifier in the form field
         *
         * @param {Object} jQuery object of the form field
         * @param {String} text of the error
         */
        this.throwError = function($elem, text) {

            var $group = $elem.focus().closest(".form-group").addClass("has-error");

            if (typeof text === "string") {

                $group.tooltip({
                    title: text,
                    trigger: "manual"
                }).tooltip("show");
            }
        };


        /**
         * Method removes all form controls
         *
         * @returns {Object} jQuery object with advanced methods
         */
        this.clear = function() {

            this.off().find("*").remove();

            return this;
        };


        /**
         * Method returns value of the form field from the form data object
         *
         * @param {String} form field id
         * @param {Object} form data object
         * @returns {Any} value of a form field
         */
        this.getFieldValue = function(field, data) {

            var fieldPath = field.split("-");

            if (fieldPath.length > 1) {
                return data ? this.getFieldValue(fieldPath.slice(1).join("-"), data[fieldPath[0]]) : undefined;
            } else {
                return data && data[field] !== null ? data[field] : undefined;
            }
        };


        /**
         * Method returns curent field visiblity status
         *
         * @param {String} form field show_if condition
         * @returns {Boolean} current field visiblity
         */
        this.getVisiblityCondition = function(show_if) {
            return new Function("data", "return " + show_if).call(this, this.toJSON());
        };


        // Build form
        return this.clear().render(schema, data).off("submit").on("submit", this.onSubmit.bind(this, callback));
    };
});
