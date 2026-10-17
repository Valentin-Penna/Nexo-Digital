

document.addEventListener('DOMContentLoaded', function() {

    comprobarSesionAdmin();

    document.getElementById('boton-nueva-noticia').onclick = function() {
        abrirModalNoticia();
    };

    document.getElementById('boton-cerrar-modal-noticia').onclick = function() {
        cerrarModal('ventana-emergente-noticia');
    };

    document.getElementById('formulario-noticia').onsubmit = guardarNoticia;

    document.getElementById('boton-cerrar-sesion').onclick = cerrarSesion;

    document.getElementById('campo-archivo-imagen').addEventListener('change', function() {
        var elementoTextoArchivo = document.getElementById('texto-nombre-archivo');
        if (this.files && this.files.length > 0) {
            elementoTextoArchivo.textContent = this.files[0].name;
        } else {
            elementoTextoArchivo.textContent = 'Ningún archivo seleccionado';
        }
    });
});

function comprobarSesionAdmin() {

    fetch('../api/sesion', {
        method: 'GET'
    })
        
        .then(function(respuestaServidor) {
            return respuestaServidor.json();
        })
        
        .then(function(datosSesion) {
            if (!datosSesion.logueado) {

                window.location.href = 'index.html';
            } else {
                
                cargarNoticiasAdmin();
            }
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al comprobar sesión de admin:', errorDetectado);
            window.location.href = 'index.html';
        });
}

function cerrarSesion(eventoClick) {
    
    eventoClick.preventDefault();

    fetch('../api/sesion', {
        method: 'DELETE'
    })
        
        .then(function(respuestaServidor) {
            window.location.href = 'index.html';
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al cerrar sesión:', errorDetectado);
            window.location.href = 'index.html';
        });
}

var listaNoticiasGlobales = [];

function cargarNoticiasAdmin() {
    
    fetch('../api/noticias', {
        method: 'GET'
    })
        
        .then(function(respuestaServidor) {
            return respuestaServidor.json();
        })
        
        .then(function(listaDeNoticias) {
            
            listaNoticiasGlobales = listaDeNoticias;
            
            renderTablaNoticias();
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al cargar noticias:', errorDetectado);
        });
}

function renderTablaNoticias() {
    var contenedorListaHtml = document.getElementById('lista-noticias');

    contenedorListaHtml.innerHTML = '';

    listaNoticiasGlobales.forEach(function(noticiaActual) {
        var elementoHtmlFila = document.createElement('div');
        elementoHtmlFila.className = 'fila-noticia';

        elementoHtmlFila.innerHTML =
            '<span class="titulo-lista-admin">' + noticiaActual.titulo + '</span>' +
            '<button class="btn-azul boton-grande" onclick=\'abrirModalNoticia(' +
            JSON.stringify(noticiaActual).replace(/'/g, '&apos;') +
            ')\'>Editar</button>';

        contenedorListaHtml.appendChild(elementoHtmlFila);
    });
}

function abrirModalNoticia(objetoNoticia) {
    
    objetoNoticia = objetoNoticia || null;

    var formularioHtml      = document.getElementById('formulario-noticia');
    var botonEliminarHtml   = document.getElementById('boton-eliminar-noticia');
    var botonGuardarHtml    = document.getElementById('boton-guardar-noticia');

    formularioHtml.reset();

    if (objetoNoticia) {
        
        document.getElementById('titulo-ventana-emergente').textContent = 'Editar noticia';

        document.getElementById('campo-oculto-id').value              = objetoNoticia.id;
        document.getElementById('campo-titulo').value    = objetoNoticia.titulo;
        document.getElementById('campo-autor').value     = objetoNoticia.autor || '';
        document.getElementById('campo-contenido').value       = objetoNoticia.contenido;

        var elementoTextoArchivo = document.getElementById('texto-nombre-archivo');
        if (objetoNoticia.nombreImagen && objetoNoticia.nombreImagen !== 'null' && objetoNoticia.nombreImagen !== '') {
            
            elementoTextoArchivo.textContent = objetoNoticia.nombreImagen;
            
            formularioHtml.dataset.tieneImagen = 'true';
        } else {
            
            elementoTextoArchivo.textContent = 'Ningún archivo seleccionado';
            
            formularioHtml.dataset.tieneImagen = 'false';
        }

        botonGuardarHtml.textContent = 'Guardar';

        botonEliminarHtml.style.display = 'block';

        var idNoticia = objetoNoticia.id;
        botonEliminarHtml.onclick = function() {
            eliminarNoticia(idNoticia);
        };

    } else {
        
        document.getElementById('titulo-ventana-emergente').textContent = 'Crear noticia';
        document.getElementById('campo-oculto-id').value                 = '';
        document.getElementById('texto-nombre-archivo').textContent      = 'Ningún archivo seleccionado';
        botonGuardarHtml.textContent = 'Crear';

        formularioHtml.dataset.tieneImagen = 'false';

        botonEliminarHtml.style.display = 'none';
    }

    abrirModal('ventana-emergente-noticia');
}

function guardarNoticia(eventoSubmit) {
    
    eventoSubmit.preventDefault();

    var datosDelFormulario = new FormData(eventoSubmit.target);

    var formulario     = eventoSubmit.target;
    var tieneImagen    = formulario.dataset.tieneImagen === 'true';
    var archivoElegido = datosDelFormulario.get('imagen');
    var hayArchivoNuevo = archivoElegido && archivoElegido.size > 0;

    if (!tieneImagen && !hayArchivoNuevo) {
        
        alert('La imagen es obligatoria. Por favor, selecciona un archivo de imagen.');
        
        document.getElementById('campo-archivo-imagen').focus();
        return;
    }

    var idNoticia = datosDelFormulario.get('id');

    var urlDestinoBackend;
    var metodoHttp;
    if (idNoticia) {
        
        urlDestinoBackend = '../api/noticias/' + idNoticia;
        metodoHttp = 'PUT';
    } else {
        
        urlDestinoBackend = '../api/noticias';
        metodoHttp = 'POST';
    }

    fetch(urlDestinoBackend, {
        method: metodoHttp,
        body: datosDelFormulario
    })
        
        .then(function(respuestaServidor) {
            if (respuestaServidor.ok) {
                
                cerrarModal('ventana-emergente-noticia');
                cargarNoticiasAdmin();
            } else {

                return respuestaServidor.json()
                    .then(function(datosErrorJson) {
                        alert('Error: ' + (datosErrorJson.message || respuestaServidor.status));
                    })
                    
                    .catch(function() {
                        alert('Error: ' + respuestaServidor.status);
                    });
            }
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al guardar noticia:', errorDetectado);
        });
}

function eliminarNoticia(idNoticia) {

    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;

    fetch('../api/noticias/' + idNoticia, {
        method: 'DELETE'
    })
        
        .then(function(respuestaServidor) {
            if (respuestaServidor.ok) {
                
                cerrarModal('ventana-emergente-noticia');
                cargarNoticiasAdmin();
            } else {
                alert('Error al eliminar noticia');
            }
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al eliminar noticia:', errorDetectado);
        });
}

function abrirModal(idDelModal) {
    document.getElementById(idDelModal).style.display = 'flex';
}

function cerrarModal(idDelModal) {
    document.getElementById(idDelModal).style.display = 'none';
}

