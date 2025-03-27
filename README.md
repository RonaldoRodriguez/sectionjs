# Documentación de la Clase `SectionJS`

La clase `SectionJS` es una herramienta diseñada para gestionar y renderizar secciones dinámicas en una página web. Permite cargar datos desde una fuente externa, paginar los datos, y actualizar la interfaz de usuario en función de los cambios en los atributos del contenedor. A continuación se detalla la funcionalidad y uso de esta clase.

---

## Índice

1. [Introducción](#introducción)
2. [Instalación y Uso](#instalación-y-uso)
3. [Propiedades](#propiedades)
4. [Métodos](#métodos)
   - [Constructor](#constructor)
   - [enableObserver](#enableobserver)
   - [disableObserver](#disableobserver)
   - [refresh](#refresh)
   - [initAll](#initall)
   - [initSelf](#initself)
   - [apply](#apply)
   - [setAttribute](#setattribute)
5. [Eventos](#eventos)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Consideraciones](#consideraciones)

---

## Introducción

`SectionJS` es una clase que facilita la creación de secciones dinámicas en una página web. Permite cargar datos desde una URL, paginarlos, y renderizarlos en un contenedor HTML. Además, incluye funcionalidades como la detección de cambios en los atributos del contenedor y la actualización automática de la interfaz.

---

## Instalación y Uso

Para utilizar `SectionJS`, simplemente incluye el archivo JavaScript que contiene la clase en tu proyecto y sigue los pasos a continuación:

1. **Estructura HTML**: Asegúrate de tener un contenedor con el atributo `data-section` que apunte a la URL de los datos.

   ```html
   <div id="mySection" data-section="https://api.example.com/data"></div>
   ```

2. **Inicialización**: Inicializa `SectionJS` llamando al método `initAll`.

   ```javascript
   SectionJS.initAll();
   ```

3. **Personalización**: Puedes modificar los atributos del contenedor para cambiar el comportamiento de la sección (paginación, ordenamiento, etc.).

---

## Propiedades

| Propiedad               | Tipo                     | Descripción                                                                 |
|-------------------------|--------------------------|-----------------------------------------------------------------------------|
| `instances`             | `SectionJS[]`            | Lista de todas las instancias de `SectionJS` creadas.                       |
| `articleContainer`       | `HTMLElement`            | Contenedor HTML donde se renderizarán los datos.                            |
| `articleTemplate`        | `Element \| null`        | Plantilla para renderizar cada artículo.                                    |
| `infoTemplates`          | `Element[] \| null`      | Plantillas para los elementos de información (paginación, etc.).            |
| `spanElements`           | `Element[]`              | Elementos que muestran información adicional (paginación, etc.).            |
| `dataSourceURL`          | `string \| null`         | URL de la fuente de datos.                                                  |
| `limit`                  | `number \| null`         | Número máximo de elementos por página.                                      |
| `order`                  | `string`                 | Orden de los datos (`ASC` o `DESC`).                                        |
| `start`                  | `number`                 | Índice de inicio para la paginación.                                        |
| `orderBy`                | `string \| null`         | Atributo por el cual ordenar los datos.                                     |
| `total`                  | `number \| null`         | Número total de elementos.                                                  |
| `defaultPage`            | `number`                 | Página por defecto al cargar la sección.                                    |
| `currentPage`            | `number`                 | Página actual.                                                              |
| `data`                   | `any[] \| null`          | Datos cargados desde la fuente.                                             |
| `responsePath`           | `string \| null`         | Ruta dentro del JSON de respuesta para obtener los datos.                   |
| `findKey`                | `string \| null`         | Clave para buscar un valor específico en los datos.                         |
| `observer`               | `MutationObserver \| null` | Observador de cambios en los atributos del contenedor.                     |
| `observerActive`         | `boolean`                | Indica si el observador está activo.                                        |

---

## Métodos

### Constructor

```typescript
constructor(articleContainer: HTMLElement)
```

Inicializa una nueva instancia de `SectionJS`.

- **Parámetros**:
  - `articleContainer`: Contenedor HTML donde se renderizarán los datos.

---

### enableObserver

```typescript
public enableObserver(): void
```

Activa el `MutationObserver` para detectar cambios en los atributos del contenedor.

---

### disableObserver

```typescript
public disableObserver(): void
```

Desactiva el `MutationObserver`.

---

### refresh

```typescript
private async refresh(): Promise<void>
```

Actualiza la sección en función de los cambios en los atributos del contenedor.

---

### initAll

```typescript
public static async initAll(): Promise<void>
```

Inicializa todas las instancias de `SectionJS` en la página.

---

### initSelf

```typescript
public async initSelf(): Promise<void>
```

Inicializa la instancia actual de `SectionJS`.

---

### apply

```typescript
public static async apply(containerId: string, attributeName: string, attributeValue: string | number): Promise<void>
```

Aplica un cambio en un atributo del contenedor y refresca la sección.

- **Parámetros**:
  - `containerId`: ID del contenedor.
  - `attributeName`: Nombre del atributo a cambiar.
  - `attributeValue`: Nuevo valor del atributo.

---

### setAttribute

```typescript
public async setAttribute(attributeName: string, attributeValue: string | number): Promise<void>
```

Cambia un atributo del contenedor y refresca la sección.

- **Parámetros**:
  - `attributeName`: Nombre del atributo a cambiar.
  - `attributeValue`: Nuevo valor del atributo.

---

## Eventos

| Evento                  | Descripción                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| `sectionjs:datachanged`  | Se dispara cuando los datos han cambiado.                                   |
| `sectionjs:rendered`     | Se dispara cuando la sección ha sido renderizada.                           |
| `sectionjs:getdata`      | Se dispara para obtener datos específicos de la sección.                    |

---

## Ejemplos de Uso

### Ejemplo 1: Inicialización Básica

```html
<div id="mySection" data-section="https://api.example.com/data"></div>
<script>
  SectionJS.initAll();
</script>
```

### Ejemplo 2: Cambiar un Atributo Dinámicamente

```javascript
SectionJS.apply('mySection', 'data-limit', 10);
```

### Ejemplo 3: Escuchar Eventos

```javascript
document.getElementById('mySection').addEventListener('sectionjs:rendered', (event) => {
  console.log('Sección renderizada:', event.detail.pageData);
});
```

---

## Consideraciones

- **Compatibilidad**: Asegúrate de que tu navegador soporte `MutationObserver` y `fetch`.
- **Rendimiento**: Evita cambios frecuentes en los atributos del contenedor para optimizar el rendimiento.
- **Manejo de Errores**: Implementa manejo de errores personalizado si es necesario.

---

## Tabla de Atributos `data-*` en `SectionJS`

* `data-by`: *(En el contenedor principal)* Especifica el nombre del atributo dentro de los objetos del array de datos por el cual se deben ordenar los elementos renderizados.
* `data-default-page`: *(En el contenedor principal)* Establece la página que se mostrará por defecto al cargar la sección. Debe ser un número entero mayor o igual a 1.
* `data-find`: *(En el contenedor principal)* Especifica la ruta dentro del JSON de respuesta para buscar un valor específico. El valor encontrado se asignará al atributo `data-find-value` del contenedor.
* `data-find-default`: *(En el contenedor principal)* Define un valor por defecto para el atributo `data-find-value` si la ruta especificada en `data-find` no devuelve ningún valor.
* `data-find-value`: *(En el contenedor principal)* Este atributo es **establecido dinámicamente** por la clase `SectionJS`. Contiene el valor encontrado en los datos según la ruta especificada en `data-find`, o el valor por defecto de `data-find-default`.
* `data-limit`: *(En el contenedor principal)* Define el número máximo de elementos que se mostrarán por página. Si no se especifica, se mostrarán todos los elementos cargados en una sola página.
* `data-order`: *(En el contenedor principal)* Especifica el orden en que se deben mostrar los elementos renderizados. Los valores aceptados son `ASC` (ascendente) o `DESC` (descendente). El ordenamiento se aplica según el atributo especificado en `data-by`.
* `data-response-path`: *(En el contenedor principal)* Define la ruta dentro del objeto JSON de la respuesta de la fuente de datos para acceder al array de elementos que se deben renderizar. Por ejemplo, si la respuesta es `{ "results": [...] }`, el valor de este atributo sería `results`.
* `data-section`: *(En el contenedor principal)* Obligatorio. Contiene la URL de la fuente de datos (generalmente un archivo JSON o una API) de donde se cargarán los datos para la sección.
* `data-section-action="info"`: *(En elementos dentro del contenedor principal o en elementos externos con `data-target`)* Indica que este elemento mostrará información dinámica sobre la sección, como el número de página actual, el total de páginas, el número de elementos mostrados, etc. Su contenido se actualiza automáticamente.
* `data-section-rendered="true"`: *(En el contenedor principal)* Este atributo es **establecido dinámicamente** por la clase `SectionJS` una vez que los datos iniciales han sido renderizados en el contenedor.
* `data-section-render`: *(En un elemento hijo del contenedor principal)* Marca este elemento como la plantilla HTML que se utilizará para renderizar cada elemento de los datos cargados. El primer elemento hijo del contenedor que no tenga el atributo `data-section-static` o que explícitamente tenga `data-section-render` se tomará como plantilla.
* `data-section-static`: *(En elementos hijos del contenedor principal)* Indica que este elemento es estático y no debe ser considerado como la plantilla de renderizado ni ser eliminado durante el proceso de renderizado. Estos elementos se mantienen en su lugar.
* `data-src`: *(En elementos `img`, `audio`, `video` dentro de la plantilla)* Si este atributo está presente, su valor se asignará al atributo `src` del elemento durante el proceso de renderizado. Esto permite usar una URL dinámica para la fuente de los elementos multimedia basada en los datos.
* `data-start`: *(En el contenedor principal)* Define el índice inicial (basado en cero) desde el cual se deben tomar los elementos del array de datos para la paginación. Por ejemplo, si `data-start="10"` y `data-limit="5"`, la primera página mostrará los elementos del índice 10 al 14.
* `data-target="{contenedorId}"`: *(En elementos externos, especialmente botones de paginación y elementos con `data-action="info"`)* Asocia este elemento con un contenedor `data-section` específico mediante su `id`. Esto permite controlar o mostrar información de secciones específicas desde fuera de su contenedor principal.
* `data-total`: *(En el contenedor principal)* Especifica el número total de elementos disponibles en la fuente de datos. Esto es útil para la paginación cuando la fuente de datos no proporciona el total directamente o cuando se está mostrando un subconjunto de los datos.

---

Esta documentación proporciona una visión general de la clase `SectionJS`. Para más detalles, consulta el código fuente y los comentarios incluidos en él.
