-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "cuit" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "id_usuario" INTEGER;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
