-- CreateEnum
CREATE TYPE "EstadoCiclo" AS ENUM ('PLANIFICACION', 'INSCRIPCION', 'EN_CURSO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EstadoEstudiante" AS ENUM ('ACTIVO', 'INACTIVO', 'GRADUADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HORA');

-- CreateEnum
CREATE TYPE "ModoHorarioProfesor" AS ENUM ('MANUAL', 'AUTOMATICO', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "TipoAula" AS ENUM ('TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO');

-- CreateEnum
CREATE TYPE "EstadoSeccion" AS ENUM ('ABIERTA', 'CERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'LISTA_ESPERA');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoParqueo" AS ENUM ('VEHICULO', 'MOTO', 'BICICLETA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'PROFESOR', 'ESTUDIANTE');

-- CreateEnum
CREATE TYPE "TipoAccionAuditoria" AS ENUM ('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN', 'INSCRIBIR', 'DESINSCRIBIR');

-- CreateTable
CREATE TABLE "Carrera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracionCiclos" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloAcademico" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "numeroCiclo" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCiclo" NOT NULL DEFAULT 'PLANIFICACION',
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CicloAcademico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanHorario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoPlan" NOT NULL DEFAULT 'BORRADOR',
    "bloques" JSONB NOT NULL,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "cicloId" TEXT,

    CONSTRAINT "PlanHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creditos" INTEGER NOT NULL,
    "horasSemanales" INTEGER NOT NULL,
    "ciclo" INTEGER NOT NULL DEFAULT 1,
    "tipoAula" "TipoAula" NOT NULL DEFAULT 'TEORIA',
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "carreraId" TEXT NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesor" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "tipoContrato" "TipoContrato" NOT NULL DEFAULT 'POR_HORA',
    "costoHora" DECIMAL(10,2) NOT NULL,
    "maxHorasDia" INTEGER NOT NULL DEFAULT 8,
    "maxHorasSemana" INTEGER NOT NULL DEFAULT 40,
    "modoHorario" "ModoHorarioProfesor" NOT NULL DEFAULT 'MANUAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfesorMateria" (
    "id" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "nivelDominio" INTEGER NOT NULL DEFAULT 3,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfesorMateria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibilidadProfesor" (
    "id" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "esBloqueo" BOOLEAN NOT NULL DEFAULT false,
    "esDefinidoPorIA" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisponibilidadProfesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "codigoEstudiante" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "carnetDUI" TEXT,
    "cicloActual" INTEGER NOT NULL DEFAULT 1,
    "promedioGPA" DECIMAL(4,2),
    "estado" "EstadoEstudiante" NOT NULL DEFAULT 'ACTIVO',
    "tieneVehiculo" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "carreraId" TEXT NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaAprobada" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "nota" DECIMAL(4,2) NOT NULL,
    "cicloAprobado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MateriaAprobada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aula" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "tipo" "TipoAula" NOT NULL DEFAULT 'TEORIA',
    "edificio" TEXT,
    "piso" INTEGER,
    "tieneProyector" BOOLEAN NOT NULL DEFAULT false,
    "tieneAC" BOOLEAN NOT NULL DEFAULT false,
    "tieneInternet" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "capacidadMax" INTEGER NOT NULL,
    "capacidadActual" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoSeccion" NOT NULL DEFAULT 'ABIERTA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "materiaId" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,

    CONSTRAINT "Seccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seccionId" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,

    CONSTRAINT "Horario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" TEXT NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'PENDIENTE',
    "posicionEspera" INTEGER,
    "notaFinal" DECIMAL(4,2),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "seccionId" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZonaParqueo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoParqueo" NOT NULL DEFAULT 'VEHICULO',
    "capacidadTotal" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZonaParqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroParqueo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "ocupacionMax" INTEGER NOT NULL,
    "ocupacionProm" DECIMAL(5,2) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zonaId" TEXT NOT NULL,

    CONSTRAINT "RegistroParqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ESTUDIANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "accion" "TipoAccionAuditoria" NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "datosAntes" JSONB,
    "datosDespues" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MateriaPrerequisitos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MateriaPrerequisitos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_codigo_key" ON "Carrera"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Materia_codigo_key" ON "Materia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Profesor_clerkUserId_key" ON "Profesor"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profesor_codigo_key" ON "Profesor"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Profesor_email_key" ON "Profesor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfesorMateria_profesorId_materiaId_key" ON "ProfesorMateria"("profesorId", "materiaId");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_clerkUserId_key" ON "Estudiante"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_codigoEstudiante_key" ON "Estudiante"("codigoEstudiante");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_email_key" ON "Estudiante"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_carnetDUI_key" ON "Estudiante"("carnetDUI");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaAprobada_estudianteId_materiaId_key" ON "MateriaAprobada"("estudianteId", "materiaId");

-- CreateIndex
CREATE UNIQUE INDEX "Aula_codigo_key" ON "Aula"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Seccion_codigo_cicloId_key" ON "Seccion"("codigo", "cicloId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_estudianteId_seccionId_key" ON "Inscripcion"("estudianteId", "seccionId");

-- CreateIndex
CREATE UNIQUE INDEX "ZonaParqueo_codigo_key" ON "ZonaParqueo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_clerkUserId_key" ON "Usuario"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "_MateriaPrerequisitos_B_index" ON "_MateriaPrerequisitos"("B");

-- AddForeignKey
ALTER TABLE "PlanHorario" ADD CONSTRAINT "PlanHorario_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfesorMateria" ADD CONSTRAINT "ProfesorMateria_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfesorMateria" ADD CONSTRAINT "ProfesorMateria_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadProfesor" ADD CONSTRAINT "DisponibilidadProfesor_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaAprobada" ADD CONSTRAINT "MateriaAprobada_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Profesor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seccion" ADD CONSTRAINT "Seccion_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horario" ADD CONSTRAINT "Horario_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroParqueo" ADD CONSTRAINT "RegistroParqueo_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaParqueo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MateriaPrerequisitos" ADD CONSTRAINT "_MateriaPrerequisitos_A_fkey" FOREIGN KEY ("A") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MateriaPrerequisitos" ADD CONSTRAINT "_MateriaPrerequisitos_B_fkey" FOREIGN KEY ("B") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
