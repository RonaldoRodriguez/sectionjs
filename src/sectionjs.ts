// c:\Users\ronal\OneDrive\Escritorio\tutorial\sectionjs.ts
// sectionjs.ts

interface SectionJSHelpers {
    [key: string]: (...args: any[]) => any;
}

interface SectionJSEventDetail {
    instance: SectionJS;
    data?: any;
    error?: Error;
    message?: string;
    renderedElements?: HTMLElement[];
    page?: number;
}

type SectionJSEventType =
    'sectionjs:beforeLoad' |
    'sectionjs:loaded' |
    'sectionjs:loadError' |
    'sectionjs:beforeRender' |
    'sectionjs:rendered' |
    'sectionjs:pageChanged' |
    'sectionjs:dataChanged' |
    'sectionjs:error';

class SectionJS {
    public readonly articleContainer: HTMLElement;
    public readonly name: string;
    
    public allData: any[] | null = null; // Holds the full dataset for data-src instances
    public data: any[] | null = null;    // Holds the data for the current page (for data-src instances)
    public scopeDataContext: any = {};   // Holds a single object context for data-logic-scope instances

    // Control attributes
    public dataSource: string | null = null;
    private controlLimit: number | null = null;
    private controlOrder: string = 'ASC';
    private controlStart: number = 0;
    private controlBy: string | null = null;
    private controlTotal: number | null = null; // For server-side pagination total
    private controlResponsePath: string | null = null;
    // REMOVED: private controlFindKey: string | null = null;
    private controlFilter: string | null = null;

    // Pagination state
    public currentPage: number = 1;
    public totalPages: number = 0;
    public itemsTotal: number = 0; // Total items in allData after filtering
    public itemsNow: number = 0;   // Items in the current page
    public firstItemIndex: number = 0; // 1-based index of the first item on the current page
    public lastItemIndex: number = 0;  // 1-based index of the last item on the current page

    private observer: MutationObserver | null = null;
    public observerActive: boolean = false;
    private isInitializing: boolean = true;
    private isLogicScopeInstance: boolean = false; 

    private loopDefinitions: Map<string, { // The string is the placeholder's nodeValue
        templateHTML: string; 
        loopVarName: string;
        indexVarName?: string; 
        dataSourceKey: string; 
    }> = new Map();
    
    private initialContainerStructureHTML: string = '';


    public static instances: SectionJS[] = [];
    private static helpers: SectionJSHelpers = {};

    private static supportsWeakRef = typeof WeakRef !== 'undefined';
    private static supportsFinalizationRegistry = typeof FinalizationRegistry !== 'undefined';
    private static instancesRefs: (WeakRef<SectionJS> | SectionJS)[] = [];
    private static finalizationRegistry: FinalizationRegistry<string> | null = null;


    constructor(elementOrSelector: HTMLElement | string) {
        let container: HTMLElement | null = null;
        if (typeof elementOrSelector === 'string') {
            container = document.querySelector<HTMLElement>(elementOrSelector);
            if (!container) {
                throw new Error(`SectionJS: No se encontró el elemento para el selector "${elementOrSelector}".`);
            }
        } else if (elementOrSelector instanceof HTMLElement) {
            container = elementOrSelector;
        } else {
            throw new Error("SectionJS: El constructor requiere un selector de string o un HTMLElement.");
        }
    
        this.articleContainer = container;
        
        if (!this.articleContainer.id) {
            this.name = this.generateId();
        } else {
            this.name = this.articleContainer.id;
        }
    
        const hasDataSrc = this.articleContainer.hasAttribute('data-src');
        const hasLogicScope = this.articleContainer.hasAttribute('data-logic-scope');

        if (hasDataSrc) { 
            this.isLogicScopeInstance = false;
            this.dataSource = this.sanitizeURL(this.articleContainer.getAttribute('data-src'));
        } else if (hasLogicScope) {
            this.isLogicScopeInstance = true;
            this.dataSource = null;
            const scopeSrcAttr = this.articleContainer.getAttribute('data-logic-scope');
            if (scopeSrcAttr && scopeSrcAttr.trim().startsWith('{')) { 
                try {
                    this.scopeDataContext = JSON.parse(scopeSrcAttr);
                } catch (e) {
                    console.warn(`SectionJS (${this.name}): JSON inválido en data-logic-scope. Usando {}.`, e);
                    this.scopeDataContext = {};
                }
            } else {
                this.scopeDataContext = {}; 
            }
            this.allData = [this.scopeDataContext]; 
        } else {
            this.isLogicScopeInstance = false;
            this.dataSource = null;
            this.allData = [];
        }
    
        this.loadConfigFromAttributes();
    
        if (SectionJS.supportsFinalizationRegistry && !SectionJS.finalizationRegistry) {
            SectionJS.finalizationRegistry = new FinalizationRegistry((heldValue: string) => {
                SectionJS.instancesRefs = SectionJS.instancesRefs.filter(refOrInstance => {
                    if (SectionJS.supportsWeakRef && refOrInstance instanceof WeakRef) {
                        return refOrInstance.deref() !== undefined;
                    }
                    return true;
                });
            });
        }
        this.addInstance(this);
        this.enableObserver(); 
    
        if (this.dataSource || this.isLogicScopeInstance) { 
            this.initialize().catch(error => {
                console.error(`SectionJS (${this.name}): Error durante la inicialización automática.`, error);
            });
        } else { 
            this.isInitializing = false;
            this.captureInitialTemplates(); 
            this.updatePaginationState(); 
            this.dispatchEvent('sectionjs:rendered', { renderedElements: [], data: [] });
            this.articleContainer.setAttribute('data-section-rendered', 'true');
        }
    }

