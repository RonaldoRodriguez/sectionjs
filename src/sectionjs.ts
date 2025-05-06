interface BaseEventDetail {
    sectionId: string;
    timestamp: number;
}

interface GetDataEventDetail extends BaseEventDetail {
    key: string;
    query?: any;
}

interface DataResponseEventDetail<T> extends BaseEventDetail {
    data: T;
}

interface RenderEventDetail extends BaseEventDetail {
    pageData: any[];
    renderedElements: Element[];
    templateUsed: Element;
}

interface ErrorEventDetail extends BaseEventDetail {
    error: unknown;
    message: string;
    stack?: string;
}


class SectionJS {
    
    public static instances: SectionJS[] = [];
    private articleContainer: HTMLElement;
    public name: string | null = null;
    private articleTemplate: Element | null = null;
    private infoTemplates: Element[] | null = null;
    private spanElements: Element[];
    private dataSourceURL: string | null;
    private limit: number | null;
    private order: string;
    private start: number;
    private orderBy: string | null;
    private total: number | null;
    public dataTotal: number = 0;
    public totalPages: number = 0;
    public itemsTotal: number = 0;
    public itemsNow: number = 0;
    private defaultPage: number;
    public firstItemIndex: number = 0;
    public lastItemIndex: number = 0;
    private currentPage: number;
    public lastPage: number = 0;
    private data: any[] | null = null;
    private responsePath: string | null;
    private findKey: string | null;
    private observer: MutationObserver | null = null;
    private observerActive: boolean = false;
    private create_id: string[] = [];


