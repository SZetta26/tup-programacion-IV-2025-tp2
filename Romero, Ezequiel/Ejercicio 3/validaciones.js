import { param, body, validationResult } from "express-validator";
import { db } from "./db.js";
export const validarId = param("id")
  .isInt({ min: 1 })
  .withMessage("El ID debe ser un número entero positivo.");

export async function verificarUnicidadAlumno(nombre_alumno, materia_id, id_a_excluir = null) {
    let sql = "SELECT id FROM alumnos WHERE nombre_alumno = ? AND materia_id = ?";
    const params = [nombre_alumno, materia_id];

    if (id_a_excluir) {
        sql += " AND id <> ?"; 
        params.push(Number(id_a_excluir));
    }

    const [rows] = await db.execute(sql, params);

    return rows.length === 0; 
}

export const verificarValidaciones = (req, res, next) => {
  const validacion = validationResult(req);
  if (!validacion.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Falla de validación",
      errores: validacion.array(),
    });
  }
  next();
};