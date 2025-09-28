import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones } from "./validaciones.js";
import { body } from "express-validator";

const router = express.Router();

const calcularRectangulo = (ladoA, ladoB) => ({
  perimetro: 2 * (ladoA + ladoB),
  superficie: ladoA * ladoB,
  });

const validarLados = [
  body("ladoA").isFloat({ min: 0.01 }).withMessage("Lado A debe ser un número positivo."),
  body("ladoB").isFloat({ min: 0.01 }).withMessage("Lado B debe ser un número positivo."),
];

router.post("/", validarLados, verificarValidaciones, async (req, res) => {
  const { ladoA, ladoB } = req.body;
  
  const { perimetro, superficie } = calcularRectangulo(Number(ladoA), Number(ladoB));

  const [result] = await db.execute(
    "INSERT INTO rectangulos (lado_a, lado_b, perimetro, superficie) VALUES (?, ?, ?, ?)",
    [ladoA, ladoB, perimetro, superficie]
  );
  
  res.status(201).json({
    success: true,
    data: { id: result.insertId, ladoA, ladoB, perimetro, superficie },
  });
});

router.put(
  "/:id",
  validarId,
  validarLados,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);
    const { ladoA, ladoB } = req.body;
    
    const { perimetro, superficie } = calcularRectangulo(Number(ladoA), Number(ladoB));

    const [result] = await db.execute(
      "UPDATE rectangulos SET lado_a=?, lado_b=?, perimetro=?, superficie=? WHERE id=?",
      [ladoA, ladoB, perimetro, superficie, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Rectángulo no encontrado para modificar" });
    }

    res.json({
      success: true,
      data: { id, ladoA, ladoB, perimetro, superficie },
    });
  }
);

router.get("/", async (req, res) => {
  const sql =
    "SELECT id, lado_a AS ladoA, lado_b AS ladoB, perimetro, superficie " +
    "FROM rectangulos ORDER BY id DESC";

  const [rows] = await db.execute(sql);
  res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);

  const [rows] = await db.execute(
    "SELECT id, lado_a AS ladoA, lado_b AS ladoB, perimetro, superficie FROM rectangulos WHERE id=?", 
    [id]
  );

  if (rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "Rectángulo no encontrado" });
  }

  res.json({ success: true, data: rows[0] });
});

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);

 
  const [result] = await db.execute("DELETE FROM rectangulos WHERE id=?", [id]);

  if (result.affectedRows === 0) {
    return res
      .status(404) 
      .json({ success: false, message: "Rectángulo no encontrado para eliminar" });
  }
  res.json({ success: true, data: id, message: `Rectángulo con ID ${id} eliminado correctamente` });
});

export default router;