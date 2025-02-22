# SecciónJS

SecciónJS es una librería JavaScript ligera y flexible que te permite renderizar contenido dinámicamente desde una fuente de datos. Con SecciónJS, puedes crear fácilmente listas paginadas, galerías de imágenes y otros componentes dinámicos en tu sitio web.

## Características

* **Renderizado dinámico:** Carga y muestra datos desde una URL remota.
* **Paginación:** Navega fácilmente entre grandes conjuntos de datos.
* **Plantillas:** Utiliza plantillas HTML para definir la estructura de tus componentes.
* **Personalización:** Configura la librería con atributos `data-*`.
* **Compatibilidad:** Funciona en la mayoría de los navegadores modernos y navegadores antiguos (gracias a Babel y Webpack).

## Instalación

1.  Clona el repositorio desde GitHub:

    ```bash
    git clone https://github.com/RonaldoRodriguez/seccionjs.git
    ```

2.  Navega hasta el directorio del proyecto:

    ```bash
    cd seccionjs
    ```

3.  Instala las dependencias:

    ```bash
    npm install
    ```

4.  Construye la librería:

    ```bash
    npm run build
    ```

5.  Los archivos generados se encontrarán en la carpeta `dist/`.


### Ejemplo rápido

En la carpeta `examples/` encontrarás ejemplos de uso de la librería. Para probarlos rápidamente, abre el archivo `index.html` en tu navegador.

## Uso

### Ejemplo básico

1.  Crea un contenedor para tus artículos con el atributo `data-section`:

    ```html
    <div data-section="https://jsonplaceholder.typicode.com/posts">
        <article>
            <h3>{{title}}</h3>
            <p>{{body}}</p>
        </article>
    </div>
    ```

### Ejemplo con paginación

1.  Crea un contenedor para tus artículos con el atributo `data-section` y `id="mi-contenedor"`:

    ```html
    <div id="mi-contenedor" data-section="https://jsonplaceholder.typicode.com/posts" data-limit="5">
        <article>
            <h3>{{title}}</h3>
            <p>{{body}}</p>
        </article>
    </div>
    ```

2.  Crea un contenedor de paginación con el atributo `data-target`:

    ```html
    <div class="pagination-container" data-target="mi-contenedor">
        <button data-action="prev">Anterior</button>
        <span data-action="info"></span>
        <button data-action="next">Siguiente</button>
    </div>
    ```

### Ejemplo completo

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <title>SecciónJS</title>
    <style>
        .pagination-container {
            display: flex;
         justify-content:center;
            margin-top: 20px;
        }

        .pagination-container button,
        .pagination-container span {
            margin: 0 5px;
            padding: 5px 10px;
            border: 1px solid #ccc;
            cursor: pointer;
        }

        .pagination-container button:disabled {
            opacity: 0.5;
            cursor: default;
        }
    </style>
</head>
<body>
    <main>
        <section class="container-fluid">
            <div class="pagination-container mb-2" data-target="posts-container" >
                <button data-action="prev">Previous</button>
                <span  data-action="info"></span>
                <button data-action="next">Next</button>
            </div>
            <div class="row" id="posts-container" data-section="https://jsonplaceholder.org/posts" data-limit="5" data-order="asc" data-by="id">
            <!--Bootstrap: class-->
                <article class="col-md-6">
                    <h2>{{title}}</h2>
                    <a href="{{url}}">{{title}}</a>
                    <br />
                    <img data-src="{{image}}" loading="lazy" width="200">
                    <p>{{content}}</p>
                </article>
                <!--Bootstrap: class-->
            </div>

        </section>
        <section class="container-fluid">
            <div class="pagination-container" data-target="users-container">
                <button data-action="prev">Previous</button>
                <span data-action="info"></span>
                <button data-action="next">Next</button>
            </div>
            <div class="row" id="users-container" data-section="https://jsonplaceholder.org/users" data-limit="5" data-order="asc" data-by="id">
            <!--Bootstrap: class-->
                <article class="col-md-6">
                    <h2>{{name}}</h2>
                    <p>{{username}}</p>
                    <p>{{email}}</p>
                    <p>{{phone}}</p>
                    <p>{{website}}</p>
                    <p>{{address.street}}</p>
                    <p>{{address.suite}}</p>
                    <p>{{address.city}}</p>
                    <p>{{address.zipcode}}</p>
                    <p>{{company.name}}</p>
                    <p>{{company.catchPhrase}}</p>
                    <p>{{company.bs}}</p>
                </article>
                <!--Bootstrap: class-->
            </div>
        </section>
    </main>
    <script src="../main/sectionjs.js"></script>
</body>
</html>
```
## Atributos `data-*`

  * **`data-section`**: La URL de la fuente de datos.
  * **`data-limit`**: El número de artículos por página.
  * **`data-order`**: El orden de clasificación de los datos (`ASC` o `DESC`).
  * **`data-by`**: El campo por el cual ordenar los datos.
  * **`data-start`**: El índice de inicio para los datos.
  * **`data-total`**: El número total de artículos (opcional).
  * **`data-default-page`**: La página inicial a mostrar (opcional).
  * **`data-local-order`**: Ordena los datos localmente en el navegador (`asc` o `desc`).

  ### Atributos de paginación

  * **`data-target`**: El `id` del contenedor de artículos que se paginará. Este atributo se utiliza en el contenedor de paginación para vincularlo con el contenedor de artículos correspondiente.
  * **`data-action`**: La acción que realizará el botón de paginación. Puede ser `prev` para el botón anterior, `next` para el botón siguiente o `info` para el elemento que muestra la información de la página actual.


    ### Explicación:

    * **`data-target`**: Este atributo se utiliza en el contenedor de paginación para especificar a qué contenedor de artículos se aplicará la paginación. El valor de este atributo debe coincidir con el `id` del contenedor de artículos.

    * **`data-action`**: Este atributo se utiliza en los botones de paginación para indicar qué acción realizarán. Los valores posibles son:

    * `prev`: Para el botón que muestra la página anterior.
    * `next`: Para el botón que muestra la página siguiente.
    * `info`: Para el elemento que muestra la información de la página actual (por ejemplo, "Página 2 de 5").

## Uso en producción

Para usar la librería en producción, se recomienda compilar los archivos minificados utilizando el ya mencionado `npm run build` comando.


Los archivos minificados se encontrarán en la carpeta `dist/`. Puedes elegir entre `sectionjs-latest.min.js` (para navegadores modernos) o `sectionjs-legacy.min.js` (para navegadores antiguos).

## Compatibilidad con navegadores modernos

SectionJS latest es compatible con la mayoría de los navegadores modernos:

* **Firefox 52+**
* **Safari 10.1+**
* **Edge 15+**
* **Chrome 55+**

Si necesitas compatibilidad con navegadores antiguos, puedes utilizar la versión "legacy" de SectionJS, que se genera utilizando Babel y Webpack para asegurar la compatibilidad con navegadores más antiguos.

## Licencia

SecciónJS está licenciada bajo la [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html).

## Contribución

¡Las contribuciones son bienvenidas! Si encuentras un error o tienes una sugerencia, por favor abre un issue o envía un pull request.

## Autor

Ronaldo Jose Rodriguez Urbaneja

## Enlaces

  * [Repositorio de GitHub](https://github.com/RonaldoRodriguez/seccionjs)
  * [Página de demostración](https://ronaldorodriguez.github.io/sectionjs/)
