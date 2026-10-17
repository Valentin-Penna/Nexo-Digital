package com.nexodigital.controller;

import com.google.gson.Gson;
import com.nexodigital.model.ActualizarNoticiaDAO;
import com.nexodigital.model.CrearNoticiaDAO;
import com.nexodigital.model.EliminarNoticiaDAO;
import com.nexodigital.model.ListarNoticiasDAO;
import com.nexodigital.model.Noticia;
import com.nexodigital.model.ObtenerNoticiaDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.UUID;

/*
 * Recurso REST de noticias:
 *   GET    /api/noticias       lista todas
 *   GET    /api/noticias/{id}  devuelve una
 *   POST   /api/noticias       crea una (admin)
 *   PUT    /api/noticias/{id}  la modifica (admin)
 *   DELETE /api/noticias/{id}  la borra (admin)
 */
@WebServlet("/api/noticias/*")
@MultipartConfig(fileSizeThreshold = 1024 * 1024 * 2,
                 maxFileSize = 1024 * 1024 * 10,
                 maxRequestSize = 1024 * 1024 * 50)
public class NoticiasServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        prepararRespuesta(request, response);
        PrintWriter out = response.getWriter();

        if (request.getPathInfo() == null || request.getPathInfo().equals("/")) {
            ListarNoticiasDAO dao = new ListarNoticiasDAO();
            List<Noticia> noticias = dao.listarTodas();
            out.print(gson.toJson(noticias));
            out.flush();
            return;
        }

        Integer id = leerId(request);
        if (id == null) {
            enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "ID de noticia inválido");
            return;
        }

        ObtenerNoticiaDAO dao = new ObtenerNoticiaDAO();
        Noticia noticia = dao.obtenerPorId(id);

        if (noticia != null) {
            out.print(gson.toJson(noticia));
            out.flush();
        } else {
            enviarError(response, HttpServletResponse.SC_NOT_FOUND, "Noticia no encontrada");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        prepararRespuesta(request, response);

        if (request.getPathInfo() != null && !request.getPathInfo().equals("/")) {
            response.setHeader("Allow", "GET, PUT, DELETE");
            enviarError(response, HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Para crear una noticia usa POST /api/noticias");
            return;
        }

        if (!esAdmin(request)) {
            enviarError(response, HttpServletResponse.SC_UNAUTHORIZED, "No tienes permisos para realizar esta acción");
            return;
        }

        try {
            String titulo    = leerParte(request, "titulo");
            String contenido = leerParte(request, "contenido");
            String autor     = leerParte(request, "autor");

            if (estaVacio(titulo) || estaVacio(contenido)) {
                enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "El título y el contenido son obligatorios.");
                return;
            }

            Part filePart = request.getPart("imagen");

            if (filePart == null || filePart.getSize() == 0) {
                enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "La imagen es obligatoria.");
                return;
            }

            String nombreImagenFinal = guardarImagen(filePart);

            Noticia nuevaNoticia = new Noticia(titulo, contenido, nombreImagenFinal, autor);

            CrearNoticiaDAO dao = new CrearNoticiaDAO();
            int idNuevo = dao.crear(nuevaNoticia);

            if (idNuevo > 0) {
                nuevaNoticia.setId(idNuevo);
                response.setStatus(HttpServletResponse.SC_CREATED);
                response.setHeader("Location", request.getContextPath() + "/api/noticias/" + idNuevo);
                response.getWriter().print(gson.toJson(nuevaNoticia));
                response.getWriter().flush();
            } else {
                enviarError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error al guardar en la base de datos.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            enviarError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        prepararRespuesta(request, response);

        if (!esAdmin(request)) {
            enviarError(response, HttpServletResponse.SC_UNAUTHORIZED, "No tienes permisos para realizar esta acción");
            return;
        }

        Integer id = leerId(request);
        if (id == null) {
            enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "ID de noticia inválido");
            return;
        }

        if (new ObtenerNoticiaDAO().obtenerPorId(id) == null) {
            enviarError(response, HttpServletResponse.SC_NOT_FOUND, "Noticia no encontrada");
            return;
        }

        try {
            String titulo    = leerParte(request, "titulo");
            String contenido = leerParte(request, "contenido");
            String autor     = leerParte(request, "autor");

            if (estaVacio(titulo) || estaVacio(contenido)) {
                enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "El título y el contenido son obligatorios.");
                return;
            }

            Part filePart = request.getPart("imagen");
            String nombreImagenFinal = null;

            if (filePart != null && filePart.getSize() > 0) {
                nombreImagenFinal = guardarImagen(filePart);
            }

            Noticia noticia = new Noticia(titulo, contenido, nombreImagenFinal, autor);
            noticia.setId(id);

            ActualizarNoticiaDAO dao = new ActualizarNoticiaDAO();
            if (dao.actualizar(noticia)) {
                response.getWriter().print(gson.toJson(new ObtenerNoticiaDAO().obtenerPorId(id)));
                response.getWriter().flush();
            } else {
                enviarError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error al actualizar la noticia en MySQL");
            }

        } catch (Exception e) {
            e.printStackTrace();
            enviarError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        prepararRespuesta(request, response);

        if (!esAdmin(request)) {
            enviarError(response, HttpServletResponse.SC_UNAUTHORIZED, "No tienes permisos para realizar esta acción");
            return;
        }

        Integer id = leerId(request);
        if (id == null) {
            enviarError(response, HttpServletResponse.SC_BAD_REQUEST, "ID de noticia inválido");
            return;
        }

        if (new ObtenerNoticiaDAO().obtenerPorId(id) == null) {
            enviarError(response, HttpServletResponse.SC_NOT_FOUND, "Noticia no encontrada");
            return;
        }

        EliminarNoticiaDAO dao = new EliminarNoticiaDAO();

        if (dao.eliminar(id)) {
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } else {
            enviarError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error al eliminar la noticia en MySQL");
        }
    }

    private void prepararRespuesta(HttpServletRequest request, HttpServletResponse response) throws IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    private boolean esAdmin(HttpServletRequest request) {
        return request.getSession(false) != null && request.getSession(false).getAttribute("adminLogueado") != null;
    }

    // Saca el {id} de /api/noticias/{id}; null si falta o no es un número
    private Integer leerId(HttpServletRequest request) {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.length() <= 1) return null;

        try {
            return Integer.parseInt(pathInfo.substring(1));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String leerParte(HttpServletRequest request, String nombre) throws IOException, ServletException {
        Part part = request.getPart(nombre);
        if (part == null) return null;
        return new String(part.getInputStream().readAllBytes(), "UTF-8");
    }

    private boolean estaVacio(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String guardarImagen(Part filePart) throws IOException {
        String nombreOriginal = filePart.getSubmittedFileName();
        String extension = nombreOriginal.contains(".") ? nombreOriginal.substring(nombreOriginal.lastIndexOf(".")) : "";
        String nombreImagenFinal = UUID.randomUUID().toString() + extension;

        String uploadPath = "/datos_persistentes";
        File uploadDir = new File(uploadPath);

        if (!uploadDir.exists()) {
            try {
                uploadDir.mkdirs();
            } catch (SecurityException ignored) {}
        }

        if (!uploadDir.exists() || !uploadDir.canWrite()) {
            uploadPath = getServletContext().getRealPath("") + File.separator + "uploads";
            uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
        }

        filePart.write(uploadPath + File.separator + nombreImagenFinal);
        return nombreImagenFinal;
    }

    private void enviarError(HttpServletResponse response, int codigo, String mensaje) throws IOException {
        response.setStatus(codigo);
        PrintWriter out = response.getWriter();
        out.print("{\"status\":\"error\", \"message\":\"" + escaparJson(mensaje) + "\"}");
        out.flush();
    }

    private String escaparJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
