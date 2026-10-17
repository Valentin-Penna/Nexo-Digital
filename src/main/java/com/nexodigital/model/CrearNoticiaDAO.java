package com.nexodigital.model;

import java.sql.*;

public class CrearNoticiaDAO {

    // Devuelve el id de la noticia creada, o -1 si no se pudo guardar
    public int crear(Noticia noticia) {

        String sql = "INSERT INTO noticias (titulo, contenido_noticia, nombre_archivo_imagen, autor, fecha_publicacion) VALUES (?, ?, ?, ?, NOW())";

        try (Connection conn = ConexionDB.obtenerConexion();
                PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, noticia.getTitulo());
            pstmt.setString(2, noticia.getContenido());
            pstmt.setString(3, noticia.getNombreImagen());
            pstmt.setString(4, noticia.getAutor());

            if (pstmt.executeUpdate() == 0) return -1;

            try (ResultSet rs = pstmt.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : -1;
            }

        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }
}
