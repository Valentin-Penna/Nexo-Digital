# Nexo Digital

Un periódico digital hecho sin frameworks. Tiene una portada pública con las noticias y un panel privado desde el que el administrador las publica, las edita y las borra, cada una con su imagen.

Aquí no hay Spring, ni un ORM, ni React que hagan el trabajo. Cada clic recorre a mano el camino entero: el JavaScript del navegador llama a un servlet, el servlet llama a un DAO y el DAO habla con MySQL por JDBC.

## Qué hace

- Portada con las noticias en una rejilla que pasa de tres columnas a dos y a una según el ancho de la pantalla, y una página para leer cada noticia.
- Inicio de sesión del administrador con sesión en el servidor. Crear, editar y borrar comprueban esa sesión en el propio servlet, no solo en el navegador.
- Panel para gestionar las noticias, con subida de imagen.
- Las imágenes se guardan en una carpeta aparte de la aplicación (`/datos_persistentes`) y las entrega un servlet propio.

## Cómo está montado

```
navegador (HTML, CSS, JS con fetch)
        │  JSON
servlets de Jakarta EE 6 en Tomcat 10.1
        │
DAO, uno por operación
        │  JDBC
MySQL 8
```

Está escrito en Java 21 y se compila con Maven. Las respuestas van en JSON con Gson.

Las noticias se exponen como un recurso REST, con un único servlet que atiende cada verbo HTTP:

- `GET /api/noticias` devuelve todas las noticias.
- `GET /api/noticias/{id}` devuelve una.
- `POST /api/noticias` crea una y responde `201 Created` con su ruta en la cabecera `Location`.
- `PUT /api/noticias/{id}` la modifica.
- `DELETE /api/noticias/{id}` la borra y responde `204 No Content`.
- `POST /api/login` abre la sesión del administrador; `GET /api/sesion` la consulta y `DELETE /api/sesion` la cierra.
- `GET /uploads/*` entrega las imágenes.

El código está en `src/main/java/com/nexodigital`: los servlets en `controller` y el acceso a datos en `model`. La parte del navegador está en `src/main/webapp/view`.

## Por qué estas tecnologías

- **Jakarta EE y JDBC, sin frameworks.** Hacer a mano cada capa (servlet, DAO, consulta SQL) obliga a entender lo que Spring o un ORM harían por debajo: sesiones, peticiones HTTP, conexiones y consultas.
- **MySQL**, una base de datos relacional, porque las noticias y los usuarios encajan bien en tablas.
- **Docker.** La aplicación, MySQL y phpMyAdmin se levantan juntos con Docker Compose, y la base de datos se crea sola con su esquema. El mismo `Dockerfile`, que compila con Maven y sirve la aplicación en Tomcat, es el que usa el despliegue en Railway.

## Lo que le falta

- La contraseña del administrador se guarda tal cual en la base de datos. Lo correcto sería guardar un hash (bcrypt).
- El usuario y la contraseña de MySQL que vienen en `docker-compose.yml` solo valen para trabajar en local.

El diseño de las pantallas está en [Figma](https://www.figma.com/design/CrbW65c5Zrm9dxAiWrIokQ/Nexo-Digital).
