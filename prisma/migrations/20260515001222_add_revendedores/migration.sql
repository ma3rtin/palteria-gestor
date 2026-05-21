-- CreateEnum
CREATE TYPE "tipo_revendedor" AS ENUM ('COMISION', 'MARGEN', 'DESCUENTO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "comision_por_caja" DOUBLE PRECISION,
ADD COLUMN     "id_revendedor" INTEGER;

-- CreateTable
CREATE TABLE "revendedores" (
    "id_revendedor" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_revendedor" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revendedores_pkey" PRIMARY KEY ("id_revendedor")
);

-- CreateTable
CREATE TABLE "liquidaciones_revendedor" (
    "id_liquidacion" SERIAL NOT NULL,
    "id_revendedor" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "descuento_por_caja" DOUBLE PRECISION,
    "monto_calculado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha_pago" DATE,
    "forma_pago" "forma_pago",
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidaciones_revendedor_pkey" PRIMARY KEY ("id_liquidacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "revendedores_nombre_key" ON "revendedores"("nombre");

-- AddForeignKey
ALTER TABLE "liquidaciones_revendedor" ADD CONSTRAINT "liquidaciones_revendedor_id_revendedor_fkey" FOREIGN KEY ("id_revendedor") REFERENCES "revendedores"("id_revendedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_revendedor_fkey" FOREIGN KEY ("id_revendedor") REFERENCES "revendedores"("id_revendedor") ON DELETE SET NULL ON UPDATE CASCADE;
