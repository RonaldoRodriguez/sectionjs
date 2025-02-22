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
/**
 * Obtiene datos de una URL.
 * @param {string} url La URL de la fuente de datos.
 * @returns {Promise<any>} Una promesa que resuelve con los datos.
 */
function fetchData(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, contentType, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Error: ".concat(response.status));
                    }
                    contentType = response.headers.get("Content-Type");
                    if (!(contentType && contentType.includes("application/json"))) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [4 /*yield*/, response.text()];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("Error al obtener datos:", error_1);
                    throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
* Carga los datos de una URL y los devuelve en formato JSON.
* @param {string} url La URL de la fuente de datos.
* @returns {Promise<any>} Una promesa que resuelve con los datos en formato JSON.
*/
function loadData(url) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchData(url)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error al cargar datos:", error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
* Función auxiliar para seleccionar elementos del DOM.
* @param {string} selector El selector CSS del elemento.
* @returns {Element} El elemento del DOM seleccionado.
*/
function selectElement(selector) {
    return document.querySelector(selector);
}
/**
* Función auxiliar para validar un atributo numérico.
* @param {string} value El valor del atributo.
* @param {string} attributeName El nombre del atributo.
* @returns {number|null} El valor numérico del atributo si es válido, o null si no lo es.
*/
function validateNumericAttribute(value, attributeName) {
    if (value === null || value === undefined || value === "") {
        return null; // Valor no especificado
    }
    var number = Number(value);
    if (isNaN(number)) {
        console.error("Error: El atributo ".concat(attributeName, " debe ser un n\u00FAmero."));
        return null; // Valor inválido
    }
    return number;
}
/**
* Obtiene las claves únicas de los placeholders en un texto.
* @param {string} text El texto que contiene los placeholders.
* @returns {string[]} Un array con las claves únicas de los placeholders.
*/
function getPlaceholderKeys(text) {
    var placeholders = text.match(/{{(.*?)}}/g);
    if (!placeholders)
        return [];
    return placeholders.map(function (placeholder) { return placeholder.replace('{{', '').replace('}}', ''); });
}
/**
* Obtiene el valor de una clave anidada en un objeto.
* @param {object} obj El objeto donde buscar la clave.
* @param {string} key La clave anidada (ej: 'login.uuid').
* @returns {any} El valor de la clave anidada, o una cadena vacía si no se encuentra.
*/
function getNestedValue(obj, key) {
    var keys = key.split('.');
    var value = obj;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var k = keys_1[_i];
        if (value && typeof value === 'object' && value[k] !== undefined && value[k] !== null) {
            value = value[k];
        }
        else {
            return '';
        }
    }
    return value;
}
/**
* Reemplaza los placeholders en un texto con los valores correspondientes.
* @param {string} text El texto con los placeholders.
* @param {object} data El objeto con los datos para reemplazar los placeholders.
* @returns {string} El texto con los placeholders reemplazados.
*/
function replacePlaceholders(text, data) {
    var result = text;
    getPlaceholderKeys(text).forEach(function (key) {
        var placeholder = "{{".concat(key, "}}");
        var value = getNestedValue(data, key);
        result = result.replace(placeholder, value);
    });
    return result;
}
/**
* Procesa los atributos de un elemento, reemplazando los placeholders.
* @param {Element} element El elemento cuyos atributos se procesarán.
* @param {object} data El objeto con los datos para reemplazar los placeholders.
*/
function processElementAttributes(element, data) {
    for (var i = 0; i < element.attributes.length; i++) {
        var attribute = element.attributes[i];
        element.setAttribute(attribute.name, replacePlaceholders(attribute.value, data));
    }
}
/**
* Procesa los nodos de texto de un elemento, reemplazando los placeholders.
* @param {Element} element El elemento cuyos nodos de texto se procesarán.
* @param {object} data El objeto con los datos para reemplazar los placeholders.
*/
function processTextNodes(element, data) {
    var textNodes = Array.from(element.childNodes).filter(function (node) { return node.nodeType === Node.TEXT_NODE; });
    textNodes.forEach(function (textNode) {
        textNode.textContent = replacePlaceholders(textNode.textContent, data);
    });
}
/**
* Asigna data-src a src para imágenes y otros elementos multimedia.
* @param {Element} element El elemento multimedia.
*/
function assignDataSrcToSrc(element) {
    if (element.tagName === 'IMG' || element.tagName === 'AUDIO' || element.tagName === 'VIDEO') {
        if (element.hasAttribute('data-src')) {
            element.setAttribute('src', element.dataset.src);
        }
    }
}
/**
* Renderiza los artículos en el contenedor.
* @param {Element} articleContainer El contenedor de los artículos.
* @param {Element} articleTemplate La plantilla del artículo.
* @param {Array<object>} pageData Los datos de la página actual.
*/
function renderArticles(articleContainer, articleTemplate, pageData) {
    articleContainer.innerHTML = "";
    // Ordenamiento local
    var localOrder = articleContainer.getAttribute('data-local-order');
    if (localOrder === 'asc') {
        pageData.sort(function (a, b) { return a.id - b.id; }); // Ordenar por id ascendente (ejemplo)
    }
    else if (localOrder === 'desc') {
        pageData.sort(function (a, b) { return b.id - a.id; }); // Ordenar por id descendente (ejemplo)
    }
    pageData.forEach(function (articleData) {
        var article = articleTemplate.cloneNode(true);
        var elements = article.querySelectorAll('*');
        elements.forEach(function (element) {
            processTextNodes(element, articleData);
            processElementAttributes(element, articleData);
            assignDataSrcToSrc(element);
        });
        articleContainer.appendChild(article);
    });
}
/**
* Función principal que inicializa SectionJS y renderiza los templates.
*/
function initializeSectionJS() {
    return __awaiter(this, void 0, void 0, function () {
        var articleContainers, _loop_1, _i, articleContainers_1, articleContainer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    articleContainers = document.querySelectorAll('[data-section]');
                    _loop_1 = function (articleContainer) {
                        function getPageData(page) {
                            if (page === void 0) { page = currentPage; }
                            var startIndex, endIndex;
                            if (orderDirection === 'desc') {
                                startIndex = (page - 1) * pageSize + start; // Corregido: startIndex se calcula correctamente
                                endIndex = startIndex + pageSize; // Corregido: endIndex se calcula correctamente
                                startIndex = Math.max(0, startIndex);
                                endIndex = Math.min(data_1.length, endIndex);
                            }
                            else {
                                startIndex = (page - 1) * pageSize + start;
                                endIndex = startIndex + pageSize;
                                if (limit !== null && limit > 0) {
                                    endIndex = Math.min(endIndex, startIndex + limit);
                                }
                            }
                            if (total !== null) {
                                endIndex = Math.min(endIndex, total);
                            }
                            return data_1.slice(startIndex, endIndex);
                        }
                        function getTotalPages() {
                            if (limit === null || limit === 0) {
                                return 1;
                            }
                            return Math.ceil(data_1.length / pageSize);
                        }
                        function managePaginationButtons() {
                            if (!previousButton_1 || !nextButton_1)
                                return;
                            var totalPages = getTotalPages();
                            previousButton_1.disabled = currentPage === 1;
                            nextButton_1.disabled = currentPage === totalPages;
                            if (totalPages <= 1) {
                                previousButton_1.style.display = 'none';
                                nextButton_1.style.display = 'none';
                            }
                            else {
                                previousButton_1.style.display = 'block';
                                nextButton_1.style.display = 'block';
                            }
                            if (pageInfo_1) {
                                pageInfo_1.textContent = "".concat(currentPage, "/").concat(totalPages);
                            }
                        }
                        function handlePreviousButtonClick() {
                            if (currentPage > 1) {
                                currentPage--;
                                renderArticles(articleContainer, articleTemplate, getPageData(currentPage));
                                managePaginationButtons();
                            }
                        }
                        function handleNextButtonClick() {
                            if (currentPage < getTotalPages()) {
                                currentPage++;
                                renderArticles(articleContainer, articleTemplate, getPageData(currentPage));
                                managePaginationButtons();
                            }
                        }
                        var articleTemplate, dataSourceURL, limit, order, start, orderBy, total, defaultPage, orderDirection, pageSize, currentPage, data_1, paginationContainer, dataTarget, previousButton_1, pageInfo_1, nextButton_1, error_3;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    articleTemplate = articleContainer === null || articleContainer === void 0 ? void 0 : articleContainer.firstElementChild;
                                    dataSourceURL = articleContainer === null || articleContainer === void 0 ? void 0 : articleContainer.getAttribute('data-section');
                                    limit = validateNumericAttribute(articleContainer.getAttribute('data-limit'), 'data-limit');
                                    limit = limit !== null && limit >= 0 ? (limit === 0 ? null : limit) : null;
                                    order = articleContainer.getAttribute('data-order') || 'ASC';
                                    start = validateNumericAttribute(articleContainer.getAttribute('data-start'), 'data-start') || 0;
                                    orderBy = articleContainer.getAttribute('data-by');
                                    total = validateNumericAttribute(articleContainer.getAttribute('data-total'), 'data-total');
                                    total = total !== null && total >= 0 ? total : null;
                                    defaultPage = Math.max(1, (validateNumericAttribute(articleContainer.getAttribute('data-default-page'), 'data-default-page') || 1));
                                    if (!articleTemplate || !dataSourceURL || !articleContainer) {
                                        console.error("Elementos DOM no encontrados.");
                                        return [2 /*return*/, "continue"];
                                    }
                                    orderDirection = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
                                    currentPage = defaultPage;
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, loadData(dataSourceURL)];
                                case 2:
                                    data_1 = _b.sent();
                                    if (!data_1 || !Array.isArray(data_1)) {
                                        throw new Error("Datos de base de datos inválidos.");
                                    }
                                    // Aplicar data-total si está presente
                                    if (total !== null) {
                                        if (total === 0) {
                                            articleContainer.innerHTML = "<p>No hay datos disponibles.</p>";
                                            return [2 /*return*/, "continue"];
                                        }
                                        data_1 = data_1.slice(0, total);
                                    }
                                    // Ordenamiento inicial
                                    if (orderBy) {
                                        data_1.sort(function (a, b) {
                                            var aValue = a[orderBy];
                                            var bValue = b[orderBy];
                                            if (orderDirection === 'asc') {
                                                return aValue > bValue ? 1 : -1;
                                            }
                                            else {
                                                return aValue < bValue ? 1 : -1;
                                            }
                                        });
                                    }
                                    else if (orderDirection === 'desc') {
                                        data_1.reverse(); // Invertir si no hay data-by
                                    }
                                    //pageSize = limit !== null && limit > 0 ? limit : data.length;
                                    //pageSize = Math.min(pageSize, data.length);
                                    pageSize = limit !== null && limit > 0 ? limit : data_1.length;
                                    currentPage = Math.min(defaultPage, getTotalPages());
                                    renderArticles(articleContainer, articleTemplate, getPageData(currentPage));
                                    paginationContainer = articleContainer.previousElementSibling;
                                    dataTarget = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.getAttribute('data-target');
                                    // Validar data-target
                                    if (!dataTarget || dataTarget !== articleContainer.id) {
                                        console.warn("Advertencia: El contenedor de paginaci\u00F3n anterior al contenedor de art\u00EDculos \"".concat(articleContainer.id, "\" no tiene un data-target v\u00E1lido. Se ignorar\u00E1 la paginaci\u00F3n."));
                                        return [2 /*return*/, "continue"];
                                    }
                                    previousButton_1 = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector("button[data-action=\"prev\"]");
                                    pageInfo_1 = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector("span[data-action=\"info\"]");
                                    nextButton_1 = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector("button[data-action=\"next\"]");
                                    if (previousButton_1) {
                                        previousButton_1.addEventListener("click", handlePreviousButtonClick);
                                    }
                                    if (nextButton_1) {
                                        nextButton_1.addEventListener("click", handleNextButtonClick);
                                    }
                                    managePaginationButtons();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_3 = _b.sent();
                                    console.error("Error en la función initializeSectionJS:", error_3);
                                    articleContainer.innerHTML = "<p>Error al cargar datos.</p>";
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, articleContainers_1 = articleContainers;
                    _a.label = 1;
                case 1:
                    if (!(_i < articleContainers_1.length)) return [3 /*break*/, 4];
                    articleContainer = articleContainers_1[_i];
                    return [5 /*yield**/, _loop_1(articleContainer)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", function () {
    initializeSectionJS();
});
