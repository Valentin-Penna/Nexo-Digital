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

Las rutas del servidor:

- `GET /api/noticias/listar` devuelve todas las noticias.
- `GET /api/noticias/obtener?id=` devuelve una.
- `POST /api/noticias` crea una noticia.
- `POST /api/noticias/actualizar` la modifica.
- `POST /api/noticias/eliminar` la borra.
- `POST /api/login` y `/api/sesion` abren, consultan y cierran la sesión.
- `GET /uploads/*` entrega las imágenes.

El código está en `src/main/java/com/nexodigital`: los servlets en `controller` y el acceso a datos en `model`. La parte del navegador está en `src/main/webapp/view`.

## Arrancarlo

Hace falta Docker.

```bash
docker compose up --build
```

- La web queda en http://localhost:8080
- phpMyAdmin, para mirar la base de datos, en http://localhost:8081

La base de datos se crea sola la primera vez con `mysql/init/bd_noticias.sql`, que también da de alta un administrador de prueba.

El `Dockerfile` compila el proyecto con Maven y lo deja en un Tomcat. Con ese mismo archivo y `railway.json` se desplegó en Railway.

## Lo que le falta

- La contraseña del administrador se guarda tal cual en la base de datos. Lo correcto sería guardar un hash (bcrypt).
- El usuario y la contraseña de MySQL que vienen en `docker-compose.yml` solo valen para trabajar en local.

El diseño de las pantallas está en [Figma](https://www.figma.com/design/CrbW65c5Zrm9dxAiWrIokQ/Nexo-Digital).
