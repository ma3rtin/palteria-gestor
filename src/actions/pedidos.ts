"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getPedidosPorFecha(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  return prisma.pedido.findMany({
    where: { fecha },
    include: {
      cliente: { include: { zona: true } },
      producto: true,
      repartidor: true,
    },
    orderBy: [
      { creadoEn: "desc" }
    ],
  });
}

export async function getTotalesDia(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  const agg = await prisma.pedido.aggregate({
    where: { fecha, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  return {
    cajas: agg._sum.cajas ?? 0,
    monto: agg._sum.montoTotal ?? 0,
    cobrado: agg._sum.montoPagado ?? 0,
    cantidad: agg._count.id,
  };
}

export async function getCatalogoNuevoPedido() {
  const clientes = await prisma.cliente.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      idZona: true,
      zona: { select: { nombre: true } },
      formaPagoPref: true,
      idRepartidor: true,
      requiereFactura: true,
      idRevendedor: true,
      revendedor: { select: { nombre: true } },
    },
    orderBy: [{ zona: { nombre: "asc" } }, { nombre: "asc" }],
  });
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, precioReferencia: true, kgPorCaja: true, stockCajas: true },
    orderBy: { nombre: "asc" },
  });
  const repartidores = await prisma.repartidor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
  return { clientes, productos, repartidores };
}

