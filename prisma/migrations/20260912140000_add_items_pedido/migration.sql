-- CreateTable
CREATE TABLE "items_pedido" (
    "id_item_pedido" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cajas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maduracion" TEXT,
    "precio_unitario" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id_item_pedido")
);

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill existing orders with product into items_pedido
INSERT INTO "items_pedido" ("id_pedido", "id_producto", "cajas", "maduracion", "subtotal")
SELECT "id_pedido", "id_producto", "cajas", "maduracion", "monto_total"
FROM "pedidos"
WHERE "id_producto" IS NOT NULL AND "es_cobro" = false;
