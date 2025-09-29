import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones } from "./validaciones.js";
import { body } from "express-validator";

const router = express.Router();

const validarNombreMateria = [
    body("nombre").trim().isLength({ min: 3, max: 100 }).withMessage("El nombre de la materia debe tener entre 3 y 100 caracteres.")
];

router.get("/", async (req, res) => {
    const [rows] = await db.execute("SELECT id, nombre FROM materias ORDER BY nombre ASC");
    res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT id, nombre FROM materias WHERE id=?", [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Materia no encontrada." });
    }
    res.json({ success: true, data: rows[0] });
});

router.post("/", validarNombreMateria, verificarValidaciones, async (req, res) => {
    const { nombre } = req.body;

    try {
        const [existing] = await db.execute("SELECT id FROM materias WHERE nombre = ?", [nombre]);

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Falla de validación",
                errores: [{ msg: `La materia con el nombre '${nombre}' ya existe.` }]
            });
        }

        const [result] = await db.execute("INSERT INTO materias (nombre) VALUES (?)", [nombre]);
        
        res.status(201).json({
            success: true,
            data: { id: result.insertId, nombre },
            message: "Materia creada exitosamente."
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

router.put("/:id", validarId, validarNombreMateria, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const { nombre } = req.body;

    const [existing] = await db.execute("SELECT id FROM materias WHERE nombre = ? AND id <> ?", [nombre, id]);
    if (existing.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Falla de validación",
            errores: [{ msg: `La materia con el nombre '${nombre}' ya existe.` }]
        });
    }

    const [result] = await db.execute("UPDATE materias SET nombre=? WHERE id=?", [nombre, id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Materia no encontrada para modificar." });
    }

    res.json({ success: true, data: { id, nombre }, message: "Materia modificada exitosamente." });
});

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [result] = await db.execute("DELETE FROM materias WHERE id=?", [id]);

    if (result.affectedRows === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Materia no encontrada para eliminar." });
    }

    res.json({ success: true, data: id, message: `Materia con ID ${id} eliminada correctamente.` });
});

export default router;