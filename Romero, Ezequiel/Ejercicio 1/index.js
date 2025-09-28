import express from "express";
import { conectarDB } from "./db.js";
import rectangulosRouter from "./calculos.js"; 

conectarDB(); 
const app = express();
const port = 3000;

app.use(express.json());

app.use("/rectangulos", rectangulosRouter); 

app.listen(port, () => {
  console.log(`La aplicación esta funcionando en el puerto ${port}`);
});