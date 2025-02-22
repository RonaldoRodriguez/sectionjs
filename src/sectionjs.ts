/**
 * Obtiene datos de una URL.
 * @param {string} url La URL de la fuente de datos.
 * @returns {Promise<any>} Una promesa que resuelve con los datos.
 */
async function fetchData(url: string): Promise<any> {
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
      }
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
          return await response.json();
      } else {
          return await response.text();
      }
  } catch (error) {
      console.error("Error al obtener datos:", error);
      throw error;
  }
}

/**
* Carga los datos de una URL y los devuelve en formato JSON.
* @param {string} url La URL de la fuente de datos.
* @returns {Promise<any>} Una promesa que resuelve con los datos en formato JSON.
*/
async function loadData(url: string): Promise<any> {
  try {
      const data = await fetchData(url);
      return data;
  } catch (error) {
      console.error("Error al cargar datos:", error);
      throw error;
  }
}

/**
* Función auxiliar para seleccionar elementos del DOM.
* @param {string} selector El selector CSS del elemento.
* @returns {Element} El elemento del DOM seleccionado.
*/
function selectElement(selector: string): Element | null {
  return document.querySelector(selector);
}

/**
* Función auxiliar para validar un atributo numérico.
* @param {string} value El valor del atributo.
* @param {string} attributeName El nombre del atributo.
* @returns {number|null} El valor numérico del atributo si es válido, o null si no lo es.
*/
function validateNumericAttribute(value: string | null | undefined, attributeName: string): number | null {
  if (value === null || value === undefined || value === "") {
      return null; // Valor no especificado
  }

  const number = Number(value);
  if (isNaN(number)) {
      console.error(`Error: El atributo ${attributeName} debe ser un número.`);
      return null; // Valor inválido
  }

  return number;
}

/**
* Obtiene las claves únicas de los placeholders en un texto.
* @param {string} text El texto que contiene los placeholders.
* @returns {string[]} Un array con las claves únicas de los placeholders.
*/
function getPlaceholderKeys(text: string): string[] {
  const placeholders = text.match(/{{(.*?)}}/g);
  if (!placeholders) return [];

  return placeholders.map(placeholder => placeholder.replace('{{', '').replace('}}', ''));
}

/**
* Obtiene el valor de una clave anidada en un objeto.
* @param {object} obj El objeto donde buscar la clave.
* @param {string} key La clave anidada (ej: 'login.uuid').
* @returns {any} El valor de la clave anidada, o una cadena vacía si no se encuentra.
*/
function getNestedValue(obj: any, key: string): any {
  const keys = key.split('.');
  let value = obj;
  for (const k of keys) {
      if (value && typeof value === 'object' && value[k] !== undefined && value[k] !== null) {
          value = value[k];
      } else {
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
function replacePlaceholders(text: string, data: any): string {
  let result = text;
  getPlaceholderKeys(text).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = getNestedValue(data, key);
      result = result.replace(placeholder, value);
  });
  return result;
}

/**
* Procesa los atributos de un elemento, reemplazando los placeholders.
* @param {Element} element El elemento cuyos atributos se procesarán.
* @param {object} data El objeto con los datos para reemplazar los placeholders.
*/
function processElementAttributes(element: Element, data: any): void {
  for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes[i];
      element.setAttribute(attribute.name, replacePlaceholders(attribute.value, data));
  }
}

/**
* Procesa los nodos de texto de un elemento, reemplazando los placeholders.
* @param {Element} element El elemento cuyos nodos de texto se procesarán.
* @param {object} data El objeto con los datos para reemplazar los placeholders.
*/
function processTextNodes(element: Element, data: any): void {
  const textNodes: Node[]|null|undefined|any[] = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
  textNodes.forEach(textNode => {
      textNode.textContent = replacePlaceholders(textNode.textContent, data);
  });
}

