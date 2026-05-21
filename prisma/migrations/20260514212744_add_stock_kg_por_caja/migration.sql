-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "kg_por_caja" DOUBLE PRECISION,
ADD COLUMN     "stock_cajas" DOUBLE PRECISION NOT NULL DEFAULT 0;
