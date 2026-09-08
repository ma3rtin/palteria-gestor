-- AlterTable
ALTER TABLE "pedidos" ALTER COLUMN "id_producto" DROP NOT NULL;
ALTER TABLE "pedidos" ALTER COLUMN "maduracion" DROP NOT NULL;
ALTER TABLE "pedidos" ALTER COLUMN "cajas" SET DEFAULT 0;
