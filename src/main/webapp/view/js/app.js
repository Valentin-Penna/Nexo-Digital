

document.addEventListener('DOMContentLoaded', function() {

    cargarNoticias().then(function() {
        comprobarSesion();
    });

    document.getElementById('boton-abrir-login').onclick = function(evento) {
        
        evento.preventDefault();
        abrirModal('ventana-emergente-login');
    };

    document.getElementById('boton-cerrar-login').onclick = function() {
        cerrarModal('ventana-emergente-login');
    };

    document.getElementById('formulario-login').onsubmit = iniciarSesion;
});

function cargarNoticias() {

    return fetch('../api/noticias', {
        method: 'GET'
    })
        
        .then(function(respuestaHttp) {
            return respuestaHttp.json();
        })
        
        .then(function(listaDeNoticias) {
            
            var contenedorCuadricula = document.getElementById('cuadricula-noticias');

            if (!contenedorCuadricula) return;

            contenedorCuadricula.innerHTML = '';

            listaDeNoticias.forEach(function(noticiaActual) {
                
                var articuloHtml = document.createElement('article');

                articuloHtml.className = 'tarjeta-noticia';

                var rutaImagen;
                if (noticiaActual.nombreImagen && noticiaActual.nombreImagen !== 'null' && noticiaActual.nombreImagen !== '') {

                    rutaImagen = '../uploads/' + noticiaActual.nombreImagen;
                } else {
                    
                    rutaImagen = 'https://placehold.co/600x400/1a1a2e/e0e0e0?text=Nexo+Digital';
                }

                articuloHtml.innerHTML =
                    '<img src="' + rutaImagen + '" class="imagen-tarjeta" alt="' + noticiaActual.titulo + '">' +
                    '<div class="contenido-tarjeta"><h3>' + noticiaActual.titulo + '</h3></div>';

                (function(idNoticia) {
                    articuloHtml.onclick = function() {
                        window.location.href = 'noticia.html?id=' + idNoticia;
                    };

                    articuloHtml.setAttribute('tabindex', '0');
                    articuloHtml.setAttribute('role', 'button');
                    articuloHtml.setAttribute('aria-label', 'Leer noticia: ' + noticiaActual.titulo);
                    
                    articuloHtml.addEventListener('keydown', function(evento) {
                        if (evento.key === 'Enter' || evento.key === ' ') {
                            evento.preventDefault();
                            window.location.href = 'noticia.html?id=' + idNoticia;
                        }
                    });
                })(noticiaActual.id);

                contenedorCuadricula.appendChild(articuloHtml);
            });
        })
        
        .catch(function(errorDetectado) {
            console.error('Error al cargar noticias:', errorDetectado);
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

    var nombreUsuario   = document.getElementById('campo-usuario').value;
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
