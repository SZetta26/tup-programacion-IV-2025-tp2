import express from "express";
import { conectarDB } from "./db.js";
import alumnosRouter from "./alumnos.js"; 
import materiasRouter from "./materias.js"; 

conectarDB(); 

const app = express();
const port = 3000;

app.use(express.json());

app.use("/materias", materiasRouter); 
app.use("/alumnos", alumnosRouter);

app.listen(port, () => {
  console.log(`La aplicación está funcionando en el puerto ${port}`);
});