    private generateId(): string {
        return `sjs-instance-${Math.random().toString(36).substring(2, 9)}`;
    }

    private addInstance(instance: SectionJS): void {
        if (!SectionJS.instances.includes(instance)) { 
            SectionJS.instances.push(instance);
            if (SectionJS.supportsWeakRef) {
                const ref = new WeakRef(instance);
                SectionJS.instancesRefs.push(ref);
                if (SectionJS.finalizationRegistry) {
                    SectionJS.finalizationRegistry.register(instance, instance.name, ref);
                }
            } else {
                SectionJS.instancesRefs.push(instance);
            }
        }
    }
    
    private static stripTemplateCommentsLogic(htmlString: string): string {
        if (!htmlString) return '';
        const commentRegex = /{\/\*[\s\S]*?\*\/}/g;
        return htmlString.replace(commentRegex, '');
    }

    // En sectionjs.ts

    private captureInitialTemplates(): void {
        this.loopDefinitions.clear();
        const clonedContainer = this.articleContainer.cloneNode(true) as HTMLElement;
        let loopCounter = 0;

        // Función recursiva para encontrar y reemplazar bucles con placeholders
        const processElementForLoopCapture = (currentElement: HTMLElement) => {
            // Iterar sobre una copia de los hijos porque vamos a modificar la estructura (reemplazar nodos)
            const children = Array.from(currentElement.children);

            for (const child of children) {
                if (child instanceof HTMLElement) {
                    if (child.hasAttribute('data-logic-each')) {
                        const loopElement = child;
                        const directiveValue = loopElement.dataset.logicEach!;
                        
                        // Capturar el outerHTML ANTES de recursar en sus hijos para placeholders
                        // Esto asegura que la plantilla del bucle externo contenga el marcado original
                        // de sus bucles internos, los cuales también serán convertidos a placeholders
                        // en el initialContainerStructureHTML general.
                        
                        // Primero, recursar en los hijos del loopElement para que los bucles internos
                        // dentro de SU plantilla también sean convertidos a placeholders SI la plantilla
                        // se va a usar para generar el initialContainerStructureHTML.
                        // PERO, la plantilla que guardamos para ESTE bucle debe ser su outerHTML original.
                        
                        const templateHTML = SectionJS.stripTemplateCommentsLogic(loopElement.outerHTML);
                        const [loopVarName, dataSourceKey, indexVarName] = this.parseLoopDirective(directiveValue);
                        
                        const placeholderText = `SJS-LOOP-PLACEHOLDER-${this.name}-${loopCounter++}`;
                        const placeholder = document.createComment(placeholderText);

                        this.loopDefinitions.set(placeholder.nodeValue!, {
                            templateHTML, loopVarName, indexVarName, dataSourceKey
                        });

                        // Reemplazar el loopElement con el placeholder en el clonedContainer
                        if (loopElement.parentNode) {
                            loopElement.parentNode.replaceChild(placeholder, loopElement);
                        }
                        // No recursar en el loopElement original porque su estructura completa es la plantilla.
                        // El placeholder lo reemplaza en el clonedContainer.
                    } else {
                        // Si no es un bucle, recursar para encontrar bucles anidados más profundamente
                        processElementForLoopCapture(child);
                    }
                }
            }
        };

        processElementForLoopCapture(clonedContainer);
        this.initialContainerStructureHTML = SectionJS.stripTemplateCommentsLogic(clonedContainer.innerHTML);
    }


    private parseLoopDirective(directiveValue: string): [string, string, string | undefined] {
        const inMatch = directiveValue.match(/^(.*)\s+in\s+(.+)$/);
        if (!inMatch) {
            console.warn(`SectionJS (${this.name}): Formato de directiva de bucle inválido: "${directiveValue}". Usando "item in _instance.data".`);
            return ['item', '_instance.data', undefined];
        }
        const loopVarsPart = inMatch[1].trim();
        const dataSourceKey = inMatch[2].trim();
        
        const varParts = loopVarsPart.split(',').map(v => v.trim());
        const loopVarName = varParts[0];
        const indexVarName = varParts.length > 1 ? varParts[1] : undefined;

        return [loopVarName, dataSourceKey, indexVarName];
    }
    
