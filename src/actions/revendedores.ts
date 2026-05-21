"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getRevendedores() {
  return prisma.revendedor.findMany({
    include: { _count: { select: { clientes: true } } },
    orderBy: { nombre: "asc" },
  });
}

export async function getRevendedor(id: number) {
  return prisma.revendedor.findUnique({
    where: { id },
    include: {
      clientes: {
        where: { activo: true },
        select: { id: true, nombre: true, comisionPorCaja: true },
        orderBy: { nombre: "asc" },
      },
      liquidaciones: {
        orderBy: { fechaInicio: "desc" },
        take: 20,
      },
    },
  });
}

export async function getPedidosPeriodo(idRevendedor: number, desde: string, hasta: string) {
  const revendedor = await prisma.revendedor.findUniqueOrThrow({
    where: { id: idRevendedor },
    include: {
      clientes: {
        select: { id: true, nombre: true, comisionPorCaja: true },
      },
    },
  });

  const idsClientes = revendedor.clientes.map((c) => c.id);
  if (idsClientes.length === 0) return { revendedor, pedidos: [] };

  const pedidos = await prisma.pedido.findMany({
    where: {
      idCliente: { in: idsClientes },
      fecha: { gte: parseFechaRuta(desde), lte: parseFechaRuta(hasta) },
      esCobro: false,
    },
    include: {
      cliente: { select: { id: true, nombre: true, comisionPorCaja: true } },
      producto: { select: { id: true, nombre: true, precioReferencia: true } },
    },
    orderBy: [{ cliente: { nombre: "asc" } }, { fecha: "asc" }],
  });

  return { revendedor, pedidos };
}

export async function registrarLiquidacion(formData: FormData) {
  const idRevendedor = Number(formData.get("idRevendedor"));
  const fechaInicio = formData.get("fechaInicio") as string;
  const fechaFin = formData.get("fechaFin") as string;
  let montoCalculado = parseFloat(formData.get("montoCalculado") as string);
  const descuentoPorCaja = formData.get("descuentoPorCaja")
    ? parseFloat(formData.get("descuentoPorCaja") as string)
    : null;
  const formaPago = formData.get("formaPago") as string | null;
  const observaciones = formData.get("observaciones") as string | null;

  const revendedor = await prisma.revendedor.findUniqueOrThrow({
    where: { id: idRevendedor },
    select: { tipo: true, clientes: { select: { id: true } } },
  });

  if (revendedor.tipo === "DESCUENTO") {
    if (descuentoPorCaja === null) {
      throw new Error("El descuento por caja es obligatorio para liquidaciones de tipo DESCUENTO.");
    }

    const idsClientes = revendedor.clientes.map((c) => c.id);
    let totalCajas = 0;

    if (idsClientes.length > 0) {
      const pedidos = await prisma.pedido.findMany({
        where: {
          idCliente: { in: idsClientes },
          fecha: { gte: parseFechaRuta(fechaInicio), lte: parseFechaRuta(fechaFin) },
          esCobro: false,
        },
        select: { cajas: true },
      });

      totalCajas = pedidos.reduce((sum, p) => sum + p.cajas, 0);
    }

    montoCalculado = descuentoPorCaja * totalCajas;
  }

  await prisma.liquidacionRevendedor.create({
    data: {
      idRevendedor,
      fechaInicio: parseFechaRuta(fechaInicio),
      fechaFin: parseFechaRuta(fechaFin),
      descuentoPorCaja,
      montoCalculado,
      montoPagado: montoCalculado,
      fechaPago: parseFechaRuta(new Date().toLocaleDateString("en-CA")),
      formaPago: formaPago ? (formaPago as never) : null,
      observaciones: observaciones?.trim() || null,
    },
  });

  revalidatePath(`/revendedores/${idRevendedor}`);
  revalidatePath("/revendedores");
}

export async function crearRevendedor(formData: FormData) {
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const tipo = formData.get("tipo") as string;
  await prisma.revendedor.create({ data: { nombre, tipo: tipo as never } });
  revalidatePath("/config/revendedores");
  revalidatePath("/revendedores");
}

export async function toggleRevendedor(formData: FormData) {
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await prisma.revendedor.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/config/revendedores");
  revalidatePath("/revendedores");
}
