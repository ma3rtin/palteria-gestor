-- CreateEnum
CREATE TYPE "forma_pago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'PAGO_SEMANAL', 'CAMBIO');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('PENDIENTE', 'PAGADO', 'PARCIAL');

-- CreateEnum
CREATE TYPE "estado_factura" AS ENUM ('NO_REQUIERE', 'PENDIENTE', 'EMITIDA');

-- CreateTable
CREATE TABLE "zonas" (
    "id_zona" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id_zona")
);

-- CreateTable
CREATE TABLE "repartidores" (
    "id_repartidor" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "repartidores_pkey" PRIMARY KEY ("id_repartidor")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio_referencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "cuentas_corrientes" (
    "id_cuenta" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "dia_cobranza" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_corrientes_pkey" PRIMARY KEY ("id_cuenta")
);

-- CreateTable
CREATE TABLE "periodos_semanales" (
    "id_periodo" SERIAL NOT NULL,
    "id_cuenta" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha_pago" DATE,
    "forma_pago" "forma_pago",
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periodos_semanales_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "id_zona" INTEGER NOT NULL,
    "id_repartidor" INTEGER,
    "forma_pago_pref" "forma_pago" NOT NULL DEFAULT 'EFECTIVO',
    "requiere_factura" BOOLEAN NOT NULL DEFAULT false,
    "id_cuenta_corriente" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id_pedido" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "maduracion" TEXT NOT NULL,
    "cajas" DOUBLE PRECISION NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "forma_pago" "forma_pago" NOT NULL,
    "estado_pago" "estado_pago" NOT NULL DEFAULT 'PENDIENTE',
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "id_repartidor" INTEGER,
    "requiere_factura" BOOLEAN NOT NULL DEFAULT false,
    "estado_factura" "estado_factura" NOT NULL DEFAULT 'NO_REQUIERE',
    "es_cobro" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nombre_key" ON "zonas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "repartidores_nombre_key" ON "repartidores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_nombre_key" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_corrientes_nombre_key" ON "cuentas_corrientes"("nombre");

-- AddForeignKey
ALTER TABLE "periodos_semanales" ADD CONSTRAINT "periodos_semanales_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuentas_corrientes"("id_cuenta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "zonas"("id_zona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_repartidor_fkey" FOREIGN KEY ("id_repartidor") REFERENCES "repartidores"("id_repartidor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_cuenta_corriente_fkey" FOREIGN KEY ("id_cuenta_corriente") REFERENCES "cuentas_corrientes"("id_cuenta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_id_repartidor_fkey" FOREIGN KEY ("id_repartidor") REFERENCES "repartidores"("id_repartidor") ON DELETE SET NULL ON UPDATE CASCADE;
