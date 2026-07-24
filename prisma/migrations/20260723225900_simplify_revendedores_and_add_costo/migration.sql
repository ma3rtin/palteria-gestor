-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "comision_por_caja";

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "comision_revendedor" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "costo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "revendedores" DROP COLUMN "tipo";