export async function crearPedido(formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const idCliente = Number(formData.get("idCliente"));
  const idProducto = Number(formData.get("idProducto"));
  const maduracion = formData.get("maduracion") as string;
  const cajas = parseFloat(formData.get("cajas") as string);
  const montoTotal = parseFloat(formData.get("montoTotal") as string) || 0;
  const formaPago = formData.get("formaPago") as string;
  const comisionRevendedor = parseFloat(formData.get("comisionRevendedor") as string) || 0;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const esCobro = formData.get("esCobro") === "on";
  const esReposicion = formData.get("esReposicion") === "true";
  const observaciones = formData.get("observaciones") as string | null;

  // Si es un cobro de dinero, ya está pagado por definición;
  // si es un CAMBIO sin cargo (reposición), también. Cualquier otro caso empieza PENDIENTE.
  const estadoPago = esCobro || (formaPago === "CAMBIO" && esReposicion) ? "PAGADO" : "PENDIENTE";
  const montoPagado = esCobro ? montoTotal : 0;
  const pagosParciales = esCobro
    ? [
        {
          monto: montoTotal,
          formaPago: formaPago,
          fecha: fecha,
        },
      ]
    : null;

  await prisma.pedido.create({
    data: {
      fecha: parseFechaRuta(fecha),
      idCliente,
      idProducto,
      maduracion: maduracion.trim().toUpperCase(),
      cajas,
      montoTotal,
      formaPago: formaPago as never,
      estadoPago: estadoPago as never,
      montoPagado,
      idRepartidor,
      requiereFactura,
      estadoFactura: requiereFactura ? "PENDIENTE" : "NO_REQUIERE",
      esCobro,
      esReposicion,
      comisionRevendedor,
      observaciones: observaciones?.trim() || null,
      pagosParciales: pagosParciales ? (pagosParciales as never) : undefined,
    },
  });

  if (!esCobro) {
    await prisma.producto.update({
      where: { id: idProducto },
      data: { stockCajas: { decrement: cajas } },
    });
  }

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/pedidos/${fecha}`);
}

export async function marcarPagado(idPedido: number) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  await prisma.pedido.update({
    where: { id: idPedido },
    data: { estadoPago: "PAGADO", montoPagado: pedido.montoTotal },
  });
  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/");
  revalidatePath("/cobranzas");
}

export async function registrarCobro(idPedido: number, formData: FormData) {
  const monto = parseFloat(formData.get("monto") as string);
  const formaPago = (formData.get("formaPago") as string) || "EFECTIVO";
  
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  const nuevoPagado = Math.min(pedido.montoPagado + monto, pedido.montoTotal);
  const estadoPago = nuevoPagado >= pedido.montoTotal ? "PAGADO" : "PARCIAL";

  // Reconstruir/crear la lista de pagos parciales
  let listaPagos: { monto: number; formaPago: string; fecha: string }[] = [];
  if (pedido.pagosParciales && Array.isArray(pedido.pagosParciales)) {
    listaPagos = [...(pedido.pagosParciales as { monto: number; formaPago: string; fecha: string }[])];
  } else if (pedido.montoPagado > 0) {
    // Si no había desglose pero sí un pago anterior, se conserva
    listaPagos = [
      {
        monto: pedido.montoPagado,
        formaPago: pedido.formaPago,
        fecha: pedido.fecha.toISOString().split("T")[0]
      }
    ];
  }

  // Agregar el nuevo pago parcial (usando fecha local YYYY-MM-DD)
  const hoyLocal = new Date().toLocaleDateString("sv-SE");
  listaPagos.push({
    monto: monto,
    formaPago: formaPago,
    fecha: hoyLocal
  });

  await prisma.pedido.update({
    where: { id: idPedido },
    data: { 
      montoPagado: nuevoPagado, 
      estadoPago: estadoPago as never,
      pagosParciales: listaPagos
    },
  });

  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function eliminarPedido(idPedido: number, fechaStr: string) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  await prisma.pedido.delete({ where: { id: idPedido } });
  if (!pedido.esCobro) {
    await prisma.producto.update({
      where: { id: pedido.idProducto },
      data: { stockCajas: { increment: pedido.cajas } },
    });
  }
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
}

export async function getPedido(idPedido: number) {
  return prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    include: {
      cliente: {
        include: { revendedor: true }
      },
      producto: true,
      repartidor: true
    },
  });
}

export async function actualizarPedido(idPedido: number, formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const montoTotal = parseFloat(formData.get("montoTotal") as string) || 0;
  const formaPago = formData.get("formaPago") as string;
  const estadoPago = formData.get("estadoPago") as string;
  const montoPagado = parseFloat(formData.get("montoPagado") as string) || 0;
  const comisionRevendedor = parseFloat(formData.get("comisionRevendedor") as string) || 0;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const esCobro = formData.get("esCobro") === "on";
  const observaciones = formData.get("observaciones") as string | null;
  
  const pagosParcialesJson = formData.get("pagosParcialesJson") as string | null;
  let pagosParciales = null;
  if (pagosParcialesJson) {
    try {
      pagosParciales = JSON.parse(pagosParcialesJson);
    } catch (e) {
      console.error("Error al parsear pagosParcialesJson:", e);
    }
  }

  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  const cajas = esCobro ? 0 : parseFloat(formData.get("cajas") as string);

  // Ajuste de stock según la transición
  if (pedido.esCobro && !esCobro) {
    // Transición A: Era cobro (stock no afectado) y ahora es pedido (descontar stock de cajas)
    await prisma.producto.update({
      where: { id: pedido.idProducto },
      data: { stockCajas: { decrement: cajas } },
    });
  } else if (!pedido.esCobro && esCobro) {
    // Transición B: Era pedido (descontó stock) y ahora es cobro (devolver stock original)
    await prisma.producto.update({
      where: { id: pedido.idProducto },
      data: { stockCajas: { increment: pedido.cajas } },
    });
  } else if (!pedido.esCobro && !esCobro) {
    // Transición C: Sigue siendo pedido, ajustar diferencia habitual
    const diferencia = pedido.cajas - cajas;
    if (diferencia !== 0) {
      await prisma.producto.update({
        where: { id: pedido.idProducto },
        data: { stockCajas: { increment: diferencia } },
      });
    }
  }

  await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      cajas,
      montoTotal,
      formaPago: formaPago as never,
      estadoPago: estadoPago as never,
      montoPagado,
      repartidor: idRepartidor ? { connect: { id: idRepartidor } } : { disconnect: true },
      requiereFactura,
      estadoFactura: requiereFactura ? (pedido.estadoFactura === "NO_REQUIERE" ? "PENDIENTE" : pedido.estadoFactura) : "NO_REQUIERE",
      esCobro,
      comisionRevendedor,
      observaciones: observaciones?.trim() || null,
      pagosParciales: pagosParciales ?? null,
    },
  });

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/pedidos/${fecha}`);
}

export async function actualizarEstadoFactura(idPedido: number, estadoFactura: "NO_REQUIERE" | "PENDIENTE" | "EMITIDA") {
  await prisma.pedido.update({
    where: { id: idPedido },
    data: { estadoFactura: estadoFactura as never },
  });
  revalidatePath("/pedidos/[fecha]", "page");
}
