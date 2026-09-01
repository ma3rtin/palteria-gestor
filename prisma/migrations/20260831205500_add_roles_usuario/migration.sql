-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMIN', 'EMPLEADO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "rol" "rol_usuario" NOT NULL DEFAULT 'ADMIN';