    public static stripGlobalComments(rootElement: HTMLElement = document.body): void {
        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
            null
        );
        const nodesToRemove: Node[] = [];
        const nodesToModify: { node: Text, newValue: string }[] = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.COMMENT_NODE) {
                const commentNode = node as Comment;
                if (commentNode.nodeValue && commentNode.nodeValue.trim().startsWith('{/*') && commentNode.nodeValue.trim().endsWith('*/}')) {
                     nodesToRemove.push(commentNode);
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const textNode = node as Text;
                const originalValue = textNode.nodeValue;
                if (originalValue && originalValue.includes('{/*')) {
                    const newValue = SectionJS.stripTemplateCommentsLogic(originalValue);
                    if (newValue !== originalValue) {
                        nodesToModify.push({ node: textNode, newValue });
                    }
                }
            }
        }
        nodesToModify.forEach(mod => { mod.node.nodeValue = mod.newValue; });
        nodesToRemove.forEach(node => { node.parentNode?.removeChild(node); });
    }

    private loadConfigFromAttributes(): void {
        if (!this.isLogicScopeInstance) { 
            this.dataSource = this.sanitizeURL(this.articleContainer.getAttribute('data-src'));
        }
        this.controlLimit = this.validateNumber(this.articleContainer.getAttribute('data-control-limit'), 'data-control-limit');
        this.controlOrder = this.articleContainer.getAttribute('data-control-order')?.toUpperCase() || 'ASC';
        this.controlStart = this.validateNumber(this.articleContainer.getAttribute('data-control-start'), 'data-control-start') || 0;
        this.controlBy = this.articleContainer.getAttribute('data-control-by');
        this.controlTotal = this.validateNumber(this.articleContainer.getAttribute('data-control-total'), 'data-control-total');
        this.currentPage = Math.max(1, this.validateNumber(this.articleContainer.getAttribute('data-control-page'), 'data-control-page') || 1);
        this.controlResponsePath = this.articleContainer.getAttribute('data-control-response-path');
        this.controlFilter = this.articleContainer.getAttribute('data-control-filter');
    }

    private sanitizeURL(url: string | null): string | null {
        if (url === null) return null;
        const trimmedUrl = url.trim();
        if ((trimmedUrl.startsWith('[') && trimmedUrl.endsWith(']')) || (trimmedUrl.startsWith('{') && trimmedUrl.endsWith('}'))) {
            return trimmedUrl; 
        }
        return trimmedUrl;
    }

    private validateNumber(value: string | null, attributeName: string): number | null {
        if (value === null) return null;
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            console.warn(`SectionJS (${this.name}): Valor inválido para ${attributeName}: "${value}". Se esperaba un número.`);
            return null;
        }
        return num;
    }

    public static registerHelpers(helpers: SectionJSHelpers): void {
        for (const [name, fn] of Object.entries(helpers)) {
            SectionJS.registerHelper(name, fn);
        }
    }

    public static registerHelper(nameOrObject: string | Record<string, (...args: any[]) => any>, fn?: (...args: any[]) => any): void {
        if (typeof nameOrObject === 'string' && typeof fn === 'function') {
            SectionJS.helpers[nameOrObject] = fn;
        } else if (typeof nameOrObject === 'object' && nameOrObject !== null) {
            for (const name in nameOrObject) {
                if (Object.prototype.hasOwnProperty.call(nameOrObject, name) && typeof nameOrObject[name] === 'function') {
                    SectionJS.helpers[name] = nameOrObject[name];
                }
            }
        } else {
            console.warn('SectionJS.registerHelper: Argumentos inválidos.');
        }
    }

    public async initialize(): Promise<void> {
        this.isInitializing = true;
        this.dispatchEvent('sectionjs:beforeLoad');
        try {
            if (this.isLogicScopeInstance) {
                const scopeSrcAttr = this.articleContainer.getAttribute('data-logic-scope');
                if (scopeSrcAttr && scopeSrcAttr.trim().startsWith('{')) { 
                     try {
                        const parsedData = JSON.parse(scopeSrcAttr);
                        this.scopeDataContext = typeof parsedData === 'object' && !Array.isArray(parsedData) ? parsedData : {};
                        this.allData = [this.scopeDataContext]; 
                    } catch (e) { /* already handled in constructor or use default {} */ }
                }
            } else if (this.dataSource) { 
                const rawData = await this.fetchData();
                this.processFetchedData(rawData || []); 
            } else {
                this.allData = []; 
            }

            if (!Array.isArray(this.allData)) { 
                console.warn(`SectionJS (${this.name}): this.allData no es un array después de la carga inicial. Forzando a [].`, this.allData);
                this.allData = [];
            }
            
            this.captureInitialTemplates(); 

            this.dispatchEvent('sectionjs:loaded', { data: this.allData });
            this.refresh(); 
        } catch (error: any) {
            this.dispatchEvent('sectionjs:loadError', { error, message: `Error cargando datos para ${this.name}` });
            console.error(`SectionJS (${this.name}): Error durante la inicialización.`, error);
            this.allData = this.isLogicScopeInstance ? [this.scopeDataContext] : [];
            try { this.captureInitialTemplates(); } catch(e) { /* Silently fail template capture on error path */ }
            this.refresh(); 
        } finally {
            this.isInitializing = false;
        }
    }

    public static async initAll(options: any = {}): Promise<SectionJS[]> {
        SectionJS.stripGlobalComments(document.body);
        const createdInstances: SectionJS[] = [];
        const processedContainers: HTMLElement[] = [];

        const dataDrivenContainers = document.querySelectorAll<HTMLElement>('[data-src]');
        for (const container of Array.from(dataDrivenContainers)) {
            if (SectionJS.instances.some(inst => inst.articleContainer === container)) continue;
            try {
                const instance = new SectionJS(container);
                createdInstances.push(instance);
                processedContainers.push(container);
            } catch (error) {
                console.error("SectionJS.initAll: Error creando instancia data-driven:", container, error);
            }
        }

        const scopeContainers = document.querySelectorAll<HTMLElement>('[data-logic-scope]');
        for (const container of Array.from(scopeContainers)) {
            if (processedContainers.includes(container) || SectionJS.instances.some(inst => inst.articleContainer === container)) continue;
            
            if (!container.id) container.id = `sjs-scope-${Math.random().toString(36).substring(2, 9)}`;
            try {
                const instance = new SectionJS(container);
                createdInstances.push(instance);
            } catch (error) { 
                console.error(`SectionJS.initAll: Error creando instancia data-logic-scope:`, container, error);
            }
        }
        
        document.dispatchEvent(new CustomEvent('sectionjs:allInitialized', { detail: { instances: createdInstances } }));
        return createdInstances;
    }



    private applyFiltersAndSort(data: any[]): any[] {
        let processedData = [...data]; 

        if (this.controlFilter) {
            try {
                const filterFnOrExpr = this.controlFilter;
                const baseScope = this.createBaseScope(processedData); 
                if (SectionJS.helpers[filterFnOrExpr] && typeof SectionJS.helpers[filterFnOrExpr] === 'function') {
                    processedData = processedData.filter(item => SectionJS.helpers[filterFnOrExpr](item, this));
                } else { 
                    processedData = processedData.filter(item => {
                        const itemScope = Object.create(baseScope);
                        itemScope.item = item; 
                        return this.evaluateExpression(filterFnOrExpr, itemScope);
                    });
                }
            } catch (e) {
                console.error(`SectionJS (${this.name}): Error aplicando filtro "${this.controlFilter}".`, e);
            }
        }

        if (this.controlBy) {
            processedData.sort((a, b) => {
                let valA = this.getValueFromPath(a, this.controlBy!);
                let valB = this.getValueFromPath(b, this.controlBy!);
                const aIsNull = valA === null || valA === undefined;
                const bIsNull = valB === null || valB === undefined;

                if (aIsNull && !bIsNull) return this.controlOrder === 'ASC' ? 1 : -1; 
                if (!aIsNull && bIsNull) return this.controlOrder === 'ASC' ? -1 : 1; 
                if (aIsNull && bIsNull) return 0;

                if (typeof valA === 'string' && typeof valB === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    // Standard numeric comparison
                } else { 
                    valA = String(valA);
                    valB = String(valB);
                }

                if (valA < valB) return this.controlOrder === 'ASC' ? -1 : 1;
                if (valA > valB) return this.controlOrder === 'ASC' ? 1 : -1;
                return 0;
            });
        }
        return processedData;
    }

    private getValueFromPath(obj: any, path: string): any {
        if (!path || typeof obj !== 'object' || obj === null) return undefined; 
        return path.split('.').reduce((currentObject, key) => {
            if (currentObject === null || currentObject === undefined || typeof currentObject !== 'object') {
                return undefined;
            }
            return currentObject[key];
        }, obj);
    }


    public refresh(forceReload: boolean = false): void {
        if (this.isInitializing && !this.articleContainer.hasAttribute('data-section-rendered')) {
            // Allow first render during initialization
        } else if (this.isInitializing) {
            console.warn(`SectionJS (${this.name}): Refresh llamado durante inicialización. Omitiendo.`);
            return;
        }

        if (!this.allData && !this.isLogicScopeInstance) { 
            this.data = [];
            this.updatePaginationState();
            this.render([]); 
            return;
        }
        
        let dataToProcess = this.isLogicScopeInstance ? (this.allData || [this.scopeDataContext]) : (this.allData || []);
        if (!Array.isArray(dataToProcess) && this.isLogicScopeInstance) {
            dataToProcess = [dataToProcess]; 
        } else if (!Array.isArray(dataToProcess)) {
            dataToProcess = [];
        }

        const filteredAndSortedData = this.isLogicScopeInstance ? dataToProcess : this.applyFiltersAndSort(dataToProcess);
        this.itemsTotal = filteredAndSortedData.length;

        const pageSize = this.controlLimit && this.controlLimit > 0 ? this.controlLimit : this.itemsTotal;
        this.totalPages = pageSize > 0 ? Math.ceil(this.itemsTotal / pageSize) : 1;
        if (this.totalPages === 0 && this.itemsTotal > 0 && pageSize === 0) this.totalPages = 1; 
        if (this.totalPages === 0 && this.itemsTotal === 0) this.totalPages = 1; 

        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages || 1));

        const startIndex = (this.currentPage - 1) * (pageSize || 0) + (this.controlStart || 0);
        const endIndex = (pageSize > 0) ? (startIndex + pageSize) : this.itemsTotal;

        this.data = this.isLogicScopeInstance ? filteredAndSortedData : filteredAndSortedData.slice(startIndex, endIndex);
        
        this.updatePaginationState(); 
        this.render(this.data); 

        if (!this.isInitializing) {
            this.dispatchEvent('sectionjs:dataChanged', { data: this.data });
        }
        if (forceReload && this.dataSource) {
            this.fetchData().then(rawData => {
                this.processFetchedData(rawData);
                this.updatePaginationState();
                this.render(this.data || []);
            }).catch(error => {
                console.error("Error al recargar datos:", error);
            });
        } else {
            this.updatePaginationState(); // Añadir esta línea
            this.render(this.data || []);
        }
    }

    

    private render(pageData: any[]): void { 
        this.dispatchEvent('sectionjs:beforeRender', { data: pageData });

        this.articleContainer.innerHTML = this.initialContainerStructureHTML;
        
        const baseScopeData = this.isLogicScopeInstance ? (this.allData ? this.allData[0] : {}) : pageData;
        this.processNode(this.articleContainer, this.createBaseScope(baseScopeData));
        
        this.updatePaginationControls();
        this.articleContainer.setAttribute('data-section-rendered', 'true');
        this.dispatchEvent('sectionjs:rendered', { renderedElements: Array.from(this.articleContainer.children) as HTMLElement[], data: pageData });
    }

    private createBaseScope(currentPageData: any[] | any): any {
        return {
            _instance: this,
            helpers: SectionJS.helpers,
            data: currentPageData, 
        };
    }

    private processNode(node: Node, scope: any): void {
        if (node.nodeType === Node.COMMENT_NODE) {
            const commentNode = node as Comment;
            const loopDef = this.loopDefinitions.get(commentNode.nodeValue!); 
            if (loopDef && node.parentNode) {
                const parentForLoopItems = node.parentNode;
                const itemsFragment = document.createDocumentFragment();
                let loopDataArray: any[];
    
                try {
                    const evaluatedData = this.evaluateExpression(loopDef.dataSourceKey, scope);
                    loopDataArray = Array.isArray(evaluatedData) ? evaluatedData : [];
                } catch (e) {
                    console.error(`SectionJS (${this.name}): Error al evaluar la fuente de datos del bucle "${loopDef.dataSourceKey}" en el scope:`, scope, e);
                    loopDataArray = [];
                }
                
                // loopDataArray es la data que se debe iterar. 
                // Si loopDef.dataSourceKey fue '_instance.data', loopDataArray ya es la data paginada por refresh().
                loopDataArray.forEach((itemData, index) => {
                    
                    const itemScope = Object.create(scope); 
                    itemScope[loopDef.loopVarName] = itemData;
                    if (loopDef.indexVarName) {
                        itemScope[loopDef.indexVarName] = index;
                    }
                    if (loopDef.dataSourceKey === '_instance.data') { 
                        itemScope['data'] = loopDataArray;
                        // Esto permite que dentro del bucle, {{ data.length }} se refiera
                        // a la longitud de la colección que se está iterando (la página actual).
                    
                    }
    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = loopDef.templateHTML;
                    const loopTemplateElement = tempDiv.firstElementChild;
    
                    if (loopTemplateElement) {
                        const clonedElement = loopTemplateElement.cloneNode(true) as HTMLElement;
                        clonedElement.removeAttribute('data-logic-each');
                        this.processNode(clonedElement, itemScope); // Procesar hijos recursivamente
                        itemsFragment.appendChild(clonedElement);
                    }
                });
                parentForLoopItems.replaceChild(itemsFragment, commentNode); 
                return; 
            }
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const htmlElement = node as HTMLElement;
    
            // Procesar elementos con data-logic-each (bucles anidados)
            if (htmlElement.hasAttribute('data-logic-each')) {
                const directiveValue = htmlElement.dataset.logicEach!;
                const [loopVarName, dataSourceKey, indexVarName] = this.parseLoopDirective(directiveValue);
                const templateHTML = htmlElement.outerHTML;
    
                if (htmlElement.parentNode) {
                    const parentForLoopItems = htmlElement.parentNode;
                    const itemsFragment = document.createDocumentFragment();
                    let loopDataArray: any[];
                    try {
                        const evaluatedData = this.evaluateExpression(dataSourceKey, scope);
                        loopDataArray = Array.isArray(evaluatedData) ? evaluatedData : [];
                    } catch (e) { 
                        console.error("Error en dataSource de bucle anidado", e);
                        // Asegúrate de que el error no detenga el renderizado de otras partes si es posible,
                        // o al menos que el error sea claro.
                        // Considera si quieres que el elemento original permanezca o sea eliminado.
                        loopDataArray = []; 
                    }
    
                    loopDataArray.forEach((itemData, index) => {
                        const itemScope = Object.create(scope);
                        itemScope[loopVarName] = itemData;
                        if (indexVarName) itemScope[indexVarName] = index;
                        if (dataSourceKey === '_instance.data') itemScope['data'] = loopDataArray;
                        // De nuevo, si el bucle anidado usa '_instance.data' como fuente,
                        // esto es problemático ya que '_instance.data' debería ser la data paginada principal.
                        // Los bucles anidados usualmente iteran sobre propiedades del item del bucle padre (ej. item.children).
    
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = templateHTML;
                        const loopTemplateClone = tempDiv.firstElementChild!.cloneNode(true) as HTMLElement;
                        loopTemplateClone.removeAttribute('data-logic-each');
                        this.processNode(loopTemplateClone, itemScope); // Procesar hijos recursivamente
                        itemsFragment.appendChild(loopTemplateClone);
                    });
                    parentForLoopItems.replaceChild(itemsFragment, htmlElement);
                }
                return;
            }
    
            // Procesar condiciones data-logic-if y data-logic-show
            const ifConditionAttr = htmlElement.getAttribute('data-logic-if');
            if (ifConditionAttr) {
                const expressionString = this.extractExpressionString(ifConditionAttr);
                const shouldRender = this.evaluateExpression(expressionString, scope);
                if (!shouldRender) {
                    htmlElement.remove();
                    return;
                }
            }
            const showConditionAttr = htmlElement.getAttribute('data-logic-show');
            if (showConditionAttr) {
                const expressionString = this.extractExpressionString(showConditionAttr);
                htmlElement.style.display = this.evaluateExpression(expressionString, scope) ? '' : 'none';
            }
    
            // Procesar atributos dinámicos (data-attr-*, data-logic-on-*, etc.)
            this.processAttributes(htmlElement, scope);
    
            // ****** CAMBIO CLAVE AQUÍ ****** 
            // Procesar TODOS los hijos sin verificar si tienen parentElement
            Array.from(htmlElement.childNodes).forEach(child => this.processNode(child, scope));
    
        } else if (node.nodeType === Node.TEXT_NODE) {
            this.processTextNode(node as Text, scope);
        }
    }
    
    private async fetchData(): Promise<any> {
        if (!this.dataSource) return null;
        const trimmedDataSource = this.dataSource.trim();
        if ((trimmedDataSource.startsWith('[') && trimmedDataSource.endsWith(']')) || 
            (trimmedDataSource.startsWith('{') && trimmedDataSource.endsWith('}'))) {
            try {
                return JSON.parse(trimmedDataSource);
            } catch (e) {
                console.error(`SectionJS (${this.name}): Error parseando JSON inline de data-src.`, e);
                throw e; 
            }
        }
        const response = await fetch(trimmedDataSource);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${trimmedDataSource}`);
        return await response.json();
    }

    private processFetchedData(rawData: any): void {
        // Asegurar que itemsTotal se actualice
        this.itemsTotal = rawData.length; // Para APIs sin paginación server-side
        this.allData = rawData;
    }

    private processAttributes(element: HTMLElement, context: any): void {
        const attributesToSet: { name: string, value: string }[] = [];
        const attributesToRemove: string[] = []; 

        for (const attr of Array.from(element.attributes)) {
            if (attr.name.startsWith('data-attr-')) {
                const realAttrName = attr.name.substring('data-attr-'.length);
                const expression = this.extractExpressionString(attr.value); 
                const expressionValue = this.evaluateExpression(expression, context);
                const booleanAttributes = ['disabled', 'checked', 'selected', 'readonly', 'hidden', 'multiple', 'required', 'open', 'defer', 'async', 'ismap', 'autoplay', 'controls', 'loop', 'muted', 'playsinline'];
                
                if (booleanAttributes.includes(realAttrName.toLowerCase())) {
                    if (expressionValue === true || expressionValue === 'true' || expressionValue === '') {
                        attributesToSet.push({ name: realAttrName, value: '' });
                    } else {
                        attributesToRemove.push(realAttrName);
                    }
                } else if (expressionValue !== null && expressionValue !== undefined) {
                    attributesToSet.push({ name: realAttrName, value: String(expressionValue) });
                } else { 
                    attributesToRemove.push(realAttrName);
                }
            }
            else if (attr.name.startsWith('data-logic-on-')) {
                const eventName = attr.name.substring('data-logic-on-'.length);
                const actionExpression = attr.value;
                if ((element as any)._sjs_listeners && (element as any)._sjs_listeners[eventName]) {
                    element.removeEventListener(eventName, (element as any)._sjs_listeners[eventName]);
                }
                const eventListener = (event: Event) => {                    
                    const eventScope = { ...context, event, _element: element };
                    this.evaluateExpression(actionExpression, eventScope);
                };
                element.addEventListener(eventName, eventListener);
                if (!(element as any)._sjs_listeners) { (element as any)._sjs_listeners = {}; }
                (element as any)._sjs_listeners[eventName] = eventListener; 
            }
            else if (attr.name === 'data-logic-class') { 
                 const expressionString = this.extractExpressionString(attr.value);
                 const classValue = this.evaluateExpression(expressionString, context);
                 if (typeof classValue === 'string') {
                    classValue.split(' ').forEach(cls => { if(cls) element.classList.add(cls); });
                 } else if (Array.isArray(classValue)) {
                    classValue.forEach(cls => { if(typeof cls === 'string' && cls) element.classList.add(cls); });
                 } else if (typeof classValue === 'object' && classValue !== null) {
                    for (const key in classValue) {
                        if (Object.prototype.hasOwnProperty.call(classValue, key)) {
                            element.classList.toggle(key, !!classValue[key]);
                        }
                    }
                 }
            }
             else if (attr.value.includes('{{') && !attr.name.startsWith('data-')) { 
                const newValue = this.interpolateText(attr.value, context);
                if (newValue !== attr.value) {
                    attributesToSet.push({ name: attr.name, value: newValue });
                }
            }
        }
        attributesToRemove.forEach(attrName => element.removeAttribute(attrName));
        attributesToSet.forEach(attr => element.setAttribute(attr.name, attr.value));
    }

    private processTextNode(textNode: Text, context: any): void {
        const originalText = textNode.nodeValue || '';
        if (originalText.includes('{{')) {
            textNode.nodeValue = this.interpolateText(originalText, context);
        }
    }
    private extractExpressionString(value: string): string {
        if (value.startsWith('{{*') && value.endsWith('*}}')) {
            return value.slice(3, -3).trim();
        }
        return value.trim();
    }

    private interpolateText(text: string, context: any): string {
        return text.replace(/\{\{\s*(?:(\*)\s*(.*?)\s*\*|(.*?))\s*}}/g, (match, isExprStar, exprContent, simpleVarContent) => {
            const expression = isExprStar ? exprContent.trim() : simpleVarContent.trim();
            let value: any;
            try {
                // console.log(`SectionJS (${this.name}): Interpolate: expr="${expression}" with context keys:`, Object.keys(context), 'prototypical keys might exist too');
                value = this.evaluateExpression(expression, context);
                // if (value === undefined) {
                //     console.warn(`SectionJS (${this.name}): Expression "${expression}" evaluated to undefined. Context:`, context);
                // }
                // For {{ variable }} (no star), escape HTML. For {{* expression *}}, use raw value.
                return value !== null && value !== undefined ? (isExprStar ? String(value) : this.escapeHtml(String(value))) : '';
            } catch (e) {
                console.error(`SectionJS (${this.name}): Error evaluando interpolación "${match}"`, e, context);
                return `[Error: ${match}]`;
            }
        });
    }

    private escapeHtml(unsafe: string): string {
        if (typeof unsafe !== 'string') { 
            if (unsafe === null || unsafe === undefined) return '';
            unsafe = String(unsafe);
        }
        const escapeMap: { [char: string]: string } = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
        };
        return unsafe.replace(/[&<>"']/g, char => escapeMap[char] || char);
    }

    private evaluateExpression(expression: string, context: any): any {
        const evaluationContext: Record<string, any> = {};

        // 1. Add properties from the context's prototype chain (e.g., from baseScope if context is itemScope)
        let currentProto = Object.getPrototypeOf(context);
        while (currentProto && currentProto !== Object.prototype) {
            Object.getOwnPropertyNames(currentProto).forEach(key => {
                if (!evaluationContext.hasOwnProperty(key)) {
                    evaluationContext[key] = (currentProto as any)[key];
                }
            });
            currentProto = Object.getPrototypeOf(currentProto);
        }
        
        // 2. Add own properties of the context (e.g., loop item 'g', 'user', 'index')
        // These will override anything from the prototype chain with the same name.
        for (const key in context) {
            if (Object.prototype.hasOwnProperty.call(context, key)) {
                evaluationContext[key] = context[key];
            }
        }

        // 3. Ensure _instance and helpers are directly available in the evaluationContext.
        //    This makes them accessible directly or via `this` inside the dynamic function.
        evaluationContext._instance = this; // The current SectionJS instance
        evaluationContext.helpers = SectionJS.helpers;
        
        // 4. Add other direct instance properties for convenience (e.g., direct `currentPage` access)
        //    Only add if not already defined by the context (e.g., a loop variable named 'data').
        const directInstanceProps: Record<string, any> = {
            
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            itemsTotal: this.itemsTotal, itemsNow: this.itemsNow,
            firstItemIndex: this.firstItemIndex, lastItemIndex: this.lastItemIndex,
             // 'data' and 'allData' are often part of the 'context' or accessible via '_instance.data'
        };
        for (const key in directInstanceProps) {
            if (!evaluationContext.hasOwnProperty(key)) {
                evaluationContext[key] = directInstanceProps[key];
            }
        }

        const argNames = Object.keys(evaluationContext);
        const argValues = argNames.map(key => evaluationContext[key]);

        try {
            const func = new Function(...argNames, `"use strict"; try { return (${expression}); } catch(e) { console.error("Error in expression: ${expression.replace(/"/g, '\\"').replace(/\n/g, '\\n')} with context keys:", Object.keys(this).join(', '), e); return undefined; }`);
            return func.apply(evaluationContext, argValues);
        } catch (e) {
            console.error(`SectionJS (${this.name}): Error creando función para expresión "${expression}"`, e, evaluationContext);
            return undefined;
        }
    }

    private updatePaginationState(): void {
        
    
        if (this.dataSource) { // Solo para instancias con data-src externo
            const pageSize = this.controlLimit || 3;
            this.totalPages = Math.ceil(this.itemsTotal / pageSize);
            this.currentPage = Math.min(this.currentPage, this.totalPages);
        }
        if (!this.data || this.data.length === 0) {
            this.itemsNow = 0;
            this.firstItemIndex = 0;
            this.lastItemIndex = 0;
        } else {
            this.itemsNow = this.data.length;
            const pageSizeForIndex = (this.controlLimit && this.controlLimit > 0) ? this.controlLimit : this.itemsTotal;
            if (this.itemsTotal > 0) {
                 this.firstItemIndex = (this.currentPage - 1) * pageSizeForIndex + (this.controlStart || 0) + 1;
                 this.lastItemIndex = this.firstItemIndex + this.itemsNow - 1;
            } else {
                this.firstItemIndex = 0;
                this.lastItemIndex = 0;
            }
        }
    }

    private updatePaginationControls(): void {
        if (this.isLogicScopeInstance || !this.controlLimit || this.controlLimit <= 0) {
            this.articleContainer.querySelectorAll('[data-pagination-info], [data-action="prev"], [data-action="next"]')
                .forEach(el => {
                    if (el.hasAttribute('data-pagination-info')) el.textContent = '';
                    if (el.tagName === 'BUTTON') (el as HTMLButtonElement).disabled = true;
                });
            return;
        }
    
        const paginationScope = this.createBaseScope(this.data || []);
    
        this.articleContainer.querySelectorAll('[data-pagination-info]').forEach(el => {
            if ((el as HTMLElement).dataset.sjsOriginalPaginationInfo === undefined) {
                (el as HTMLElement).dataset.sjsOriginalPaginationInfo = el.textContent || '';
            }
            const template = (el as HTMLElement).dataset.sjsOriginalPaginationInfo;
            el.textContent = this.interpolateText(template || '', paginationScope);
        });
    
        // Buttons are now handled by data-logic-on-click and data-attr-disabled
        // We just need to ensure their disabled state is updated if they rely on _instance properties
        // This will happen naturally if their data-attr-disabled uses _instance.currentPage etc.
        // and a refresh is triggered.
    }

    public nextPage(): void {
        if (this.currentPage < (this.totalPages || 1)) {
            this.currentPage++;
            this.refresh(true); // Forzar recarga
            this.dispatchEvent('sectionjs:pageChanged', { page: this.currentPage });
        }
    }
    
    public prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.refresh(true); // Forzar recarga
            this.dispatchEvent('sectionjs:pageChanged', { page: this.currentPage });
        }
    }
    public setPage(pageNumber: number): void {
        const newPage = Math.max(1, Math.min(pageNumber, this.totalPages || 1));
        if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.refresh();
            this.dispatchEvent('sectionjs:pageChanged', { page: this.currentPage });
        }
    }

    public enableObserver(): void {
        if (this.observerActive || this.observer || this.isLogicScopeInstance) return; 
        const attributesToObserve = [
            'data-src', 'data-control-limit', 'data-control-order', 
            'data-control-start', 'data-control-by', 'data-control-total', 
            'data-control-page', 'data-control-response-path', 
            'data-control-filter'
        ];
        this.observer = new MutationObserver(mutations => {
            let needsReInitialize = false;
            let needsRefresh = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName && attributesToObserve.includes(mutation.attributeName)) {
                    const newValue = this.articleContainer.getAttribute(mutation.attributeName);
                    if (mutation.attributeName === 'data-src') {
                        needsReInitialize = true;
                    } else {
                        this.updateAttributeValue(mutation.attributeName, newValue);
                        needsRefresh = true;
                    }
                }
            });
            if (needsReInitialize) {
                 this.initialize().catch(e => console.error("Error re-initializing on attribute change", e));
            } else if (needsRefresh) {
                this.refresh();
            }
        });
        this.observer.observe(this.articleContainer, { attributes: true });
        this.observerActive = true;
    }

    public disableObserver(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.observerActive = false;
    }

    private updateAttributeValue(attributeName: string, value: string | null): void {
        // const oldCurrentPage = this.currentPage; // Not needed if refresh is called by observer
        switch (attributeName) {
            case 'data-control-limit': this.controlLimit = this.validateNumber(value, attributeName); break;
            case 'data-control-order': this.controlOrder = value?.toUpperCase() || 'ASC'; break;
            case 'data-control-start': this.controlStart = this.validateNumber(value, attributeName) || 0; break;
            case 'data-control-by': this.controlBy = value; break;
            case 'data-control-total': this.controlTotal = this.validateNumber(value, attributeName); break;
            case 'data-control-page': this.currentPage = Math.max(1, this.validateNumber(value, attributeName) || 1); break;
            case 'data-control-response-path': this.controlResponsePath = value; break;
            case 'data-control-filter': this.controlFilter = value; break;
        }
    }

    public setAttribute(attributeName: string, value: string | null): void {
        if (value === null) {
            this.articleContainer.removeAttribute(attributeName);
        } else {
            this.articleContainer.setAttribute(attributeName, value);
        }
        if (!this.observerActive && (attributeName.startsWith('data-control-'))) {
            this.updateAttributeValue(attributeName, value); 
            this.refresh();
        }
    }

    public dispatchEvent(type: SectionJSEventType, detail: Partial<SectionJSEventDetail> = {}): void {
        const eventDetail: SectionJSEventDetail = { instance: this, ...detail };
        this.articleContainer.dispatchEvent(new CustomEvent(type, { detail: eventDetail, bubbles: true }));
    }

    public destroy(): void {
        this.disableObserver();
        this.articleContainer.innerHTML = this.initialContainerStructureHTML; 
        this.articleContainer.removeAttribute('data-section-rendered');

        const index = SectionJS.instances.indexOf(this);
        if (index > -1) SectionJS.instances.splice(index, 1);

        SectionJS.instancesRefs = SectionJS.instancesRefs.filter(refOrInstance => {
            if (SectionJS.supportsWeakRef && refOrInstance instanceof WeakRef) {
                const instance = refOrInstance.deref();
                if (!instance || instance === this) {
                    if (SectionJS.finalizationRegistry && instance === this) {
                        // SectionJS.finalizationRegistry.unregister(refOrInstance); 
                    }
                    return false; 
                }
                return true; 
            } else {
                return refOrInstance !== this; 
            }
        });
        this.loopDefinitions.clear();
        this.allData = null;
        this.data = null;
    }

    public static destroyAll(): void {
        [...SectionJS.instances].forEach(instance => instance.destroy()); 
    }

    public static forceGarbageCollection(): void {
        if (typeof gc === 'function') {
            gc(); 
        } else {
            console.warn("gc() is not available in this environment.");
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SectionJS;
} else if (typeof window !== 'undefined') {
    (window as any).SectionJS = SectionJS;
}