    /**
     * Constructor de la clase SectionJS.
     * @param articleContainer Contenedor HTML donde se renderizarán los datos.
     * @throws Error si el contenedor no es válido.
     */
    constructor(articleContainer: HTMLElement) {
        if (!articleContainer) {
            throw new Error("El contenedor proporcionado no es un elemento válido.");
        }

        this.articleContainer = articleContainer;

        // Inicializar elementos "info" y guardar sus plantillas
        this.spanElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-action="info"], [data-section-action="info"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="info"], [data-target="${this.articleContainer.id}"][data-section-action="info"]`)),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"]`)).flatMap(container =>
                Array.from(container.querySelectorAll('[data-action="info"], [data-section-action="info"]'))
            )
        ];

        // Guardar una copia de cada elemento "info" como plantilla
        this.infoTemplates = this.spanElements.map(element => element.cloneNode(true) as Element);

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
        /*comprobar que el id exista, y si no, generar un nuevo id*/
        this.name = articleContainer.id && articleContainer.id.trim() !== '' ? articleContainer.id : this.generateId();

        // No activar el Observer por defecto
    }

    public generateId() {
        // primero, verificamos si existe o no el id, si existe generamos uno nuevo, y volvemos a comprobar,
        // y si no existe lo agregamos al array, y lo retornamos:

        let id = `section-${Math.random().toString(36).substring(2, 11)}`;
        if (this.create_id.includes(id)) {
            return this.generateId();
        } else {
            this.create_id.push(id);
            return id;
        }
    }

    /**
     * Activa el MutationObserver para detectar cambios en los atributos del contenedor.
     */
    public enableObserver(): void {
        if (this.observerActive) return;

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
    public disableObserver(): void {
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
    private handleAttrChange(attributeName: string): void {
        this.refresh(); // Simplemente refrescamos la sección
    }

    /**
     * Valida que un valor sea un número válido.
     * @param value Valor a validar.
     * @param attributeName Nombre del atributo (para mensajes de error).
     * @returns El número validado o null si no es válido.
     */
    private validateNumber(value: string | null | undefined, attributeName: string): number | null {
        if (value === null || value === undefined || value === "") return null;
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
    private async load(): Promise<any> {
        if (!this.dataSourceURL) return null;
    
        try {
            if (this.dataSourceURL.trim().startsWith('[') || this.dataSourceURL.trim().startsWith('{')) {
                const inlineData = JSON.parse(this.dataSourceURL);
                this.data = Array.isArray(inlineData) ? inlineData : [inlineData];
                this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:datachanged', { detail: { data: this.data } }));
                return inlineData;
            } else {
                const response = await fetch(this.dataSourceURL);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const contentType = response.headers.get("Content-Type");
    
                if (contentType?.includes("application/json")) {
                    const fullJsonData = await response.json();
                    let filteredJsonData = this.responsePath ? this.getValue(fullJsonData, this.responsePath) : fullJsonData;
                    this.data = Array.isArray(filteredJsonData) ? filteredJsonData : [filteredJsonData];
                    this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:datachanged', { detail: { data: this.data } }));
                    return fullJsonData;
                } else {
                    const textData = await response.text();
                    this.data = [textData];
                    return textData;
                }
            }
        } catch (error) {
            this.articleContainer.dispatchEvent(
                new CustomEvent('sectionjs:error', {
                    detail: {
                        error: error,
                        message: "Error al cargar datos",
                        sectionId: this.articleContainer.id
                    }
                })
            );
            throw error;
        }
    }

    /**
     * Busca un valor específico en los datos cargados.
     * @param fullData Datos completos (opcional, si no se proporciona, se cargan automáticamente).
     */
    private async findKeyValue(fullData: any = null): Promise<void> {
        if (!this.articleContainer) return;
        const findKey = this.articleContainer.getAttribute('data-find');
        const defaultValue = this.articleContainer.getAttribute('data-find-default') || 'none';

        try {
            if (!fullData) fullData = await this.load();
            if (findKey) {
                const value = this.getValue(fullData, findKey) || defaultValue;
                this.articleContainer.setAttribute('data-find-value', value);
            }
        } catch (error) {
            console.error("Error en findValue:", error);
        }
    }

    /**
     * Actualiza los atributos de la instancia en función del contenedor.
     */
    private updateAttrs(): void {
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
    private getPage(page: number): any[] {
        if (!this.data) return [];
        let dataToUse = this.data;

        // Ordenar los datos si se especifica un orden
        if (Array.isArray(dataToUse) && this.orderBy) {
            dataToUse = dataToUse.slice().sort((a, b) => {
                const valueA = this.getValue(a, this.orderBy!);
                const valueB = this.getValue(b, this.orderBy!);
                return this.order.toLowerCase() === 'asc' ? (valueA < valueB ? -1 : 1) : (valueA > valueB ? -1 : 1);
            });
        }

        // Calcular índices de la página
        const pageSize = this.limit ?? dataToUse.length;
        const startIndex = (page - 1) * pageSize + this.start;
        const endIndex = Math.min(startIndex + pageSize, this.total ?? dataToUse.length);

        return dataToUse.slice(startIndex, endIndex);
    }

    /**
     * Renderiza los datos en el contenedor.
     * @param pageData Datos de la página a renderizar.
     */
    private render(pageData: any[]): void {
        if (!this.articleContainer) return;

        const elementosOrdenados: Element[] = [];
        let plantilla: Element | null = null;

        // Desactivar temporalmente el observer
        const wasObserverActive = this.observerActive;
        if (wasObserverActive) {
            this.disableObserver();
        }

        // Recorrer los elementos hijos del contenedor
        Array.from(this.articleContainer.children).forEach((elemento) => {
            const element = elemento as HTMLElement;

            // Si el elemento es estático, lo agregamos al array de elementos ordenados
            if (element.hasAttribute('data-section-static')) {
                elementosOrdenados.push(element);
                element.remove(); // Lo removemos temporalmente del contenedor
            }
            // Si el elemento es candidato a plantilla (el primero que no es estático o tiene data-section-render)
            else if (element.hasAttribute('data-section-render') || !plantilla) {
                if (!plantilla) {
                    plantilla = element;
                    this.articleTemplate = this.articleTemplate ?? plantilla;

                    if (!this.articleTemplate || !(this.articleTemplate instanceof HTMLElement)) {
                        throw new Error("No se pudo encontrar una plantilla válida en el contenedor.");
                    }

                    // Renderizar los datos usando la plantilla
                    pageData.forEach((articleData: any) => {
                        const elementoRenderizado = this.articleTemplate!.cloneNode(true) as HTMLElement;
                        elementoRenderizado.querySelectorAll('*').forEach((el: Element) => {
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

        // Disparar evento de renderizado con los elementos correctos
        this.articleContainer.dispatchEvent(
            new CustomEvent('sectionjs:rendered', {
                detail: {
                    pageData,
                    renderedElements: elementosOrdenados.filter(el => !el.hasAttribute('data-section-static')), // Solo elementos dinámicos
                    templateUsed: this.articleTemplate!
                }
            })
        );
    }

    /**
     * Reconecta los botones de paginación.
     */
    private reconnectButtons(): void {
        if (!this.articleContainer) return;

        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="prev"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];

        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="next"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];

        // Asignar eventos a los botones
        prevButtons.forEach(button => button.onclick = () => this.paginate('prev'));
        nextButtons.forEach(button => button.onclick = () => this.paginate('next'));
    }

    /**
     * Procesa el texto de un elemento y reemplaza las variables con los datos.
     * @param element Elemento a procesar.
     * @param data Datos a utilizar para el reemplazo.
     */
    private processText(element: Element, data: any): void {
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
    private processAttrs(element: Element, data: any): void {
        Array.from(element.attributes).forEach(attr => {
            element.setAttribute(attr.name, this.replaceText(attr.value, data));
        });
    }

    /**
     * Asigna el atributo `src` a elementos multimedia (img, audio, video) si tienen `data-src`.
     * @param element Elemento a procesar.
     */
    private assignSrc(element: Element): void {
        if (['IMG', 'AUDIO', 'VIDEO'].includes(element.tagName) && element.hasAttribute('data-src')) {
            element.setAttribute('src', element.getAttribute('data-src')!);
        }
    }

    /**
     * Reemplaza las variables en un texto con los valores correspondientes de los datos.
     * @param text Texto a procesar.
     * @param data Datos a utilizar para el reemplazo.
     * @returns Texto con las variables reemplazadas.
     */
    private replaceText(text: string, data: any): string {
        return text.replace(/{{\s*([^}]+?)\s*}}/g, (_, clave) => {
            return this.getValue(data, clave.trim()) || '';
        });
    }

    /**
     * Obtiene un valor de un objeto utilizando una clave en formato de ruta (ej: "user.name").
     * @param obj Objeto del cual obtener el valor.
     * @param key Clave en formato de ruta.
     * @returns El valor encontrado o una cadena vacía si no existe.
     */
    private getValue(obj: any, key: string): any {
        return key.split('.').reduce((value, k) => (value && typeof value === 'object' ? value[k] : ''), obj);
    }

    /**
     * Actualiza los elementos de información (paginación, etc.).
     */
    private updateInfo(): void {
        if (!this.articleContainer || !this.spanElements.length || !(this.infoTemplates as Element[]).length) return;

        const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));
        this.totalPages = totalPages;
        const itemsTotal = this.data?.length || 0;
        this.itemsTotal = itemsTotal;
        const itemsNow = this.getPage(this.currentPage).length;
        this.itemsNow = itemsNow;

        const firstItemIndex = (this.currentPage - 1) * (this.limit || 0) + 1;
        this.firstItemIndex = firstItemIndex;
        const lastItemIndex = Math.min(firstItemIndex + (this.limit || 0) - 1, itemsTotal);
        this.lastItemIndex = lastItemIndex;

        const infoVariables = {
            currentPage: this.currentPage,
            totalPages: totalPages,
            itemsNow: itemsNow,
            itemsTotal: itemsTotal,
            firstItemIndex: firstItemIndex,
            lastItemIndex: lastItemIndex,
            dataTotal: this.dataTotal
        };

        const infoElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="info"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="info"]`))
        ].filter(element => element !== null) as HTMLElement[];

        infoElements.forEach((infoElement, index) => {
            const template = this.infoTemplates![index].textContent || '';
            infoElement.textContent = this.replaceText(template, infoVariables);
        });
    }
    /**
     * Actualiza el estado de los botones de paginación.
     */
    private updateButtons(): void {
        if (!this.articleContainer) return;

        const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));

        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="prev"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];

        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="next"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];

        // Actualizar el estado de los botones
        prevButtons.forEach(button => button.disabled = this.currentPage === 1);
        nextButtons.forEach(button => button.disabled = this.currentPage === totalPages);
    }

    /**
     * Refresca la sección en función de los cambios en los atributos.
     */
    private async refresh(): Promise<void> {
        if (!this.articleContainer) return;

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
                await this.load();
            }
            if (currentAttributes.findKey !== this.findKey) {
                await this.findKeyValue();
            }
            if (currentAttributes.defaultPage !== this.defaultPage) {
                this.currentPage = this.defaultPage;
            }

            const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));
            this.currentPage = Math.min(this.currentPage, totalPages);

            this.render(this.getPage(this.currentPage));
        }
    }

    /**
     * Navega entre las páginas.
     * @param action Acción a realizar ('prev' o 'next').
     */
    private paginate(action: 'prev' | 'next'): void {
        if (!this.articleContainer || !this.data) return;

        const totalPages = Math.ceil(this.data.length / (this.limit || this.data.length));

        if (action === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        } else if (action === 'next' && this.currentPage < totalPages) {
            this.currentPage++;
        }

        this.render(this.getPage(this.currentPage));
    }

    /**
     * Agrega un listener para el evento 'sectionjs:getdata'.
     */
    private addListener(): void {
        if (!this.articleContainer) return;
        this.articleContainer.addEventListener('sectionjs:getdata', (event: Event) => {
            const customEvent = event as CustomEvent;
            const data = customEvent.detail.data;
            const value = data && this.data ? this.getValue(this.data, data) : this.data;
            this.articleContainer.dispatchEvent(new CustomEvent(`sectionjs:getdata:${data || 'all'}`, { detail: { value } }));
        });
    }

    /**
     * Inicializa todas las instancias de SectionJS en la página.
     */
    public static async initAll(): Promise<void> {
        const articleContainers: NodeListOf<HTMLElement> | any = document.querySelectorAll<HTMLElement>('[data-section]');
        if (articleContainers.length === 0) {
            console.log("SectionJS: data-section no encontrado. SectionJS inactivo.");
            return;
        }

        SectionJS.instances = [];
        for (const articleContainer of articleContainers) {
            const section = new SectionJS(articleContainer);
            SectionJS.instances.push(section);
            await section.initSelf(); // Inicializar cada instancia individualmente
        }
    }

    /**
     * Inicializa la instancia actual de SectionJS.
     */
    public async initSelf(): Promise<void> {
        this.addListener();
        await this.load();
        await this.findKeyValue();

        const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));
        this.currentPage = Math.min(this.currentPage, totalPages);

        // Verificar si los artículos ya están renderizados
        const hasRenderedArticles = this.articleContainer.hasAttribute('data-section-rendered');
        if (!hasRenderedArticles) {
            this.render(this.getPage(this.currentPage));
        }

        // Reconectar botones de paginación
        const paginationContainer = document.querySelector(`[data-target="${this.articleContainer.id}"]`);
        const prevButton = paginationContainer?.querySelector('button[data-action="prev"]') as HTMLButtonElement | null;
        const nextButton = paginationContainer?.querySelector('button[data-action="next"]') as HTMLButtonElement | null;

        if (prevButton) prevButton.onclick = () => this.paginate('prev');
        if (nextButton) nextButton.onclick = () => this.paginate('next');
    }

    /**
     * Aplica un cambio en un atributo del contenedor y refresca la sección.
     * @param containerId ID del contenedor.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    public static async apply(containerId: string, attributeName: string, attributeValue: string | number): Promise<void> {
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
                    await section.refresh();
                }

                if (wasObserverActive) {
                    section.enableObserver(); // Reactivar el Observer solo si estaba activo
                }
            }
        }
    }

    /**
     * Cambia un atributo del contenedor y refresca la sección.
     * @param attributeName Nombre del atributo a cambiar.
     * @param attributeValue Nuevo valor del atributo.
     */
    public async setAttribute(attributeName: string, attributeValue: string | number): Promise<void> {
        const wasObserverActive = this.observerActive;
        if (wasObserverActive) {
            this.disableObserver();
        }

        const currentValue = this.articleContainer.getAttribute(attributeName);
        if (currentValue !== attributeValue.toString()) {
            this.articleContainer.setAttribute(attributeName, attributeValue.toString());
            await this.refresh();
        }

        if (wasObserverActive) {
            this.enableObserver();
        }
    }
    
    /**
     * Escucha solicitudes de datos específicos y permite responder.
     */
    public onDataRequest<T>(key: string, handler: (query?: any) => T | Promise<T>): void {
        this.articleContainer.addEventListener(
            `sectionjs:getdata:${key}`,
            async (e: Event) => {
                const customEvent = e as CustomEvent<GetDataEventDetail>;
                try {
                    const result = await handler(customEvent.detail.query);
                    this.articleContainer.dispatchEvent(
                        new CustomEvent(`sectionjs:dataresponse:${key}`, {
                            detail: {
                                data: result,
                                sectionId: this.name || '',
                                timestamp: Date.now()
                            } as DataResponseEventDetail<T>
                        })
                    );
                } catch (error) {
                    this.articleContainer.dispatchEvent(
                        new CustomEvent(`sectionjs:dataerror:${key}`, {
                            detail: {
                                error: error instanceof Error ? error : new Error(String(error)),
                                message: "Error en solicitud de datos",
                                sectionId: this.name || '',
                                timestamp: Date.now()
                            } as ErrorEventDetail
                        })
                    );
                }
            }
        );
    }

    /**
     * Solicita datos y espera respuesta (similar a fetch()).
     */
    public async requestData<T>(key: string, query?: any, timeout: number = 5000): Promise<T> {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const timestamp = Date.now();

            const responseListener = (e: Event) => {
                const customEvent = e as CustomEvent<DataResponseEventDetail<T>>;
                clearTimeout(timeoutId);
                resolve(customEvent.detail.data);
                controller.abort();
            };

            const errorListener = (e: Event) => {
                const customEvent = e as CustomEvent<ErrorEventDetail>;
                clearTimeout(timeoutId);
                reject(customEvent.detail.error);
                controller.abort();
            };

            const timeoutId = setTimeout(() => {
                reject(new Error(`Solicitud '${key}' excedió el tiempo de espera (${timeout}ms)`));
                controller.abort();
            }, timeout);

            this.articleContainer.addEventListener(
                `sectionjs:dataresponse:${key}`,
                responseListener,
                { signal: controller.signal }
            );
            
            this.articleContainer.addEventListener(
                `sectionjs:dataerror:${key}`,
                errorListener,
                { signal: controller.signal }
            );

            this.articleContainer.dispatchEvent(
                new CustomEvent(`sectionjs:getdata:${key}`, {
                    detail: {
                        key,
                        query,
                        sectionId: this.name || '',
                        timestamp
                    } as GetDataEventDetail
                })
            );
        });
    }

    
  /**
 * Escucha cuando se solicita datos específicos (getdata).
 * @param callback Función que maneja la solicitud.
 */
public onGetData(callback: (dataKey: string) => void): void {
    this.articleContainer.addEventListener('sectionjs:getdata', (e: Event) => {
        const customEvent = e as CustomEvent<{ key: string }>; // ← Cambio crítico en el tipado
        callback(customEvent.detail.key); // ← Usar 'key' en lugar de 'data'
    });
}

 // Métodos de eventos actualizados
 public onRendered(callback: (detail: RenderEventDetail) => void): void {
    this.articleContainer.addEventListener('sectionjs:rendered', (e: Event) => {
        const customEvent = e as CustomEvent<RenderEventDetail>;
        callback(customEvent.detail);
    });
}

public onDataChanged(callback: (data: any[]) => void): void {
    this.articleContainer.addEventListener('sectionjs:datachanged', (e: Event) => {
        const customEvent = e as CustomEvent<DataResponseEventDetail<any[]>>;
        callback(customEvent.detail.data);
    });
}

public onError(callback: (error: Error, message: string) => void): void {
    this.articleContainer.addEventListener('sectionjs:error', (e: Event) => {
        const customEvent = e as CustomEvent<ErrorEventDetail>;
        const error = customEvent.detail.error instanceof Error 
            ? customEvent.detail.error 
            : new Error(String(customEvent.detail.error));
        callback(error, customEvent.detail.message);
    });
}
    public static stopAll(): void {
        SectionJS.instances.forEach(instance => {
            instance.articleContainer.replaceWith(instance.articleContainer.cloneNode(true));
       
            if (instance.observer) {
                instance.observer.disconnect();
                instance.observer = null;
            }
            
            instance.articleContainer.removeAttribute('data-section-rendered');
            instance.articleContainer.innerHTML = '';
            
            instance.articleTemplate = null;
            instance.infoTemplates = null;
            instance.data = null;
        });
        
        SectionJS.instances = [];
    }
}
