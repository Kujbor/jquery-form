/*
 * jquery.form.js - jQuery plugin for Twitter Bootstrap framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
define("jquery.form", ["jquery"], function($) {

    "use strict";

    function Form() {

        /**
         * Метод генерирующий контролы формы
         * 
         * @param {object} fieldsSchema Структура полей формы в JSON формате
         * @param {object} fieldsData Данные полей формы в JSON формате
         * @returns {object} Возвращает jQuery объект с расширенными методами
         */
        this.addControls = function(fieldsSchema, fieldsData) {

            var $this = this;

            var $row = $this.find(".row");

            if (!$row.length) {
                $row = $("<div>", {class: "row"}).appendTo($this);
            }

            function makeControls(fieldsSchema, fieldsData, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this._getFieldValue(controlId, fieldsData);

                    if (fieldSchema.type === "group") {

                        makeControls(fieldSchema.values, fieldData, controlId);

                    } else {

                        $row.append($this.template({
                            controlId: controlId,
                            fieldSchema: fieldSchema,
                            fieldData: fieldData,
                            fieldDataEncoded: fieldData ?
                                    $.htmlEncode(JSON.stringify(fieldData)) :
                                    null,
                            fieldTitle: fieldSchema.title[$this.lang]
                        }));
                    }
                });
            }

            makeControls(fieldsSchema, fieldsData);

            if (!$this.find("[type='submit']").length) {

                makeControls({
                    submit: {
                        type: "submit",
                        title: {ru: "Отправить"}
                    }
                });
            }

            return this;
        };


        /**
         * Метод возвращающий текущие данные полей формы в формате JSON
         * @param {boolean} toString если передан true возвращается строка
         * @returns {object||string}
         */
        this.toJSON = function(toString) {

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
                    value = JSON.parse($.htmlDecode(this.value));
                } catch (e) {
                }

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

            $.log.info("formData", newData);
            $.log.info("formJSON", formJSON);

            return toString ? JSON.stringify(formJSON) : formJSON;
        };


        /**
         * Метод, подставляющий переданную функцию в onsubmit формы
         * 
         * @param {function} callback   Функция которая вызовется перед сабитом
         * @returns Возвращает jQuery объект с расширенными методами
         */
        this.beforeSubmit = function(callback) {
            return this.off("submit").on("submit", $.proxy(callback, this));
        };


        /**
         * Метод вешающий идентификатор ошибки на передаваемое поле формы
         * 
         * @param {string} text   Текст ошибки
         * @param {object} elem   jQuery объект поля формы
         */
        this.error = function(text, $elem) {

            var $formGroup = $elem.closest(".form-group");

            $formGroup.addClass("has-error").find(".help-block").text(text);
            $elem.focus();
        };


        /**
         * Метод проверяющий валидность форму и развешивающий
         * идентификаторы на поля с ошибками
         * 
         * @param {object} rules Правила для полей формы в формате JSON
         * @returns {boolean} Возвращает результат проверки
         */
        this.validate = function(fieldsSchema) {

            var $this = this;
            var fieldsData = this.toJSON();

            $this.find(".has-error .help-block").text("");
            $this.find(".has-error").removeClass("has-error");

            var text = false;
            var elem = null;

            function checkValide(fieldsSchema, fieldsData, parent) {

                $.each(fieldsSchema, function(fieldId, fieldSchema) {

                    var controlId = parent ? parent + "-" + fieldId : fieldId;
                    var fieldData = $this._getFieldValue(controlId, fieldsData);

                    if (fieldSchema.type === "group") {

                        checkValide(fieldSchema.values, fieldData, controlId);

                    } else if (fieldSchema.required && !fieldData) {

                        text = "Поле является обязательным для заполнения";
                        elem = $this.find("#" + controlId);

                        return false;
                    }
                });
            }

            checkValide(fieldsSchema, fieldsData);

            if (text && elem) {
                $this.error(text, elem);
                return false;
            }

            return true;
        };


        /**
         * Метод удаляющий из формы все контролы
         * 
         * @returns {object} Возвращает jQuery объект с расширенными методами
         */
        this.clear = function() {
            this.find("*").remove();
            return this;
        };


        /**
         * Метод возвращающий значение контейнера из схемы данных формы
         * 
         * @returns {object} Возвращает объект с данными о поле формы
         */
        this._getFieldValue = function(field, data) {

            var fieldPath = field.split("-");

            if (fieldPath.length > 1) {
                return data ? this._getFieldValue(fieldPath.slice(1).join("-"),
                        data[fieldPath[0]]) : "";
            } else {
                return data && data[field] !== null ? data[field] : "";
            }
        };
    }

    $.form = function(selector) {
        return $.extend($(selector), new Form());
    };

    /**
     * Метод настройки генератора форм
     * 
     * @param {object} options Объект настроек, например шаблон и язык
     */
    $.form.setup = function(options) {
        $.extend(Form.prototype, options);
    };
});
