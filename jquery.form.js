/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
define(["jquery", "bootstrap"], function($) {

    "use strict";


    /**
     * Конструктор формы
     *
     * @param {Object} fieldsSchema Структура полей формы в JSON формате
     * @param {Object} fieldsData Данные полей формы в JSON формате
     * @returns {Object} Возвращает jQuery объект с расширенными методами
     */

    $.fn.form = function(fieldsSchema, fieldsData, callback) {

        /**
         * Проверяем не передан ли вторым параметром callback
         */
        if (!callback && typeof fieldsData === "function") {
            callback = fieldsData;
        }


        /**
         * Метод генерирующий контролы формы
         *
         * @returns {Object} Возвращает jQuery объект с расширенными методами
         */
        this._render = function() {

            var $this = this;

            var $row = $this.find(".row");

            if (!$row.length) {
                $row = $("<div class='row'>").appendTo($this);
            }

            var needToUpdateConditionsFields = [];

            (function makeControls(fieldsSchema, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this._getFieldValue(controlId, fieldsData);

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
         * Метод проверяющий валидность формы и вфзывающий ошибки или callback
         *
         * @returns {boolean} Возвращает результат проверки
         */
        this._submit = function() {

            var $this = this;
            var fieldsData = this._toJSON();

            $this.find(".form-group.has-error").removeClass("has-error").tooltip("destroy");

            var errors = [];

            (function checkValide(fieldsSchema, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this._getFieldValue(controlId, fieldsData);

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
                    errors.reverse().map($this._error);
                }, 150);
            }

            return false;
        };


        /**
         * Метод вешающий идентификатор ошибки на поле формы
         *
         * @param {object} elem jQuery объект поля формы
         * @param {string} text Текст ошибки
         */
        this._error = function($elem, text) {

            var $formGroup = $elem.focus().closest(".form-group").addClass("has-error");

            if (typeof text === "string") {

                $formGroup.tooltip({
                    title: text,
                    trigger: "manual"
                }).tooltip("show");
            }
        };


        /**
         * Метод возвращающий значение контейнера из схемы данных формы
         *
         * @returns {object} Возвращает объект с данными о поле формы
         */
        this._getFieldValue = function(field, data) {

            var fieldPath = field.split("-");

            if (fieldPath.length > 1) {
                return data ? this._getFieldValue(fieldPath.slice(1).join("-"), data[fieldPath[0]]) : "";
            } else {
                return data && data[field] !== null ? data[field] : "";
            }
        };


        /**
         * Метод удаляющий из формы все контролы
         *
         * @returns {object} Возвращает jQuery объект с расширенными методами
         */
        this._clear = function() {

            this.find("*").remove();

            return this;
        };


        /**
         * Метод возвращающий текущие данные полей формы в формате JSON
         *
         * @returns {object}
         */
        this._toJSON = function() {

            var form = this;

            var newData = form.serializeArray();
            var formJSON = {};

            $.each(newData, function() {

                var names = this.name.split("-");
                var obj = formJSON;
                var parent = null;
                var field = null;
                var value = this.value;

                // Формируем путь к переменной в массиве по ее имени
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

        return this._clear()._render().off("submit").on("submit", this._submit.bind(this));
    };
});
