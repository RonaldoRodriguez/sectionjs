var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var SectionJS = /** @class */ (function () {
    /**
     * Constructor de la clase SectionJS.
     * @param articleContainer Contenedor HTML donde se renderizarán los datos.
     * @throws Error si el contenedor no es válido.
     */
    function SectionJS(articleContainer) {
        // Nombre del contenedor
        this.name = null;
        // Plantilla para renderizar cada artículo
        this.articleTemplate = null;
        // Plantillas para los elementos de información (paginación, etc.)
        this.infoTemplates = null;
        // Total de datos cargados
        this.dataTotal = 0;
        // Total de páginas calculadas
        this.totalPages = 0;
        // Total de elementos
        this.itemsTotal = 0;
        // Número de elementos en la página actual
        this.itemsNow = 0;
        // Índice del primer elemento en la página actual
        this.firstItemIndex = 0;
        // Índice del último elemento en la página actual
        this.lastItemIndex = 0;
        // Última página calculada
        this.lastPage = 0;
        // Datos cargados desde la fuente
        this.data = null;
        // Observador de cambios en los atributos del contenedor
        this.observer = null;
        // Indica si el observador está activo
        this.observerActive = false;
        if (!articleContainer) {
            throw new Error("El contenedor proporcionado no es un elemento válido.");
        }
        this.articleContainer = articleContainer;
        // Inicializar elementos "info" y guardar sus plantillas
        this.spanElements = __spreadArray(__spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-action="info"], [data-section-action="info"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"info\"], [data-target=\"").concat(this.articleContainer.id, "\"][data-section-action=\"info\"]"))), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"]"))).flatMap(function (container) {
            return Array.from(container.querySelectorAll('[data-action="info"], [data-section-action="info"]'));
        }), true);
        // Guardar una copia de cada elemento "info" como plantilla
        this.infoTemplates = this.spanElements.map(function (element) { return element.cloneNode(true); });
        // Asignar atributos del contenedor
        this.dataSourceURL = articleContainer.getAttribute('data-section');
        this.limit = this.validateNumber(articleContainer.getAttribute('data-limit'), 'data-limit');
        this.order = articleContainer.getAttribute('data-order') || 'ASC';
        this.start = this.validateNumber(articleContainer.getAttribute('data-start'), 'data-start') || 0;
        this.orderBy = articleContainer.getAttribute('data-by');
        this.total = this.validateNumber(articleContainer.getAttribute('data-total'), 'data-total');
        this.defaultPage = Math.max(1, this.validateNumber(articleContainer.getAttribute('data-default-page'), 'data-default-page') || 1);
        this.currentPage = this.defaultPage;
        this.responsePath = articleContainer.getAttribute('data-response-path');
        this.findKey = articleContainer.getAttribute('data-find');
        this.name = this.articleContainer.id;
        // No activar el Observer por defecto
    }
    /**
     * Activa el MutationObserver para detectar cambios en los atributos del contenedor.
     */
    SectionJS.prototype.enableObserver = function () {
        var _this = this;
        if (this.observerActive)
            return;
        var attributesToObserve = [
            'data-find', 'data-limit', 'data-order', 'data-start', 'data-by',
            'data-total', 'data-default-page', 'data-response-path', 'data-section'
        ];
        this.observer = new MutationObserver(function (mutationsList) {
            for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
                var mutation = mutationsList_1[_i];
                if (mutation.type === 'attributes' && mutation.attributeName) {
                    _this.handleAttrChange(mutation.attributeName);
                }
            }
        });
        this.observer.observe(this.articleContainer, {
            attributes: true,
            attributeFilter: attributesToObserve,
            subtree: false
        });
        this.observerActive = true;
    };
    /**
     * Desactiva el MutationObserver.
     */
    SectionJS.prototype.disableObserver = function () {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.observerActive = false;
        }
    };
    /**
     * Maneja cambios en los atributos detectados por el MutationObserver.
     * @param attributeName Nombre del atributo que cambió.
     */
    SectionJS.prototype.handleAttrChange = function (attributeName) {
        this.refresh(); // Simplemente refrescamos la sección
    };
    /**
     * Valida que un valor sea un número válido.
     * @param value Valor a validar.
     * @param attributeName Nombre del atributo (para mensajes de error).
     * @returns El número validado o null si no es válido.
     */
    SectionJS.prototype.validateNumber = function (value, attributeName) {
        if (value === null || value === undefined || value === "")
            return null;
        var number = Number(value);
        if (isNaN(number)) {
            console.error("Error: El atributo ".concat(attributeName, " debe ser un n\u00FAmero."));
            return null;
        }
        return number;
    };
    /**
     * Carga los datos desde la fuente especificada en dataSourceURL.
     * @returns Los datos cargados.
     */
    SectionJS.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, contentType, fullJsonData, filteredJsonData, textData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dataSourceURL)
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, fetch(this.dataSourceURL)];
                    case 2:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error("Error: ".concat(response.status));
                        contentType = response.headers.get("Content-Type");
                        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json"))) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        fullJsonData = _a.sent();
                        filteredJsonData = this.responsePath ? this.getValue(fullJsonData, this.responsePath) : fullJsonData;
                        this.data = Array.isArray(filteredJsonData) ? filteredJsonData : [filteredJsonData];
                        this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:datachanged', { detail: { data: this.data } }));
                        return [2 /*return*/, fullJsonData];
                    case 4: return [4 /*yield*/, response.text()];
                    case 5:
                        textData = _a.sent();
                        this.data = [textData];
                        return [2 /*return*/, textData];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error(error_1);
                        this.articleContainer.innerHTML = "<p>Error al cargar datos.</p>";
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Busca un valor específico en los datos cargados.
     * @param fullData Datos completos (opcional, si no se proporciona, se cargan automáticamente).
     */
    SectionJS.prototype.findKeyValue = function () {
        return __awaiter(this, arguments, void 0, function (fullData) {
            var findKey, defaultValue, value, error_2;
            if (fullData === void 0) { fullData = null; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.articleContainer)
                            return [2 /*return*/];
                        findKey = this.articleContainer.getAttribute('data-find');
                        defaultValue = this.articleContainer.getAttribute('data-find-default') || 'none';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        if (!!fullData) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.load()];
                    case 2:
                        fullData = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (findKey) {
                            value = this.getValue(fullData, findKey) || defaultValue;
                            this.articleContainer.setAttribute('data-find-value', value);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Error en findValue:", error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Actualiza los atributos de la instancia en función del contenedor.
     */
    SectionJS.prototype.updateAttrs = function () {
        this.dataSourceURL = this.articleContainer.getAttribute('data-section');
        this.limit = this.validateNumber(this.articleContainer.getAttribute('data-limit'), 'data-limit');
        this.order = this.articleContainer.getAttribute('data-order') || 'ASC';
        this.start = this.validateNumber(this.articleContainer.getAttribute('data-start'), 'data-start') || 0;
        this.orderBy = this.articleContainer.getAttribute('data-by');
        this.total = this.validateNumber(this.articleContainer.getAttribute('data-total'), 'data-total');
        this.defaultPage = Math.max(1, this.validateNumber(this.articleContainer.getAttribute('data-default-page'), 'data-default-page') || 1);
        this.responsePath = this.articleContainer.getAttribute('data-response-path');
        this.findKey = this.articleContainer.getAttribute('data-find');
    };
    /**
     * Obtiene los datos de una página específica.
     * @param page Número de la página.
     * @returns Los datos de la página.
     */
    SectionJS.prototype.getPage = function (page) {
        var _this = this;
        var _a, _b;
        if (!this.data)
            return [];
        var dataToUse = this.data;
        // Ordenar los datos si se especifica un orden
        if (Array.isArray(dataToUse) && this.orderBy) {
            dataToUse = dataToUse.slice().sort(function (a, b) {
                var valueA = _this.getValue(a, _this.orderBy);
                var valueB = _this.getValue(b, _this.orderBy);
                return _this.order.toLowerCase() === 'asc' ? (valueA < valueB ? -1 : 1) : (valueA > valueB ? -1 : 1);
            });
        }
        // Calcular índices de la página
        var pageSize = (_a = this.limit) !== null && _a !== void 0 ? _a : dataToUse.length;
        var startIndex = (page - 1) * pageSize + this.start;
        var endIndex = Math.min(startIndex + pageSize, (_b = this.total) !== null && _b !== void 0 ? _b : dataToUse.length);
        return dataToUse.slice(startIndex, endIndex);
    };
    /**
     * Renderiza los datos en el contenedor.
     * @param pageData Datos de la página a renderizar.
     */
    SectionJS.prototype.render = function (pageData) {
        var _this = this;
        if (!this.articleContainer)
            return;
        var elementosOrdenados = [];
        var plantilla = null;
        // Desactivar temporalmente el observer
        var wasObserverActive = this.observerActive;
        if (wasObserverActive) {
            this.disableObserver();
        }
        // Recorrer los elementos hijos del contenedor
        Array.from(this.articleContainer.children).forEach(function (elemento) {
            var _a;
            var element = elemento;
            // Si el elemento es estático, lo agregamos al array de elementos ordenados
            if (element.hasAttribute('data-section-static')) {
                elementosOrdenados.push(element);
                element.remove(); // Lo removemos temporalmente del contenedor
            }
            // Si el elemento es candidato a plantilla (el primero que no es estático o tiene data-section-render)
            else if (element.hasAttribute('data-section-render') || !plantilla) {
                if (!plantilla) {
                    plantilla = element;
                    _this.articleTemplate = (_a = _this.articleTemplate) !== null && _a !== void 0 ? _a : plantilla;
                    if (!_this.articleTemplate || !(_this.articleTemplate instanceof HTMLElement)) {
                        throw new Error("No se pudo encontrar una plantilla válida en el contenedor.");
                    }
                    // Renderizar los datos usando la plantilla
                    pageData.forEach(function (articleData) {
                        var elementoRenderizado = _this.articleTemplate.cloneNode(true);
                        elementoRenderizado.querySelectorAll('*').forEach(function (el) {
                            _this.processText(el, articleData);
                            _this.processAttrs(el, articleData);
                            _this.assignSrc(el);
                        });
                        elementosOrdenados.push(elementoRenderizado);
                    });
                }
                element.remove(); // Remover la plantilla original del contenedor
            }
            // Si el elemento no es estático ni plantilla, lo removemos
            else {
                element.remove();
            }
        });
        // Agregar los elementos ordenados de vuelta al contenedor
        elementosOrdenados.forEach(function (elemento) { return _this.articleContainer.appendChild(elemento); });
        // Marcar el contenedor como renderizado
        this.articleContainer.setAttribute('data-section-rendered', 'true');
        // Reactivar el observer si estaba activo
        if (wasObserverActive) {
            this.enableObserver();
        }
        // Reconectar botones, actualizar info y botones
        this.reconnectButtons();
        this.updateInfo();
        this.updateButtons();
        // Disparar evento de renderizado
        this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:rendered', { detail: { pageData: pageData } }));
    };
    /**
     * Reconecta los botones de paginación.
     */
    SectionJS.prototype.reconnectButtons = function () {
        var _this = this;
        if (!this.articleContainer)
            return;
        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        var prevButtons = __spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"prev\"]"))), true).filter(function (button) { return button !== null; });
        var nextButtons = __spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"next\"]"))), true).filter(function (button) { return button !== null; });
        // Asignar eventos a los botones
        prevButtons.forEach(function (button) { return button.onclick = function () { return _this.paginate('prev'); }; });
        nextButtons.forEach(function (button) { return button.onclick = function () { return _this.paginate('next'); }; });
    };
    /**
     * Procesa el texto de un elemento y reemplaza las variables con los datos.
     * @param element Elemento a procesar.
     * @param data Datos a utilizar para el reemplazo.
     */
    SectionJS.prototype.processText = function (element, data) {
        var _this = this;
        Array.from(element.childNodes)
            .filter(function (node) { return node.nodeType === Node.TEXT_NODE; })
            .forEach(function (textNode) {
            textNode.textContent = _this.replaceText(textNode.textContent || '', data);
        });
    };
    /**
     * Procesa los atributos de un elemento y reemplaza las variables con los datos.
     * @param element Elemento a procesar.
     * @param data Datos a utilizar para el reemplazo.
     */
    SectionJS.prototype.processAttrs = function (element, data) {
        var _this = this;
        Array.from(element.attributes).forEach(function (attr) {
            element.setAttribute(attr.name, _this.replaceText(attr.value, data));
        });
    };
    /**
     * Asigna el atributo `src` a elementos multimedia (img, audio, video) si tienen `data-src`.
     * @param element Elemento a procesar.
     */
    SectionJS.prototype.assignSrc = function (element) {
        if (['IMG', 'AUDIO', 'VIDEO'].includes(element.tagName) && element.hasAttribute('data-src')) {
            element.setAttribute('src', element.getAttribute('data-src'));
        }
    };
    /**
     * Reemplaza las variables en un texto con los valores correspondientes de los datos.
     * @param text Texto a procesar.
     * @param data Datos a utilizar para el reemplazo.
     * @returns Texto con las variables reemplazadas.
     */
    SectionJS.prototype.replaceText = function (text, data) {
        var _this = this;
        return text.replace(/{{(.*?)}}/g, function (_, clave) { return _this.getValue(data, clave) || ''; });
    };
    /**
     * Obtiene un valor de un objeto utilizando una clave en formato de ruta (ej: "user.name").
     * @param obj Objeto del cual obtener el valor.
     * @param key Clave en formato de ruta.
     * @returns El valor encontrado o una cadena vacía si no existe.
     */
    SectionJS.prototype.getValue = function (obj, key) {
        return key.split('.').reduce(function (value, k) { return (value && typeof value === 'object' ? value[k] : ''); }, obj);
    };
    /**
     * Actualiza los elementos de información (paginación, etc.).
     */
    SectionJS.prototype.updateInfo = function () {
        var _this = this;
        var _a, _b, _c;
        if (!this.articleContainer || !this.spanElements.length || !this.infoTemplates.length)
            return;
        var totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
        this.totalPages = totalPages;
        var itemsTotal = ((_c = this.data) === null || _c === void 0 ? void 0 : _c.length) || 0;
        this.itemsTotal = itemsTotal;
        var itemsNow = this.getPage(this.currentPage).length;
        this.itemsNow = itemsNow;
        var firstItemIndex = (this.currentPage - 1) * (this.limit || 0) + 1;
        this.firstItemIndex = firstItemIndex;
        var lastItemIndex = Math.min(firstItemIndex + (this.limit || 0) - 1, itemsTotal);
        this.lastItemIndex = lastItemIndex;
        // Seleccionar elementos "info" dentro de contenedores estáticos o fuera del contenedor principal
        var infoElements = __spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="info"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"info\"]"))), true).filter(function (element) { return element !== null; });
        // Actualizar el contenido de los elementos "info" usando sus propias plantillas
        infoElements.forEach(function (infoElement, index) {
            var templateElement = _this.infoTemplates ? _this.infoTemplates[index] : null;
            var template = templateElement ? templateElement.textContent : null;
            if (template) {
                infoElement.textContent = template
                    .replace('{{currentPage}}', _this.currentPage.toString())
                    .replace('{{totalPages}}', totalPages.toString())
                    .replace('{{itemsNow}}', itemsNow.toString())
                    .replace('{{itemsTotal}}', itemsTotal.toString())
                    .replace('{{firstItemIndex}}', firstItemIndex.toString())
                    .replace('{{lastItemIndex}}', lastItemIndex.toString());
            }
        });
    };
    /**
     * Actualiza el estado de los botones de paginación.
     */
    SectionJS.prototype.updateButtons = function () {
        var _this = this;
        var _a, _b;
        if (!this.articleContainer)
            return;
        var totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        var prevButtons = __spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"prev\"]"))), true).filter(function (button) { return button !== null; });
        var nextButtons = __spreadArray(__spreadArray([], Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')), true), Array.from(document.querySelectorAll("[data-target=\"".concat(this.articleContainer.id, "\"][data-action=\"next\"]"))), true).filter(function (button) { return button !== null; });
        // Actualizar el estado de los botones
        prevButtons.forEach(function (button) { return button.disabled = _this.currentPage === 1; });
        nextButtons.forEach(function (button) { return button.disabled = _this.currentPage === totalPages; });
    };
    /**
     * Refresca la sección en función de los cambios en los atributos.
     */
    SectionJS.prototype.refresh = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentAttributes, totalPages;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.articleContainer)
                            return [2 /*return*/];
                        currentAttributes = {
                            limit: this.limit,
                            order: this.order,
                            start: this.start,
                            orderBy: this.orderBy,
                            total: this.total,
                            defaultPage: this.defaultPage,
                            dataSourceURL: this.dataSourceURL,
                            findKey: this.findKey
                        };
                        this.updateAttrs();
                        if (!(currentAttributes.limit !== this.limit || currentAttributes.order !== this.order ||
                            currentAttributes.start !== this.start || currentAttributes.orderBy !== this.orderBy ||
                            currentAttributes.total !== this.total || currentAttributes.defaultPage !== this.defaultPage ||
                            currentAttributes.dataSourceURL !== this.dataSourceURL || currentAttributes.findKey !== this.findKey)) return [3 /*break*/, 5];
                        if (!(this.dataSourceURL && (currentAttributes.total !== this.total || currentAttributes.dataSourceURL !== this.dataSourceURL))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.load()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!(currentAttributes.findKey !== this.findKey)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.findKeyValue()];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        if (currentAttributes.defaultPage !== this.defaultPage) {
                            this.currentPage = this.defaultPage;
                        }
                        totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
                        this.currentPage = Math.min(this.currentPage, totalPages);
                        this.render(this.getPage(this.currentPage));
                        _c.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Navega entre las páginas.
     * @param action Acción a realizar ('prev' o 'next').
     */
    SectionJS.prototype.paginate = function (action) {
        if (!this.articleContainer || !this.data)
            return;
        var totalPages = Math.ceil(this.data.length / (this.limit || this.data.length));
        if (action === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        }
        else if (action === 'next' && this.currentPage < totalPages) {
            this.currentPage++;
        }
        this.render(this.getPage(this.currentPage));
    };
    /**
     * Agrega un listener para el evento 'sectionjs:getdata'.
     */
    SectionJS.prototype.addListener = function () {
        var _this = this;
        if (!this.articleContainer)
            return;
        this.articleContainer.addEventListener('sectionjs:getdata', function (event) {
            var customEvent = event;
            var data = customEvent.detail.data;
            var value = data && _this.data ? _this.getValue(_this.data, data) : _this.data;
            _this.articleContainer.dispatchEvent(new CustomEvent("sectionjs:getdata:".concat(data || 'all'), { detail: { value: value } }));
        });
    };
    /**
     * Inicializa todas las instancias de SectionJS en la página.
     */
    SectionJS.initAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var articleContainers, _i, articleContainers_1, articleContainer, section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        articleContainers = document.querySelectorAll('[data-section]');
                        if (articleContainers.length === 0) {
                            console.log("SectionJS: data-section no encontrado. SectionJS inactivo.");
                            return [2 /*return*/];
                        }
                        SectionJS.instances = [];
                        _i = 0, articleContainers_1 = articleContainers;
                        _a.label = 1;
                    case 1:
                        if (!(_i < articleContainers_1.length)) return [3 /*break*/, 4];
                        articleContainer = articleContainers_1[_i];
                        section = new SectionJS(articleContainer);
                        SectionJS.instances.push(section);
                        return [4 /*yield*/, section.initSelf()];
                    case 2:
                        _a.sent(); // Inicializar cada instancia individualmente
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        SectionJS.default = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Inicializa la instancia actual de SectionJS.
     */
    SectionJS.prototype.initSelf = function () {
        return __awaiter(this, void 0, void 0, function () {
            var totalPages, hasRenderedArticles, paginationContainer, prevButton, nextButton;
            var _this = this;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        //if (!this.articleContainer) return;
                        this.addListener();
                        return [4 /*yield*/, this.load()];
                    case 1:
                        _d.sent();
                        return [4 /*yield*/, this.findKeyValue()];
                    case 2:
                        _d.sent();
                        totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
                        this.currentPage = Math.min(this.currentPage, totalPages);
                        this.lastPage = totalPages;
                        this.dataTotal = ((_c = this.data) === null || _c === void 0 ? void 0 : _c.length) || 0;
                        hasRenderedArticles = this.articleContainer.hasAttribute('data-section-rendered');
                        if (!hasRenderedArticles) {
                            this.render(this.getPage(this.currentPage));
                        }
                        paginationContainer = document.querySelector("[data-target=\"".concat(this.articleContainer.id, "\"]"));
                        prevButton = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector('button[data-action="prev"]');
                        nextButton = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector('button[data-action="next"]');
                        if (prevButton)
                            prevButton.onclick = function () { return _this.paginate('prev'); };
                        if (nextButton)
                            nextButton.onclick = function () { return _this.paginate('next'); };
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aplica un cambio en un atributo del contenedor y refresca la sección.
     * @param containerId ID del contenedor.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    SectionJS.apply = function (containerId, attributeName, attributeValue) {
        return __awaiter(this, void 0, void 0, function () {
            var articleContainer, section, wasObserverActive, currentValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        articleContainer = document.getElementById(containerId);
                        if (!articleContainer) return [3 /*break*/, 3];
                        section = SectionJS.instances.find(function (instance) { return instance.articleContainer === articleContainer; });
                        if (!section) return [3 /*break*/, 3];
                        wasObserverActive = section.observerActive;
                        if (wasObserverActive) {
                            section.disableObserver(); // Desactivar el Observer solo si estaba activo
                        }
                        currentValue = section.articleContainer.getAttribute(attributeName);
                        if (!(currentValue !== attributeValue.toString())) return [3 /*break*/, 2];
                        section.articleContainer.setAttribute(attributeName, attributeValue.toString());
                        return [4 /*yield*/, section.refresh()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (wasObserverActive) {
                            section.enableObserver(); // Reactivar el Observer solo si estaba activo
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cambia un atributo del contenedor y refresca la sección.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    SectionJS.prototype.setAttribute = function (attributeName, attributeValue) {
        return __awaiter(this, void 0, void 0, function () {
            var wasObserverActive, currentValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wasObserverActive = this.observerActive;
                        if (wasObserverActive) {
                            this.disableObserver(); // Desactivar el Observer solo si estaba activo
                        }
                        currentValue = this.articleContainer.getAttribute(attributeName);
                        if (!(currentValue !== attributeValue.toString())) return [3 /*break*/, 2];
                        this.articleContainer.setAttribute(attributeName, attributeValue.toString());
                        return [4 /*yield*/, this.refresh()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (wasObserverActive) {
                            this.enableObserver(); // Reactivar el Observer solo si estaba activo
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    SectionJS.prototype.isRendered = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.articleContainer.addEventListener("sectionjs:rendered", function (e) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        //const customEvent = e as CustomEvent<{ pageData: any[] }>;
                        callback(this);
                        return [2 /*return*/];
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    // crear Funcion para detener initAll() si se a inicializado, y limpiar las instancias
    SectionJS.stopAll = function () {
        var a = document.querySelector("body[data-section-stop]");
        if (a)
            SectionJS.instances = [];
        return a;
    };
    // Lista de todas las instancias de SectionJS creadas
    SectionJS.instances = [];
    // Indica si el contenedor está renderizado
    SectionJS.default = false;
    return SectionJS;
}());
// agregar una funcion que detecte cuando este cargado el DOM, usando DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    var _a;
    (_a = SectionJS.stopAll()) !== null && _a !== void 0 ? _a : SectionJS.initAll();
});
