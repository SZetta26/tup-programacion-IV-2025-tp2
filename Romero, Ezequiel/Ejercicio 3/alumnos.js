import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones, verificarUnicidadAlumno } from "./validaciones.js";
import { body } from "express-validator";

const router = express.Router();
const validarNotas = [
    body("nombre").trim().notEmpty().withMessage("El nombre del alumno es obligatorio."),
    body("materiaId").isInt({ min: 1 }).withMessage("El ID de la materia debe ser un entero positivo."),
    body("nota_1").isFloat({ min: 0, max: 10 }).withMessage("Nota 1 debe ser un número entre 0 y 10."),
    body("nota_2").isFloat({ min: 0, max: 10 }).withMessage("Nota 2 debe ser un número entre 0 y 10."),
    body("nota_3").isFloat({ min: 0, max: 10 }).withMessage("Nota 3 debe ser un número entre 0 y 10."),
];

router.get("/", async (req, res) => {
    const sql = `
        SELECT 
            a.id, a.nombre_alumno AS nombre, m.nombre AS materia, a.nota1, a.nota2, a.nota3
        FROM alumnos a
        JOIN materias m ON a.materia_id = m.id
        ORDER BY a.id DESC`;
    
    const [rows] = await db.execute(sql);
    res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const sql = `
        SELECT 
            a.id, a.nombre_alumno AS nombre, m.nombre AS materia, a.nota1, a.nota2, a.nota3
        FROM alumnos a
        JOIN materias m ON a.materia_id = m.id
        WHERE a.id=?`;

    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Registro de alumno no encontrado." });
    }

    const row = rows[0];
    const data = {
        id: row.id,
        nombre: row.nombre,
        materia: row.materia,
        nota_1: row.nota1,
        nota_2: row.nota2,
        nota_3: row.nota3,
    };

    res.json({ success: true, data });
});

router.post("/", validarNotas, verificarValidaciones, async (req, res) => {
    const { nombre, materiaId, nota_1, nota_2, nota_3 } = req.body;
    const esUnico = await verificarUnicidadAlumno(nombre, materiaId);
    if (!esUnico) {
        return res.status(400).json({ 
            success: false, 
            message: "Falla de validación", 
            errores: [{ msg: `El alumno '${nombre}' ya tiene un registro de notas para la materia ID ${materiaId}.` }] 
        });
    }

    const [result] = await db.execute(
        "INSERT INTO alumnos (nombre_alumno, materia_id, nota1, nota2, nota3) VALUES (?, ?, ?, ?, ?)",
        [nombre, materiaId, nota_1, nota_2, nota_3]
    );
    
    res.status(201).json({
        success: true,
        data: { id: result.insertId, nombre, materiaId, nota_1, nota_2, nota_3 },
    });
});

router.put("/:id", validarId, validarNotas, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);
    const { nombre, materiaId, nota_1, nota_2, nota_3 } = req.body;
    const esUnico = await verificarUnicidadAlumno(nombre, materiaId, id);
    if (!esUnico) {
        return res.status(400).json({ 
            success: false, 
            message: "Falla de validación", 
            errores: [{ msg: `No se puede modificar. El alumno y la materia ya existen en otro registro.` }] 
        });
    }

    const [result] = await db.execute(
        "UPDATE alumnos SET nombre_alumno=?, materia_id=?, nota1=?, nota2=?, nota3=? WHERE id=?",
        [nombre, materiaId, nota_1, nota_2, nota_3, id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Registro de alumno no encontrado para modificar." });
    }

    res.json({ success: true, data: { id, nombre, materiaId, nota_1, nota_2, nota_3 } });
});

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
    const id = Number(req.params.id);

    const [result] = await db.execute("DELETE FROM alumnos WHERE id=?", [id]);

    if (result.affectedRows === 0) {
        return res
            .status(404)
            .json({ success: false, message: "Registro de alumno no encontrado para eliminar." });
    }

    res.json({ success: true, data: id, message: `Registro con ID ${id} eliminado correctamente.` });
});

export default router;