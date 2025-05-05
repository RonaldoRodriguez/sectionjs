class SectionJS {
    // Lista de todas las instancias de SectionJS creadas
    public static instances: SectionJS[] = [];

    // Contenedor HTML donde se renderizarán los datos
    private articleContainer: HTMLElement;

    // Nombre del contenedor
    public name : string | null = null;

    // Plantilla para renderizar cada artículo
    private articleTemplate: Element | null = null;

    // Plantillas para los elementos de información (paginación, etc.)
    private infoTemplates: Element[] | null = null;

    // Elementos que muestran información adicional (paginación, etc.)
    private spanElements: Element[];

    // Indica si el contenedor está renderizado
    public static default: boolean = false;

    // URL de la fuente de datos
    private dataSourceURL: string | null;

    // Número máximo de elementos por página
    private limit: number | null;

    // Orden de los datos (ASC o DESC)
    private order: string;

    // Índice de inicio para la paginación
    private start: number;

    // Atributo por el cual ordenar los datos
    private orderBy: string | null;

    // Número total de elementos
    private total: number | null;

    // Total de datos cargados
    public dataTotal: number = 0;

    // Total de páginas calculadas
    public totalPages: number = 0;

    // Total de elementos
    public itemsTotal: number = 0;

    // Número de elementos en la página actual
    public itemsNow: number = 0;

    // Página por defecto al cargar la sección
    private defaultPage: number;

    // Índice del primer elemento en la página actual
    public firstItemIndex: number = 0;

    // Índice del último elemento en la página actual
    public lastItemIndex: number = 0;

    // Página actual
    private currentPage: number;

    // Última página calculada
    public lastPage: number = 0;

    // Datos cargados desde la fuente
    private data: any[] | null = null;

    // Ruta dentro del JSON de respuesta para obtener los datos
    private responsePath: string | null;

    // Clave para buscar un valor específico en los datos
    private findKey: string | null;

    // Observador de cambios en los atributos del contenedor
    private observer: MutationObserver | null = null;

    // Indica si el observador está activo
    private observerActive: boolean = false;

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
        /*this.spanElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-action="info"], [data-section-action="info"]')),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"][data-action="info"], [data-target="${this.articleContainer.id}"][data-section-action="info"]`)),
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"]`)).flatMap(container =>
                Array.from(container.querySelectorAll('[data-action="info"], [data-section-action="info"]'))
            )
        ];*/

        this.spanElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="info"]')),
            // Elementos dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="info"]`))
        ].filter(element => element !== null) as HTMLElement[];

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
        this.name = this.articleContainer.id

        // No activar el Observer por defecto
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
        } catch (error) {
            console.error(error);
            this.articleContainer.innerHTML = "<p>Error al cargar datos.</p>";
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

        // Disparar evento de renderizado
        this.articleContainer.dispatchEvent(new CustomEvent('sectionjs:rendered', { detail: { pageData } }));
    }

    /**
     * Reconecta los botones de paginación.
     */
    private reconnectButtons(): void {
        if (!this.articleContainer) return;

        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            // Botones dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="prev"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];
        
        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            // Botones dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="next"]`))
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
        return text.replace(/{{(.*?)}}/g, (_, clave) => this.getValue(data, clave) || '');
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

        // Seleccionar elementos "info" dentro de contenedores estáticos o fuera del contenedor principal
        const infoElements = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="info"]')),
            // Elementos dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="info"]`))
        ].filter(element => element !== null) as HTMLElement[];

        // Actualizar el contenido de los elementos "info" usando sus propias plantillas
        infoElements.forEach((infoElement: HTMLElement, index) => {
            const templateElement = this.infoTemplates ? this.infoTemplates[index] : null;
            const template = templateElement ? templateElement.textContent : null;
            if (template) {
                infoElement.textContent = template
                    .replace('{{currentPage}}', this.currentPage.toString())
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
    private updateButtons(): void {
        if (!this.articleContainer) return;

        const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));

        // Seleccionar botones dentro de contenedores estáticos o fuera del contenedor principal
        const prevButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="prev"]')),
            // Botones dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="prev"]`))
        ].filter(button => button !== null) as HTMLButtonElement[];
        
        const nextButtons = [
            ...Array.from(this.articleContainer.querySelectorAll('[data-section-static] [data-action="next"]')),
            // Botones dentro de contenedores externos con data-target
            ...Array.from(document.querySelectorAll(`[data-target="${this.articleContainer.id}"] [data-action="next"]`))
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
        
        SectionJS.default = true;
    }

    /**
     * Inicializa la instancia actual de SectionJS.
     */
    public async initSelf(): Promise<void> {
        //if (!this.articleContainer) return;
        this.addListener();
        await this.load();
        await this.findKeyValue();

        const totalPages = Math.ceil((this.data?.length || 0) / (this.limit || this.data?.length || 1));
        this.currentPage = Math.min(this.currentPage, totalPages);
        this.lastPage = totalPages;
        this.dataTotal = this.data?.length || 0;

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
        const wasObserverActive = this.observerActive; // Guardar el estado del Observer
        if (wasObserverActive) {
            this.disableObserver(); // Desactivar el Observer solo si estaba activo
        }

        const currentValue = this.articleContainer.getAttribute(attributeName);
        if (currentValue !== attributeValue.toString()) {
            this.articleContainer.setAttribute(attributeName, attributeValue.toString());
            await this.refresh();
        }

        if (wasObserverActive) {
            this.enableObserver(); // Reactivar el Observer solo si estaba activo
        }
    }

        public async isRendered(callback: (section: SectionJS) => void): Promise<void> {
            this.articleContainer.addEventListener("sectionjs:rendered", async (e: Event) => {
            //const customEvent = e as CustomEvent<{ pageData: any[] }>;
            callback(this);
            });
        }

        // crear Funcion para detener initAll() si se a inicializado, y limpiar las instancias
        public static stopAll(): null | HTMLElement {
            const a: HTMLElement | null = document.querySelector("body[data-section-stop]")
            if(a) SectionJS.instances = [];
            return a;
        }
}
// agregar una funcion que detecte cuando este cargado el DOM, usando DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
    SectionJS.stopAll() ?? SectionJS.initAll();
});