/**
* Asigna data-src a src para imágenes y otros elementos multimedia.
* @param {Element} element El elemento multimedia.
*/
function assignDataSrcToSrc(element: Element|any): void {
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
function renderArticles(articleContainer: Element|any, articleTemplate: Element|any, pageData: any[]) {
  articleContainer.innerHTML = "";

  // Ordenamiento local
  const localOrder = articleContainer.getAttribute('data-local-order');
  if (localOrder === 'asc') {
      pageData.sort((a, b) => a.id - b.id); // Ordenar por id ascendente (ejemplo)
  } else if (localOrder === 'desc') {
      pageData.sort((a, b) => b.id - a.id); // Ordenar por id descendente (ejemplo)
  }

  pageData.forEach((articleData: any) => {
      const article: Element|any = articleTemplate.cloneNode(true);
      const elements = article.querySelectorAll('*');
      elements.forEach((element: Element|any) => {
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
async function initializeSectionJS(): Promise<void> {
  const articleContainers: NodeListOf<Element>|any = document.querySelectorAll('[data-section]');

  for (const articleContainer of articleContainers) {
      const articleTemplate = articleContainer?.firstElementChild;
      const dataSourceURL = articleContainer?.getAttribute('data-section');
      let limit = validateNumericAttribute(articleContainer.getAttribute('data-limit'), 'data-limit');
      limit = limit !== null && limit >= 0 ? (limit === 0 ? null : limit) : null;
      const order = articleContainer.getAttribute('data-order') || 'ASC';
      const start = validateNumericAttribute(articleContainer.getAttribute('data-start'), 'data-start') || 0;
      const orderBy = articleContainer.getAttribute('data-by');
      let total = validateNumericAttribute(articleContainer.getAttribute('data-total'), 'data-total');
      total = total !== null && total >= 0 ? total : null;
      const defaultPage = Math.max(1, (validateNumericAttribute(articleContainer.getAttribute('data-default-page'), 'data-default-page') || 1));

      if (!articleTemplate || !dataSourceURL || !articleContainer) {
          console.error("Elementos DOM no encontrados.");
          continue;
      }

      const orderDirection = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
      let pageSize: number;
      let currentPage = defaultPage;

      try {
          let data = await loadData(dataSourceURL);
          if (!data || !Array.isArray(data)) {
              throw new Error("Datos de base de datos inválidos.");
          }

          // Aplicar data-total si está presente
          if (total !== null) {
              if (total === 0) {
                  articleContainer.innerHTML = "<p>No hay datos disponibles.</p>";
                  continue;
              }
              data = data.slice(0, total);
          }

          // Ordenamiento inicial
          if (orderBy) {
              data.sort((a: any, b: any) => {
                  const aValue = a[orderBy];
                  const bValue = b[orderBy];
                  if (orderDirection === 'asc') {
                      return aValue > bValue ? 1 : -1;
                  } else {
                      return aValue < bValue ? 1 : -1;
                  }
              });
          } else if (orderDirection === 'desc') {
              data.reverse(); // Invertir si no hay data-by
          }

          //pageSize = limit !== null && limit > 0 ? limit : data.length;
          //pageSize = Math.min(pageSize, data.length);
          pageSize = limit !== null && limit > 0 ? limit : data.length;



          function getPageData(page = currentPage) {
              let startIndex, endIndex;

              if (orderDirection === 'desc') {
                  startIndex = (page - 1) * pageSize + start; // Corregido: startIndex se calcula correctamente
                  endIndex = startIndex + pageSize; // Corregido: endIndex se calcula correctamente

                  startIndex = Math.max(0, startIndex);
                  endIndex = Math.min(data.length, endIndex);
              } else {
                  startIndex = (page - 1) * pageSize + start;
                  endIndex = startIndex + pageSize;

                  if (limit !== null && limit > 0) {
                      endIndex = Math.min(endIndex, startIndex + limit);
                  }
              }

              if (total !== null) {
                  endIndex = Math.min(endIndex, total);
              }

              return data.slice(startIndex, endIndex);
          }

          function getTotalPages() {
              if (limit === null || limit === 0) {
                  return 1;
              }
              return Math.ceil(data.length / pageSize);
          }

          currentPage = Math.min(defaultPage, getTotalPages());

          renderArticles(articleContainer, articleTemplate, getPageData(currentPage));

          // Obtener el contenedor de paginación y el data-target del contenedor padre
          const paginationContainer: Element | null = articleContainer.previousElementSibling;
          const dataTarget: string | null | undefined = paginationContainer?.getAttribute('data-target');

          // Validar data-target
          if (!dataTarget || dataTarget !== articleContainer.id) {
              console.warn(`Advertencia: El contenedor de paginación anterior al contenedor de artículos "${articleContainer.id}" no tiene un data-target válido. Se ignorará la paginación.`);
              continue;
          }

          // Obtener los botones de paginación usando data-target del contenedor padre
          const previousButton: HTMLButtonElement | null = paginationContainer?.querySelector(`button[data-action="prev"]`) as HTMLButtonElement | null;
          const pageInfo: HTMLSpanElement | null = paginationContainer?.querySelector(`span[data-action="info"]`) as HTMLButtonElement | null;
          const nextButton: HTMLButtonElement | null = paginationContainer?.querySelector(`button[data-action="next"]`) as HTMLButtonElement | null;

          function managePaginationButtons() {
              if (!previousButton || !nextButton) return;

              const totalPages = getTotalPages();
              previousButton.disabled = currentPage === 1;
              nextButton.disabled = currentPage === totalPages;

              if (totalPages <= 1) {
                  previousButton.style.display = 'none';
                  nextButton.style.display = 'none';
              } else {
                  previousButton.style.display = 'block';
                  nextButton.style.display = 'block';
              }

              if (pageInfo) {
                  pageInfo.textContent = `${currentPage}/${totalPages}`;
              }
          }

          function handlePreviousButtonClick(): void {
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

          if (previousButton) {
              previousButton.addEventListener("click", handlePreviousButtonClick);
          }

          if (nextButton) {
              nextButton.addEventListener("click", handleNextButtonClick);
          }

          managePaginationButtons();
      } catch (error) {
          console.error("Error en la función initializeSectionJS:", error);
          articleContainer.innerHTML = "<p>Error al cargar datos.</p>";
      }
  }
}
document.addEventListener("DOMContentLoaded", function() {
  initializeSectionJS();
});