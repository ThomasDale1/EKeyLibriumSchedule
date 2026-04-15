import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carga las variables del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware: permite recibir JSON y conexiones del frontend
app.use(cors({
  origin: 'http://localhost:5173', // Dirección del frontend en desarrollo
  credentials: true,
}));
app.use(express.json());

// Ruta de prueba — para verificar que el servidor funciona
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'InscripcionesKey backend funcionando 🎓',
    timestamp: new Date().toISOString(),
  });
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});