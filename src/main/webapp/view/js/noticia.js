

document.addEventListener('DOMContentLoaded', function() {

    cargarNoticiaIndividual();

    comprobarSesion();

    document.getElementById('boton-abrir-login').onclick = function(evento) {
        
        evento.preventDefault();
        abrirModal('ventana-emergente-login');
    };

    document.getElementById('boton-cerrar-login').onclick = function() {
        cerrarModal('ventana-emergente-login');
    };

    document.getElementById('formulario-login').onsubmit = iniciarSesion;
});

function cargarNoticiaIndividual() {

    var parametrosUrl = new URLSearchParams(window.location.search);

    var idNoticiaUrl = parametrosUrl.get('id');

    var elementoHtmlTitulo = document.getElementById('titulo-noticia');

    if (!elementoHtmlTitulo) return;

    if (!idNoticiaUrl) {
        elementoHtmlTitulo.textContent = 'Noticia no encontrada';
        return;
    }

    fetch('../api/noticias/' + encodeURIComponent(idNoticiaUrl), {
        method: 'GET'
    })
        
        .then(function(respuestaServidor) {

            if (!respuestaServidor.ok) {
                throw new Error('Error HTTP: ' + respuestaServidor.status);
            }
            
            return respuestaServidor.json();
        })
        
        .then(function(noticiaRecibida) {

            document.getElementById('titulo-noticia').textContent = noticiaRecibida.titulo;

            var elementoHtmlMeta = document.getElementById('metadatos-noticia');

            var textoAutor;
            if (noticiaRecibida.autor) {
                
                textoAutor = noticiaRecibida.autor;
            } else {
                
                textoAutor = 'Autor desconocido';
            }

            var textoFecha;
            if (noticiaRecibida.fechaPublicacion) {

                textoFecha = new Date(noticiaRecibida.fechaPublicacion).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            } else {
                
                textoFecha = '';
            }

            elementoHtmlMeta.innerHTML = '<span>' + textoAutor + '</span><span>' + textoFecha + '</span>';

            var elementoHtmlImagen = document.getElementById('campo-archivo-imagen');
            if (noticiaRecibida.nombreImagen && noticiaRecibida.nombreImagen !== 'null' && noticiaRecibida.nombreImagen !== '') {
                
                elementoHtmlImagen.src          = '../uploads/' + noticiaRecibida.nombreImagen;
                elementoHtmlImagen.style.display = 'block';
            } else {
                
                elementoHtmlImagen.style.display = 'none';
            }

            if (noticiaRecibida.contenido) {

                document.getElementById('cuerpo-noticia').innerHTML =
                    noticiaRecibida.contenido.split('\n').map(function(parrafoIndividual) {
                        return '<p>' + parrafoIndividual + '</p>';
                    }).join('');
            } else {
                
                document.getElementById('cuerpo-noticia').innerHTML = '<p>Sin contenido.</p>';
            }
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al cargar la noticia:', errorDetectado);
            document.getElementById('titulo-noticia').textContent = 'Error al cargar la noticia';
        });
}

function abrirModal(idDelModal) {
    document.getElementById(idDelModal).style.display = 'flex';
}

function cerrarModal(idDelModal) {
    document.getElementById(idDelModal).style.display = 'none';
}

function iniciarSesion(eventoSubmit) {
    
    eventoSubmit.preventDefault();

    var nombreUsuario     = document.getElementById('campo-usuario').value;
    var contrasenaUsuario = document.getElementById('campo-contrasena').value;

    fetch('../api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'usuario=' + encodeURIComponent(nombreUsuario) + '&password=' + encodeURIComponent(contrasenaUsuario)
    })
        
        .then(function(respuestaServidor) {
            if (respuestaServidor.ok) {
                
                window.location.href = 'admin.html';
            } else {
                
                alert('Usuario o contraseña incorrectos');
            }
        })
        
        .catch(function(errorRed) {
            console.error('Error al iniciar sesión:', errorRed);
            alert('Error de conexión con el servidor');
        });
}

function comprobarSesion() {

    fetch('../api/sesion', {
        method: 'GET'
    })
        
        .then(function(respuestaServidor) {
            return respuestaServidor.json();
        })
        
        .then(function(datosSesion) {
            actualizarInterfazUsuario(datosSesion.logueado);
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al comprobar sesión:', errorDetectado);
            actualizarInterfazUsuario(false);
        });
}

function actualizarInterfazUsuario(estaLogueado) {
    var controlesAdministrador = document.getElementById('controles-administrador');    
    var controlesPublico       = document.getElementById('controles-publico'); 

    if (estaLogueado) {
        
        controlesAdministrador.style.display = 'block';
        controlesPublico.style.display       = 'none';
    } else {
        
        controlesAdministrador.style.display = 'none';
        controlesPublico.style.display       = 'block';
    }
}
