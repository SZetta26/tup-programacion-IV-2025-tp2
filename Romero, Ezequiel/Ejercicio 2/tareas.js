import express from "express";
import { db } from "./db.js";
import { 
    validarId, 
    verificarValidaciones, 
    nombreTareaUnico, 
    verificarUnicidad  
} from "./validaciones.js";
import { body, query } from "express-validator";

const router = express.Router();
const validarTareaCreacion = [
  body("nombre").trim().notEmpty().withMessage("El nombre de la tarea no puede estar vacío."),
  body("completada").isBoolean().optional().withMessage("El campo 'completada' debe ser true o false."),
];

const validarTareaModificacion = [
  body("nombre").optional().trim().notEmpty().withMessage("El nombre de la tarea no puede estar vacío si se envía."),
  body("completada").isBoolean().optional().withMessage("El campo 'completada' debe ser true o false."),
];

const verificarCuerpoPut = (req, res, next) => {
    const { nombre, completada } = req.body;
    if (nombre === undefined && completada === undefined) {
        return res.status(400).json({ 
            success: false, 
            message: "Debe proporcionar al menos 'nombre' o 'completada' para modificar la tarea." 
        });
    }
    next();
};

const validarFiltros = [
  query("completada")
    .isBoolean()
    .withMessage("El filtro 'completada' debe ser 'true' o 'false'.")
    .optional(),
];

router.get("/", validarFiltros, verificarValidaciones, async (req, res) => {
    const { completada } = req.query;
    const filtros = [];
    const parametros = [];

    if (completada !== undefined) {
        filtros.push("completada = ?");
        parametros.push(completada === 'true' ? 1 : 0);
    }

    let sql = "SELECT id, nombre, completada FROM tareas";

    if (filtros.length > 0) {
        sql += " WHERE " + filtros.join(" AND ");
    }
    
    sql += " ORDER BY id DESC";

    const [rows] = await db.execute(sql, parametros);
    res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [rows] = await db.execute("SELECT id, nombre, completada FROM tareas WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Tarea no encontrada" });
    }

    res.json({ success: true, data: rows[0] });
});

router.post("/", validarTareaCreacion, nombreTareaUnico, verificarValidaciones, async (req, res) => {
    const { nombre, completada = false } = req.body; 
    
    const completadaDB = completada ? 1 : 0; 

    const [result] = await db.execute(
        "INSERT INTO tareas (nombre, completada) VALUES (?, ?)",
        [nombre, completadaDB]
    );
    
    res.status(201).json({
        success: true,
        data: { id: result.insertId, nombre, completada: completadaDB },
    });
});

router.put(
  "/:id",
  validarId,
  validarTareaModificacion, 
  verificarCuerpoPut,       
  verificarValidaciones, 
  async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, completada } = req.body;
    
    if (nombre !== undefined) {
        const esUnico = await verificarUnicidad(nombre, id);
        if (!esUnico) {
             return res.status(400).json({ 
                success: false, 
                message: "Falla de validación",
                errores: [{ path: 'nombre', msg: `La tarea con el nombre '${nombre}' ya existe.` }]
            });
        }
    }
   
    let sql = "UPDATE tareas SET ";
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      params.push(nombre);
    }
    
    if (completada !== undefined) {
      updates.push("completada = ?");
      params.push(completada ? 1 : 0); 
    }

    sql += updates.join(", ") + " WHERE id = ?";
    params.push(id);
 
    const [result] = await db.execute(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Tarea no encontrada para modificar" });
    }
  
    res.json({
      success: true,
      data: { id, nombre, completada },
      message: "Tarea modificada exitosamente."
    });
  }
);

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [result] = await db.execute("DELETE FROM tareas WHERE id=?", [id]);

    if (result.affectedRows === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Tarea no encontrada para eliminar" });
    }

    res.json({ success: true, data: id, message: `Tarea con ID ${id} eliminada correctamente` });
});

export default router;