import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import carreraRoutes from './routes/carrera.routes';
import cicloAcademicoRoutes from './routes/cicloAcademico.routes';
import materiaRoutes from './routes/materia.routes';
import profesorRoutes from './routes/profesor.routes';
import profesorMateriaRoutes from './routes/profesorMateria.routes';
import disponibilidadProfesorRoutes from './routes/disponibilidadProfesor.routes';
import estudianteRoutes from './routes/estudiante.routes';
import materiaAprobadaRoutes from './routes/materiaAprobada.routes';
import aulaRoutes from './routes/aula.routes';
import seccionRoutes from './routes/seccion.routes';
import horarioRoutes from './routes/horario.routes';
import inscripcionRoutes from './routes/inscripcion.routes';
import zonaParqueoRoutes from './routes/zonaParqueo.routes';
import registroParqueoRoutes from './routes/registroParqueo.routes';
import usuarioRoutes from './routes/usuario.routes';

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

// Rutas de la API
app.use('/api/carreras', carreraRoutes);
app.use('/api/ciclos', cicloAcademicoRoutes);
app.use('/api/materias', materiaRoutes);
app.use('/api/profesores', profesorRoutes);
app.use('/api/profesor-materias', profesorMateriaRoutes);
app.use('/api/disponibilidades', disponibilidadProfesorRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/materias-aprobadas', materiaAprobadaRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/secciones', seccionRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/inscripciones', inscripcionRoutes);
app.use('/api/zonas-parqueo', zonaParqueoRoutes);
app.use('/api/registros-parqueo', registroParqueoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
