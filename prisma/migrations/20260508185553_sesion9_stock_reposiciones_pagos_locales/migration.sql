-- DropIndex
DROP INDEX "productos_nombre_key";

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "es_reposicion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "fecha_ingreso" DATE;

-- CreateTable
CREATE TABLE "pagos_locales" (
    "id_pago_local" SERIAL NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "id_cliente" INTEGER,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha_pago" DATE NOT NULL,
    "id_repartidor" INTEGER,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_locales_pkey" PRIMARY KEY ("id_pago_local")
);

-- AddForeignKey
ALTER TABLE "pagos_locales" ADD CONSTRAINT "pagos_locales_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "periodos_semanales"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_locales" ADD CONSTRAINT "pagos_locales_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_locales" ADD CONSTRAINT "pagos_locales_id_repartidor_fkey" FOREIGN KEY ("id_repartidor") REFERENCES "repartidores"("id_repartidor") ON DELETE SET NULL ON UPDATE CASCADE;
