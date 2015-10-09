/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
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

    $.fn.form = function(fieldsSchema, fieldsData, callback) {

        // Checking for the second parameter may be callback
        if (!callback && typeof fieldsData === "function") {
            callback = fieldsData;
        }


        /**
         * The method of generating form controls
         *
         * @returns {Object} jQuery object with advanced methods
         */
        this.renderFields = function() {

            var $this = this;

            var $row = $this.find(".row");

            if (!$row.length) {
                $row = $("<div class='row'>").appendTo($this);
            }

            var needToUpdateConditionsFields = [];

            (function makeControls(fieldsSchema, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this.getFieldValue(controlId, fieldsData);

                    if (fieldSchema.type === "group") {

                        makeControls(fieldSchema.values, controlId);

                    } else {

                        var $field = $row.append($this.form.template({
                            controlId: controlId,
                            fieldSchema: fieldSchema,
                            fieldData: typeof fieldData === "string" ? fieldData.replace(/"/g, "&quot;") : fieldData,
                            fieldTitle: fieldSchema.title
                        }));

                        if (fieldSchema.show_if) {

                            $.each(fieldSchema.show_if, function(field, values) {

                                $this.on("input change", "#" + field, function() {

                                    if (values.indexOf(this.value) !== -1) {

                                        $field.closest(".form-group").show();

                                    } else {

                                        $field.closest(".form-group").hide();
                                    }
                                });

                                needToUpdateConditionsFields.push($this.find("#" + field));
                            });
                        }
                    }
                });

            })(fieldsSchema);

            $.each(needToUpdateConditionsFields, function() {
                this.trigger("change");
            });

            return $this;
        };


        /**
         * The method of checking the validity of the form and causes errors or callback
         */
        this.onSubmit = function() {

            var $this = this;
            var fieldsData = this.toJSON();

            $this.find(".form-group.has-error").removeClass("has-error").tooltip("destroy");

            var errors = [];

            (function checkValide(fieldsSchema, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this.getFieldValue(controlId, fieldsData);

                    if (fieldSchema.type === "group") {

                        checkValide(fieldSchema.values, controlId);

                    } else if (fieldSchema.required && !fieldData) {

                        if (fieldSchema.show_if) {

                            for (var i in fieldSchema.show_if) {

                                if (fieldSchema.show_if[i].indexOf($this.find("#" + i).val()) === -1) {

                                    return true;
                                }
                            }
                        }

                        errors.push($this.find("#" + controlId));
                    }
                });

            })(fieldsSchema);

            if (!errors.length) {

                callback.call(this, fieldsData);

            } else {

                setTimeout(function() {
                    errors.reverse().map($this.throwError);
                }, 150);
            }

            return false;
        };


        /**
         * The method of hanging the error identifier in the form field
         *
         * @param {Object} elem jQuery object of the form field
         * @param {String} text The text of the error
         */
        this.throwError = function($elem, text) {

            var $formGroup = $elem.focus().closest(".form-group").addClass("has-error");

            if (typeof text === "string") {

                $formGroup.tooltip({
                    title: text,
                    trigger: "manual"
                }).tooltip("show");
            }
        };


        /**
         * The method returns the value of the form field from the form data object
         *
         * @param {String} field Form field id
         * @param {Object} data Form data object
         * @returns {Any} The value of a form field
         */
        this.getFieldValue = function(field, data) {

            var fieldPath = field.split("-");

            if (fieldPath.length > 1) {
                return data ? this.getFieldValue(fieldPath.slice(1).join("-"), data[fieldPath[0]]) : "";
            } else {
                return data && data[field] !== null ? data[field] : "";
            }
        };


        /**
         * The method removing all form controls
         *
         * @returns {Object} jQuery object with advanced methods
         */
        this.removeFields = function() {

            this.find("*").remove();

            return this;
        };


        /**
         * The method returns the current data form fields
         *
         * @returns {Object} The form data object
         */
        this.toJSON = function() {

            var form = this;

            var newData = form.serializeArray();
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

                if (form.find("#" + this.name).attr("multiple")) {

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

        return this.removeFields().renderFields().off("submit").on("submit", this.onSubmit.bind(this));
    };
});
