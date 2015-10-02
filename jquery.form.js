/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
define(["jquery", "underscore", "bootstrap"], function($) {

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

            function makeControls(fieldsSchema, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this._getFieldValue(controlId, fieldsData);

                    if (fieldSchema.type === "group") {

                        makeControls(fieldSchema.values, controlId);

                    } else {

                        var $field = $row.append($this.form.template({
                            controlId: controlId,
                            fieldSchema: fieldSchema,
                            fieldData: typeof fieldData === "string" ? fieldData.replace(/"/g, "\"") : fieldData,
                            fieldDataEncoded: fieldData ? $.getProtectedValue(fieldData) : null,
                            fieldTitle: fieldSchema.title,
                            testId: $this.closest("form").attr("data-test") + "-" + controlId
                        }));

                        if (fieldSchema.show_if) {

                            for (var i in fieldSchema.show_if) {

                                (function(i) {

                                    $this.on("input change", "#" + i, function() {

                                        if (fieldSchema.show_if[i].indexOf(this.value) !== -1) {

                                            $field.closest(".form-group").show();

                                        } else {

                                            $field.closest(".form-group").hide();
                                        }

                                    });

                                    needToUpdateConditionsFields.push($this.find("#" + i));

                                })(i);
                            }
                        }
                    }
                });

            }

            makeControls(fieldsSchema);

            $.each(needToUpdateConditionsFields, function() {
                this.trigger("change");
            });

            if (!$this.find("[type='submit']").length) {

                makeControls({
                    submit: {
                        type: "submit",
                        title: "Отправить"
                    }
                });
            }

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

                try {
                    value = $.getCleanValue(this.value);
                } catch (e) {}

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


    /**
     * Метод получения значения, готового к записи в строку из любого типа данных
     *
     * @param {any} value - любые данные для шифрования
     * @returns {string} - строка с зашифрованными данными
     */
    $.getProtectedValue = function(value) {
        return $.htmlEncode(JSON.stringify(value));
    };


    /**
     * Метод получения реального значения из зашифрованной строки
     *
     * @param {string} value - строка с зашифрованными данными
     * @returns {any} - реальное значение любого типа
     */
    $.getCleanValue = function(value) {
        return JSON.parse($.htmlDecode(value));
    };


    /**
     * Метод настройки установки защищенного значения или чтения реального из контрола
     *
     * @param {any} newValue если переданы данные значение будет записано в контрол
     * @returns {any} значение контрола
     */
    $.fn.protectedValue = function(newValue) {

        if (typeof newValue === "undefined") {
            return this.val() ? $.getCleanValue((this.val())) : "";
        } else {
            return this.val($.getProtectedValue(newValue ? newValue : ""));
        }
    };


    /**
     * Метод экранирования данных
     *
     * @param {string} value произвольный текст
     * @returns {string} - экранированный текст
     */
    $.htmlEncode = function(data) {
        return $("<div />").text(data).html().replace(/"/g, "&quot;");
    };


    /**
     * Метод расшифровки экранированных данных
     *
     * @param {string} value экранированный текст
     * @returns {string} - расшифрованный текст
     */
    $.htmlDecode = function(data) {
        return $("<div />").html(data.replace(/&quot;/g, '"')).text();
    };


    /*
     * Настройка генератора форм
     */
    $.fn.form.template = _.template($("script#form-controls-template").html());
});
