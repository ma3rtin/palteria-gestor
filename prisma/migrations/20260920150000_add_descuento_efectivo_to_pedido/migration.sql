-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "descuento_efectivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pedidos" ADD COLUMN "descuento_por_caja" DOUBLE PRECISION;

-- Backfill histórico basado en notas existentes en observaciones
UPDATE "pedidos"
SET "descuento_efectivo" = true, "descuento_por_caja" = 6000
WHERE "observaciones" LIKE '%[Desc. efectivo%';
