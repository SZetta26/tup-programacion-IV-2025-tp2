import { param, body, validationResult } from "express-validator";
import { db } from "./db.js";
export const validarId = param("id")
  .isInt({ min: 1 })
  .withMessage("El ID debe ser un número entero positivo.");

export const nombreTareaUnico = body("nombre")
  .custom(async (nombre) => {
    const [rows] = await db.execute("SELECT id FROM tareas WHERE nombre = ?", [nombre]);

    if (rows.length > 0) {
      throw new Error(`La tarea con el nombre '${nombre}' ya existe.`);
    }
    return true;
  });

export async function verificarUnicidad(nombre, id) {
    let sql = "SELECT id FROM tareas WHERE nombre = ?";
    const params = [nombre];

    if (id) {
        sql += " AND id <> ?"; 
        params.push(Number(id));
    }

    const [rows] = await db.execute(sql, params);

    if (rows.length > 0) {
        return false; 
    }
    return true; 
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