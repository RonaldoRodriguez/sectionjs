"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class SectionJS {
    /**
     * Constructor de la clase SectionJS.
     * @param articleContainer Contenedor HTML donde se renderizarán los datos.
     * @throws Error si el contenedor no es válido.
     */
    constructor(articleContainer) {
        // Plantilla para renderizar cada artículo
        this.articleTemplate = null;
        // Plantillas para los elementos de información (paginación, etc.)
        this.infoTemplates = null;
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
        this.spanElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-action="info"], [data-section-action="info"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="info"], [data-target="${this.articleContainer.id}"][data-section-action="info"]`)),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"]`)).flatMap(container => Array.from(container.querySelectorAll('[data-action="info"], [data-section-action="info"]')))
        ];
        // Guardar una copia de cada elemento "info" como plantilla
        this.infoTemplates = this.spanElements.map(element => element.cloneNode(true));
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
        // No activar el Observer por defecto
    }
    /**
     * Activa el MutationObserver para detectar cambios en los atributos del contenedor.
     */
    enableObserver() {
        if (this.observerActive)
            return;
        const attributesToObserve = [
            'data-find', 'data-limit', 'data-order', 'data-start', 'data-by',
            'data-total', 'data-default-page', 'data-response-path', 'data-section'
        ];
        this.observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName) {
                    this.handleAttrChange(mutation.attributeName);
                }
            }
        });
        this.observer.observe(this.articleContainer, {
            attributes: true,
            attributeFilter: attributesToObserve,
            subtree: false
        });
        this.observerActive = true;
    }
    /**
     * Desactiva el MutationObserver.
     */
    disableObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            this.observerActive = false;
        }
    }
    /**
     * Maneja cambios en los atributos detectados por el MutationObserver.
     * @param attributeName Nombre del atributo que cambió.
     */
    handleAttrChange(attributeName) {
        this.refresh(); // Simplemente refrescamos la sección
    }
    /**
     * Valida que un valor sea un número válido.
     * @param value Valor a validar.
     * @param attributeName Nombre del atributo (para mensajes de error).
     * @returns El número validado o null si no es válido.
     */
    validateNumber(value, attributeName) {
        if (value === null || value === undefined || value === "")
            return null;
        const number = Number(value);
        if (isNaN(number)) {
            console.error(`Error: El atributo ${attributeName} debe ser un número.`);
            return null;
        }
        return number;
    }
    /**
     * Carga los datos desde la fuente especificada en dataSourceURL.
     * @returns Los datos cargados.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.dataSourceURL)
                return null;
            try {
                const response = yield fetch(this.dataSourceURL);
                if (!response.ok)
                    throw new Error(`Error: ${response.status}`);
                const contentType = response.headers.get("Content-Type");
                if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json")) {
                    const fullJsonData = yield response.json();
                    let filteredJsonData = this.responsePath ? this.getValue(fullJsonData, this.responsePath) : fullJsonData;
                    this.data = Array.isArray(filteredJsonData) ? filteredJsonData : [filteredJsonData];
                    this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:datachanged', { detail: { data: this.data } }));
                    return fullJsonData;
                }
                else {
                    const textData = yield response.text();
                    this.data = [textData];
                    return textData;
                }
            }
            catch (error) {
                console.error(error);
                this.articleContainer.innerHTML = "<p>Error al cargar datos.</p>";
                throw error;
            }
        });
    }
    /**
     * Busca un valor específico en los datos cargados.
     * @param fullData Datos completos (opcional, si no se proporciona, se cargan automáticamente).
     */
    findKeyValue() {
        return __awaiter(this, arguments, void 0, function* (fullData = null) {
            if (!this.articleContainer)
                return;
            const findKey = this.articleContainer.getAttribute('data-find');
            const defaultValue = this.articleContainer.getAttribute('data-find-default') || 'none';
            try {
                if (!fullData)
                    fullData = yield this.load();
                if (findKey) {
                    const value = this.getValue(fullData, findKey) || defaultValue;
                    this.articleContainer.setAttribute('data-find-value', value);
                }
            }
            catch (error) {
                console.error("Error en findValue:", error);
            }
        });
    }
    /**
     * Actualiza los atributos de la instancia en función del contenedor.
     */
    updateAttrs() {
        this.dataSourceURL = this.articleContainer.getAttribute('data-section');
        this.limit = this.validateNumber(this.articleContainer.getAttribute('data-limit'), 'data-limit');
        this.order = this.articleContainer.getAttribute('data-order') || 'ASC';
        this.start = this.validateNumber(this.articleContainer.getAttribute('data-start'), 'data-start') || 0;
        this.orderBy = this.articleContainer.getAttribute('data-by');
        this.total = this.validateNumber(this.articleContainer.getAttribute('data-total'), 'data-total');
        this.defaultPage = Math.max(1, this.validateNumber(this.articleContainer.getAttribute('data-default-page'), 'data-default-page') || 1);
        this.responsePath = this.articleContainer.getAttribute('data-response-path');
        this.findKey = this.articleContainer.getAttribute('data-find');
    }
    /**
     * Obtiene los datos de una página específica.
     * @param page Número de la página.
     * @returns Los datos de la página.
     */
    getPage(page) {
        var _a, _b;
        if (!this.data)
            return [];
        let dataToUse = this.data;
        // Ordenar los datos si se especifica un orden
        if (Array.isArray(dataToUse) && this.orderBy) {
            dataToUse = dataToUse.slice().sort((a, b) => {
                const valueA = this.getValue(a, this.orderBy);
                const valueB = this.getValue(b, this.orderBy);
                return this.order.toLowerCase() === 'asc' ? (valueA < valueB ? -1 : 1) : (valueA > valueB ? -1 : 1);
            });
        }
        // Calcular índices de la página
        const pageSize = (_a = this.limit) !== null && _a !== void 0 ? _a : dataToUse.length;
        const startIndex = (page - 1) * pageSize + this.start;
        const endIndex = Math.min(startIndex + pageSize, (_b = this.total) !== null && _b !== void 0 ? _b : dataToUse.length);
        return dataToUse.slice(startIndex, endIndex);
    }
    /**
     * Renderiza los datos en el contenedor.
     * @param pageData Datos de la página a renderizar.
     */
    render(pageData) {
        if (!this.articleContainer)
            return;
        const elementosOrdenados = [];
        let plantilla = null;
        // Desactivar temporalmente el observer
        const wasObserverActive = this.observerActive;
        if (wasObserverActive) {
            this.disableObserver();
        }
        // Recorrer los elementos hijos del contenedor
        Array.from(this.articleContainer.children).forEach((elemento) => {
            var _a;
            const element = elemento;
            // Si el elemento es estático, lo agregamos al array de elementos ordenados
            if (element.hasAttribute('data-section-static')) {
                elementosOrdenados.push(element);
                element.remove(); // Lo removemos temporalmente del contenedor
            }
            // Si el elemento es candidato a plantilla (el primero que no es estático o tiene data-section-render)
            else if (element.hasAttribute('data-section-render') || !plantilla) {
                if (!plantilla) {
                    plantilla = element;
                    this.articleTemplate = (_a = this.articleTemplate) !== null && _a !== void 0 ? _a : plantilla;
                    if (!this.articleTemplate || !(this.articleTemplate instanceof HTMLElement)) {
                        throw new Error("No se pudo encontrar una plantilla válida en el contenedor.");
                    }
                    // Renderizar los datos usando la plantilla
                    pageData.forEach((articleData) => {
                        const elementoRenderizado = this.articleTemplate.cloneNode(true);
                        elementoRenderizado.querySelectorAll('*').forEach((el) => {
                            this.processText(el, articleData);
                            this.processAttrs(el, articleData);
                            this.assignSrc(el);
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
        elementosOrdenados.forEach(elemento => this.articleContainer.appendChild(elemento));
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
        this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:rendered', { detail: { pageData } }));
    }
    /**
     * Reconecta los botones de paginación.
     */
    reconnectButtons() {
        if (!this.articleContainer)
            return;
        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="prev"]`))
        ].filter(button => button !== null);
        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="next"]`))
        ].filter(button => button !== null);
        // Asignar eventos a los botones
        prevButtons.forEach(button => button.onclick = () => this.paginate('prev'));
        nextButtons.forEach(button => button.onclick = () => this.paginate('next'));
    }
    /**
     * Procesa el texto de un elemento y reemplaza las variables con los datos.
     * @param element Elemento a procesar.
     * @param data Datos a utilizar para el reemplazo.
     */
    processText(element, data) {
        Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .forEach(textNode => {
            textNode.textContent = this.replaceText(textNode.textContent || '', data);
        });
    }
    /**
     * Procesa los atributos de un elemento y reemplaza las variables con los datos.
     * @param element Elemento a procesar.
     * @param data Datos a utilizar para el reemplazo.
     */
    processAttrs(element, data) {
        Array.from(element.attributes).forEach(attr => {
            element.setAttribute(attr.name, this.replaceText(attr.value, data));
        });
    }
    /**
     * Asigna el atributo `src` a elementos multimedia (img, audio, video) si tienen `data-src`.
     * @param element Elemento a procesar.
     */
    assignSrc(element) {
        if (['IMG', 'AUDIO', 'VIDEO'].includes(element.tagName) && element.hasAttribute('data-src')) {
            element.setAttribute('src', element.getAttribute('data-src'));
        }
    }
    /**
     * Reemplaza las variables en un texto con los valores correspondientes de los datos.
     * @param text Texto a procesar.
     * @param data Datos a utilizar para el reemplazo.
     * @returns Texto con las variables reemplazadas.
     */
    replaceText(text, data) {
        return text.replace(/{{(.*?)}}/g, (_, clave) => this.getValue(data, clave) || '');
    }
    /**
     * Obtiene un valor de un objeto utilizando una clave en formato de ruta (ej: "user.name").
     * @param obj Objeto del cual obtener el valor.
     * @param key Clave en formato de ruta.
     * @returns El valor encontrado o una cadena vacía si no existe.
     */
    getValue(obj, key) {
        return key.split('.').reduce((value, k) => (value && typeof value === 'object' ? value[k] : ''), obj);
    }
    /**
     * Actualiza los elementos de información (paginación, etc.).
     */
    updateInfo() {
        var _a, _b, _c;
        if (!this.articleContainer || !this.spanElements.length || !this.infoTemplates.length)
            return;
        const totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
        const itemsTotal = ((_c = this.data) === null || _c === void 0 ? void 0 : _c.length) || 0;
        const itemsNow = this.getPage(this.currentPage).length;
        const firstItemIndex = (this.currentPage - 1) * (this.limit || 0) + 1;
        const lastItemIndex = Math.min(firstItemIndex + (this.limit || 0) - 1, itemsTotal);
        // Seleccionar elementos "info" dentro de contenedores estáticos o fuera del contenedor principal
        const infoElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="info"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="info"]`))
        ].filter(element => element !== null);
        // Actualizar el contenido de los elementos "info" usando sus propias plantillas
        infoElements.forEach((infoElement, index) => {
            const templateElement = this.infoTemplates ? this.infoTemplates[index] : null;
            const template = templateElement ? templateElement.textContent : null;
            if (template) {
                infoElement.textContent = template
                    .replace('{{pageNow}}', this.currentPage.toString())
                    .replace('{{totalPages}}', totalPages.toString())
                    .replace('{{itemsNow}}', itemsNow.toString())
                    .replace('{{itemsTotal}}', itemsTotal.toString())
                    .replace('{{firstItemIndex}}', firstItemIndex.toString())
                    .replace('{{lastItemIndex}}', lastItemIndex.toString());
            }
        });
    }
    /**
     * Actualiza el estado de los botones de paginación.
     */
    updateButtons() {
        var _a, _b;
        if (!this.articleContainer)
            return;
        const totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="prev"]`))
        ].filter(button => button !== null);
        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="next"]`))
        ].filter(button => button !== null);
        // Actualizar el estado de los botones
        prevButtons.forEach(button => button.disabled = this.currentPage === 1);
        nextButtons.forEach(button => button.disabled = this.currentPage === totalPages);
    }
    /**
     * Refresca la sección en función de los cambios en los atributos.
     */
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.articleContainer)
                return;
            const currentAttributes = {
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
            if (currentAttributes.limit !== this.limit || currentAttributes.order !== this.order ||
                currentAttributes.start !== this.start || currentAttributes.orderBy !== this.orderBy ||
                currentAttributes.total !== this.total || currentAttributes.defaultPage !== this.defaultPage ||
                currentAttributes.dataSourceURL !== this.dataSourceURL || currentAttributes.findKey !== this.findKey) {
                if (this.dataSourceURL && (currentAttributes.total !== this.total || currentAttributes.dataSourceURL !== this.dataSourceURL)) {
                    yield this.load();
                }
                if (currentAttributes.findKey !== this.findKey) {
                    yield this.findKeyValue();
                }
                if (currentAttributes.defaultPage !== this.defaultPage) {
                    this.currentPage = this.defaultPage;
                }
                const totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
                this.currentPage = Math.min(this.currentPage, totalPages);
                this.render(this.getPage(this.currentPage));
            }
        });
    }
    /**
     * Navega entre las páginas.
     * @param action Acción a realizar ('prev' o 'next').
     */
    paginate(action) {
        if (!this.articleContainer || !this.data)
            return;
        const totalPages = Math.ceil(this.data.length / (this.limit || this.data.length));
        if (action === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        }
        else if (action === 'next' && this.currentPage < totalPages) {
            this.currentPage++;
        }
        this.render(this.getPage(this.currentPage));
    }
    /**
     * Agrega un listener para el evento 'sectionjs:getdata'.
     */
    addListener() {
        if (!this.articleContainer)
            return;
        this.articleContainer.addEventListener('sectionjs:getdata', (event) => {
            const customEvent = event;
            const data = customEvent.detail.data;
            const value = data && this.data ? this.getValue(this.data, data) : this.data;
            this.articleContainer.dispatchEvent(new CustomEvent(`sectionjs:getdata:${data || 'all'}`, { detail: { value } }));
        });
    }
    /**
     * Inicializa todas las instancias de SectionJS en la página.
     */
    static initAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const articleContainers = document.querySelectorAll('[data-section]');
            if (articleContainers.length === 0) {
                console.log("SectionJS: data-section no encontrado. SectionJS inactivo.");
                return;
            }
            SectionJS.instances = [];
            for (const articleContainer of articleContainers) {
                const section = new SectionJS(articleContainer);
                SectionJS.instances.push(section);
                yield section.initSelf(); // Inicializar cada instancia individualmente
            }
        });
    }
    /**
     * Inicializa la instancia actual de SectionJS.
     */
    initSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.addListener();
            yield this.load();
            yield this.findKeyValue();
            const totalPages = Math.ceil((((_a = this.data) === null || _a === void 0 ? void 0 : _a.length) || 0) / (this.limit || ((_b = this.data) === null || _b === void 0 ? void 0 : _b.length) || 1));
            this.currentPage = Math.min(this.currentPage, totalPages);
            // Verificar si los artículos ya están renderizados
            const hasRenderedArticles = this.articleContainer.hasAttribute('data-section-rendered');
            if (!hasRenderedArticles) {
                this.render(this.getPage(this.currentPage));
            }
            // Reconectar botones de paginación
            const paginationContainer = document.querySelector(`[data-target="${this.articleContainer.id}"]`);
            const prevButton = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector('button[data-action="prev"]');
            const nextButton = paginationContainer === null || paginationContainer === void 0 ? void 0 : paginationContainer.querySelector('button[data-action="next"]');
            if (prevButton)
                prevButton.onclick = () => this.paginate('prev');
            if (nextButton)
                nextButton.onclick = () => this.paginate('next');
        });
    }
    /**
     * Aplica un cambio en un atributo del contenedor y refresca la sección.
     * @param containerId ID del contenedor.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    static apply(containerId, attributeName, attributeValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const articleContainer = document.getElementById(containerId);
            if (articleContainer) {
                const section = SectionJS.instances.find(instance => instance.articleContainer === articleContainer);
                if (section) {
                    const wasObserverActive = section.observerActive; // Guardar el estado del Observer
                    if (wasObserverActive) {
                        section.disableObserver(); // Desactivar el Observer solo si estaba activo
                    }
                    const currentValue = section.articleContainer.getAttribute(attributeName);
                    if (currentValue !== attributeValue.toString()) {
                        section.articleContainer.setAttribute(attributeName, attributeValue.toString());
                        yield section.refresh();
                    }
                    if (wasObserverActive) {
                        section.enableObserver(); // Reactivar el Observer solo si estaba activo
                    }
                }
            }
        });
    }
    /**
     * Cambia un atributo del contenedor y refresca la sección.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    setAttribute(attributeName, attributeValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const wasObserverActive = this.observerActive; // Guardar el estado del Observer
            if (wasObserverActive) {
                this.disableObserver(); // Desactivar el Observer solo si estaba activo
            }
            const currentValue = this.articleContainer.getAttribute(attributeName);
            if (currentValue !== attributeValue.toString()) {
                this.articleContainer.setAttribute(attributeName, attributeValue.toString());
                yield this.refresh();
            }
            if (wasObserverActive) {
                this.enableObserver(); // Reactivar el Observer solo si estaba activo
            }
        });
    }
}
// Lista de todas las instancias de SectionJS creadas
SectionJS.instances = [];
