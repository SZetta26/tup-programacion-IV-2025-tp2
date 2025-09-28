import { param, validationResult } from "express-validator";
export const validarId = param("id")
  .isInt({ min: 1 })
  .withMessage("El ID debe ser un número entero positivo.");

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