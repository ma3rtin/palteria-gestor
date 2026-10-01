-- CreateTable
CREATE TABLE "sucursales" (
    "id_sucursal" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id_sucursal")
);

-- CreateTable
CREATE TABLE "envios_sucursales" (
    "id_envio_sucursal" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "id_sucursal" INTEGER NOT NULL,
    "id_repartidor" INTEGER,
    "id_usuario" INTEGER,
    "cajas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envios_sucursales_pkey" PRIMARY KEY ("id_envio_sucursal")
);

-- CreateTable
CREATE TABLE "items_envio_sucursal" (
    "id_item_envio_sucursal" SERIAL NOT NULL,
    "id_envio_sucursal" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cajas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maduracion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_envio_sucursal_pkey" PRIMARY KEY ("id_item_envio_sucursal")
);

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_nombre_key" ON "sucursales"("nombre");

-- CreateIndex
CREATE INDEX "envios_sucursales_fecha_idx" ON "envios_sucursales"("fecha");

-- CreateIndex
CREATE INDEX "envios_sucursales_id_sucursal_idx" ON "envios_sucursales"("id_sucursal");

-- CreateIndex
CREATE INDEX "envios_sucursales_id_repartidor_idx" ON "envios_sucursales"("id_repartidor");

-- CreateIndex
CREATE INDEX "items_envio_sucursal_id_envio_sucursal_idx" ON "items_envio_sucursal"("id_envio_sucursal");

-- CreateIndex
CREATE INDEX "items_envio_sucursal_id_producto_idx" ON "items_envio_sucursal"("id_producto");

-- AddForeignKey
ALTER TABLE "envios_sucursales" ADD CONSTRAINT "envios_sucursales_id_sucursal_fkey" FOREIGN KEY ("id_sucursal") REFERENCES "sucursales"("id_sucursal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_sucursales" ADD CONSTRAINT "envios_sucursales_id_repartidor_fkey" FOREIGN KEY ("id_repartidor") REFERENCES "repartidores"("id_repartidor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_sucursales" ADD CONSTRAINT "envios_sucursales_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_envio_sucursal" ADD CONSTRAINT "items_envio_sucursal_id_envio_sucursal_fkey" FOREIGN KEY ("id_envio_sucursal") REFERENCES "envios_sucursales"("id_envio_sucursal") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_envio_sucursal" ADD CONSTRAINT "items_envio_sucursal_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed inicial de sucursales
INSERT INTO "sucursales" ("nombre", "direccion", "activo")
VALUES 
    ('PALTERIA HAEDO', 'Haedo', true),
    ('PALTERIA CASTELAR', 'Castelar', true)
ON CONFLICT ("nombre") DO NOTHING;
