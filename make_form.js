/*
 * make_form.js - jQuery plugin for Twitter Bootstrap framework forms
 * Author Oleg Taranov aka Kujbor
 * Copyright (C) 2013: CubeComp Development
 */
(function($, _) {

    "use strict";

    var template, lang;

    $.makeForm = function(selector) {

        return _.extend($(selector), new function() {


            /**
             * Метод настройки генератора форм
             * 
             * @param {object} options Объект настроек - шаблон и язык
             */
            this.setup = function(options) {

                if (options.template) {
                    template = options.template;
                }

                if (options.lang) {
                    lang = options.lang;
                }

            };


            /**
             * Метод генерирующий контролы формы
             * 
             * @param {object} fieldsJSON Структура полей формы в JSON формате
             * @param {object} dataJSON Данные полей формы в JSON формате
             * @param {function} condition Функция проверяющая условие добавления елемента в форму, принимает объект содержащий данные о структуре поля, должна возвращать true или false
             * @returns {object} Возвращает собственный объект с расширенными методами
             */
            this.addControls = function(fieldsJSON, dataJSON, condition) {

                var that = this;

                (function makeControls(fieldsJSON, dataJSON, parent) {

                    $.each(fieldsJSON, function(field, data) {

                        if (data.type === 'group') {

                            makeControls(data.values, dataJSON ? dataJSON[field] : null, parent ? parent + '.' + field : field);

                        } else if (!condition || !!_.bind(condition, _.extend({field: field}, data))()) {

                            var name = parent ? parent + '.' + field : field;
                            var value = dataJSON && dataJSON[field] !== null ? dataJSON[field] : '';

                            that.append(template({
                                field: field,
                                title: data.title[lang],
                                value: dataJSON && dataJSON[field] ? dataJSON[field] : '',
                                name: name,
                                data: data,
                                dataJSON: dataJSON
                            })).find('[name="' + name + '"]').val(value);

                        }

                    });

                })(fieldsJSON, dataJSON);

                this.find('[type="submit"]').remove();

                this.append(template({
                    data: {type: 'submit'}
                }));

                return this;
            };


            /**
             * Метод возвращающий текущие данные полей формы в формате JSON
             * @param {boolean} toString если передан true возвращается строка
             * @returns {object||string}
             */
            this.toJSON = function(toString) {

                var makeForm = this;

                var newData = makeForm.serializeArray();
                var formJSON = {};

                $.each(newData, function() {

                    var names = this.name.split('.');
                    var obj = formJSON;
                    var parent = null;
                    var field = null;

                    // Формируем путь к переменной в массиве по ее имени
                    _.each(names, function(name) {

                        field = name;

                        parent = obj;

                        if (!obj[name]) {
                            obj[name] = {};
                        }

                        obj = obj[name];

                    });

                    var control = makeForm.find('#' + names.join('\\.'));

                    if (control.length && control.attr('multiple')) {

                        if (parent[field]['push']) {

                            parent[field].push(this.value);

                        } else {

                            parent[field] = [this.value];

                        }

                    } else {
                        parent[field] = this.value;
                    }

                });

                return toString ? JSON.stringify(formJSON) : formJSON;

            };


            /**
             * Метод, подставляющий переданную функцию в onsubmit формы
             * 
             * @param {function} callback   Функция которая вызовется перед сабитом
             * @returns Возвращает собственный объект с расширенными методами
             */
            this.beforeSubmit = function(callback) {

                return this.off('submit').on('submit', _.bind(callback, this));

            };


            /**
             * Метод вешающий идентификатор ошибки на передаваемое поле формы
             * 
             * @param {string} text   Текст ошибки
             * @param {object} elem   jQuery объект поля формы
             */
            this.error = function(text, elem) {

                elem.next().text(text);
                elem.closest('.form-group').addClass('has-error');
                elem.focus();

            };


            /**
             * Метод проверяющий валидность форму и развешивающий
             * идентификаторы на поля с ошибками
             * 
             * @param {object} rules Правила для полей формы в формате JSON
             * @returns {boolean} Возвращает результат проверки
             */
            this.validate = function(rules) {

                var that = this;
                var formData = this.toJSON();

                that.find('.has-error .help-block').text('');
                that.find('.has-error').removeClass('has-error');

                var text = false;
                var elem = null;

                function checkValide(formData, rules, prefix) {

                    $.each(rules, function(field, data) {

                        if (data.type === 'group') {

                            checkValide(formData[field], data.values, prefix ? prefix + '\\\.' + field : field);

                        } else if (data.required) {

                            if (!formData[field]) {

                                text = 'Поле является обязательным для заполнения';
                                elem = that.find('#' + (prefix ? prefix + '\\\.' + field : field));
                                return false;

                            }

                        }

                    });

                }

                checkValide(formData, rules);

                if (text && elem) {
                    that.error(text, elem);
                    return false;
                }

                return true;
            };


            /**
             * Метод удаляющий из формы все контролы
             * 
             * @returns {object} Возвращает собственный объект с расширенными методами
             */
            this.clear = function() {
                this.find('*').remove();
                return this;
            };


        });

    };

})($, _);
