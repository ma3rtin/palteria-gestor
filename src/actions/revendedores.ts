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
  const aggPedidos = await prisma.pedido.aggregate({
    where: {
      cliente: { idRevendedor: id },
      esCobro: false,
    },
    _sum: {
      comisionRevendedor: true,
    },
  });

  const aggLiquidaciones = await prisma.liquidacionRevendedor.aggregate({
    where: { idRevendedor: id },
    _sum: {
      montoPagado: true,
    },
  });

  const revendedor = await prisma.revendedor.findUnique({
    where: { id },
    include: {
      clientes: {
        where: { activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
        take: 100,
      },
    },
  });

  if (!revendedor) return null;

  return {
    ...revendedor,
    totalGanado: aggPedidos._sum.comisionRevendedor ?? 0,
    totalPagado: aggLiquidaciones._sum.montoPagado ?? 0,
  };
}

export async function getPedidosPeriodo(idRevendedor: number, desde: string, hasta: string) {
  const revendedor = await prisma.revendedor.findUniqueOrThrow({
    where: { id: idRevendedor },
    include: {
      clientes: {
        select: { id: true, nombre: true },
        take: 100,
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
      cliente: { select: { id: true, nombre: true } },
      producto: { select: { id: true, nombre: true, precioReferencia: true } },
    },
    orderBy: [{ cliente: { nombre: "asc" } }, { fecha: "asc" }],
    take: 1000,
  });

  return { revendedor, pedidos };
}

export async function getLiquidacionesPaginadas(idRevendedor: number, page: number = 0, pageSize: number = 10) {
  const skip = page * pageSize;
  const [liquidaciones, total] = await Promise.all([
    prisma.liquidacionRevendedor.findMany({
      where: { idRevendedor },
      orderBy: { fechaInicio: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.liquidacionRevendedor.count({ where: { idRevendedor } }),
  ]);

  return {
    liquidaciones,
    total,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function getPedidosPeriodoPaginados(
  idRevendedor: number,
  desde: string,
  hasta: string,
  page: number = 0,
  pageSize: number = 20
) {
  const revendedor = await prisma.revendedor.findUniqueOrThrow({
    where: { id: idRevendedor },
    include: {
      clientes: {
        select: { id: true, nombre: true },
        take: 100,
      },
    },
  });

  const idsClientes = revendedor.clientes.map((c) => c.id);
  if (idsClientes.length === 0) {
    return { pedidos: [], total: 0, montoCalculadoPeriodo: 0, page, pageSize, hasMore: false };
  }

  const skip = page * pageSize;
  const where = {
    idCliente: { in: idsClientes },
    fecha: { gte: parseFechaRuta(desde), lte: parseFechaRuta(hasta) },
    esCobro: false,
  };

  const [pedidos, total, agg] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true } },
        producto: { select: { id: true, nombre: true, precioReferencia: true } },
      },
      orderBy: [{ fecha: "desc" }, { cliente: { nombre: "asc" } }],
      skip,
      take: pageSize,
    }),
    prisma.pedido.count({ where }),
    prisma.pedido.aggregate({
      where,
      _sum: { comisionRevendedor: true },
    }),
  ]);

  return {
    pedidos,
    total,
    montoCalculadoPeriodo: agg._sum.comisionRevendedor ?? 0,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function registrarLiquidacion(formData: FormData) {
  const idRevendedor = Number(formData.get("idRevendedor"));
  const fechaInicio = formData.get("fechaInicio") as string;
  const fechaFin = formData.get("fechaFin") as string;
  const montoCalculado = parseFloat(formData.get("montoCalculado") as string);
  const montoPagado = parseFloat(formData.get("montoPagado") as string) || 0;
  const formaPago = formData.get("formaPago") as string | null;
  const observaciones = formData.get("observaciones") as string | null;

  await prisma.liquidacionRevendedor.create({
    data: {
      idRevendedor,
      fechaInicio: parseFechaRuta(fechaInicio),
      fechaFin: parseFechaRuta(fechaFin),
      montoCalculado,
      montoPagado,
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
  await prisma.revendedor.create({ data: { nombre } });
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

export async function renombrarRevendedor(formData: FormData) {
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!id || !nombre) {
    throw new Error("El ID y nombre del revendedor son requeridos");
  }
  await prisma.revendedor.update({ where: { id }, data: { nombre } });
  revalidatePath("/config/revendedores");
  revalidatePath("/revendedores");
  revalidatePath(`/revendedores/${id}`);
}
