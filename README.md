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

Esta documentación proporciona una visión general de la clase `SectionJS`. Para más detalles, consulta el código fuente y los comentarios incluidos en él.
