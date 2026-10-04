"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseFechaRuta } from "@/lib/utils";

export async function getPedidosPorFecha(fechaStr: string) {
  const fecha = parseFechaRuta(fechaStr);
  return prisma.pedido.findMany({
    where: { fecha },
    include: {
      cliente: {
        include: {
          zona: true,
          revendedor: { select: { id: true, nombre: true } },
        },
      },
      producto: true,
      items: {
        include: { producto: true },
      },
      repartidor: true,
      usuario: { select: { id: true, nombre: true } },
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
      cuit: true,
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
    select: { id: true, nombre: true, precioReferencia: true, kgPorCaja: true, stockCajas: true, fechaIngreso: true },
    orderBy: { nombre: "asc" },
  });
  const repartidores = await prisma.repartidor.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
  return { clientes, productos, repartidores };
}

export interface ItemPedidoInput {
  idProducto: number;
  cajas: number;
  maduracion: string;
  precioUnitario?: number;
  subtotal?: number;
}

export async function crearPedido(formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const idCliente = Number(formData.get("idCliente"));
  const esCobro = formData.get("esCobro") === "on" || formData.get("tipoOperacion") === "COBRANZA";

  const idProductoRaw = formData.get("idProducto");
  const idProductoLegacy = idProductoRaw && !isNaN(Number(idProductoRaw)) && Number(idProductoRaw) > 0 ? Number(idProductoRaw) : null;
  const maduracionRaw = formData.get("maduracion") as string | null;
  const maduracionLegacy = maduracionRaw?.trim() ? maduracionRaw.trim().toUpperCase() : null;
  const cajasRaw = formData.get("cajas") as string | null;
  const cajasLegacy = esCobro ? 0 : (cajasRaw ? parseFloat(cajasRaw) : 0);

  // Parsear itemsJson si viene del formulario dinámico
  const itemsJsonRaw = formData.get("itemsJson") as string | null;
  let itemsParsed: ItemPedidoInput[] = [];
  if (itemsJsonRaw) {
    try {
      const parsed = JSON.parse(itemsJsonRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsParsed = parsed
          .filter((it: any) => it && it.idProducto && !isNaN(Number(it.idProducto)) && Number(it.idProducto) > 0)
          .map((it: any) => ({
            idProducto: Number(it.idProducto),
            cajas: parseFloat(it.cajas) || 0,
            maduracion: String(it.maduracion ?? "").trim().toUpperCase(),
            precioUnitario: it.precioUnitario ? parseFloat(it.precioUnitario) : undefined,
            subtotal: it.subtotal ? parseFloat(it.subtotal) : 0,
          }));
      }
    } catch (e) {
      console.error("Error al parsear itemsJson en crearPedido:", e);
    }
  }

  // Fallback si no vino itemsJson pero sí idProducto tradicional (compatibilidad tests/legacy)
  if (!esCobro && itemsParsed.length === 0 && idProductoLegacy && cajasLegacy > 0) {
    itemsParsed = [{
      idProducto: idProductoLegacy,
      cajas: cajasLegacy,
      maduracion: maduracionLegacy || "",
      subtotal: parseFloat(formData.get("montoTotal") as string) || 0,
    }];
  }

  const totalCajas = esCobro
    ? 0
    : (itemsParsed.length > 0
        ? itemsParsed.reduce((sum, it) => sum + it.cajas, 0)
        : cajasLegacy);

  const montoTotal = parseFloat(formData.get("montoTotal") as string) || 0;
  const formaPago = formData.get("formaPago") as string;
  const comisionRevendedor = parseFloat(formData.get("comisionRevendedor") as string) || 0;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const esReposicion = formData.get("esReposicion") === "true";
  let observaciones = (formData.get("observaciones") as string)?.trim() || null;
  const descuentoEfectivo = formData.get("descuentoEfectivo") === "on" || formData.get("descuentoEfectivo") === "true";

  // Validaciones de seguridad en el backend
  if (!fecha) {
    throw new Error("La fecha del pedido es requerida.");
  }
  if (isNaN(idCliente) || idCliente <= 0) {
    throw new Error("Debe seleccionar un cliente válido.");
  }
  if (!esCobro) {
    if (itemsParsed.length === 0) {
      throw new Error("Debe agregar al menos un producto al pedido.");
    }
    for (const item of itemsParsed) {
      if (!item.idProducto || item.idProducto <= 0) {
        throw new Error("Debe seleccionar un producto válido.");
      }
      if (isNaN(item.cajas) || item.cajas <= 0) {
        throw new Error("La cantidad de cajas de cada producto debe ser mayor a cero.");
      }
      if (!item.maduracion) {
        throw new Error("La maduración es requerida para cada producto.");
      }
    }
  }
  if (isNaN(montoTotal) || montoTotal < 0) {
    throw new Error("El monto total del pedido no puede ser negativo.");
  }
  if (esCobro && montoTotal <= 0) {
    throw new Error("El monto a cobrar debe ser mayor a cero.");
  }
  if (isNaN(comisionRevendedor)) {
    throw new Error("La comisión del revendedor no es válida.");
  }

  // Modos sin cargo: Canje, Muestra, Retiro, o Cambio sin cargo (reposición)
  const esSinCargo = (formaPago === "CAMBIO" && esReposicion) || formaPago === "CANJE" || formaPago === "MUESTRA" || formaPago === "RETIRO";

  // Si se aplicó descuento por pago en efectivo
  const tieneDescuentoEfectivo = !esCobro && !esSinCargo && formaPago === "EFECTIVO" && descuentoEfectivo && totalCajas > 0;
  let descuentoPorCaja: number | null = null;
  if (tieneDescuentoEfectivo) {
    const descuentoPorCajaRaw = formData.get("descuentoPorCaja");
    descuentoPorCaja = descuentoPorCajaRaw && !isNaN(Number(descuentoPorCajaRaw)) ? Number(descuentoPorCajaRaw) : 6000;
    const desc = totalCajas * descuentoPorCaja;
    const notaDesc = `[Desc. efectivo: -$${desc.toLocaleString("es-AR")}]`;
    observaciones = observaciones ? `${observaciones} ${notaDesc}` : notaDesc;
  }

  // Si es un cobro de dinero, puede empezar PAGADO o PENDIENTE (según estadoCobro);
  // si es sin cargo (Canje, Muestra, Retiro o Reposición), empieza PAGADO. Cualquier otro caso empieza PENDIENTE.
  const estadoCobro = (formData.get("estadoCobro") as string) || "PAGADO";
  const estadoPago = esCobro
    ? (estadoCobro === "PENDIENTE" ? "PENDIENTE" : "PAGADO")
    : (esSinCargo ? "PAGADO" : "PENDIENTE");
  const montoPedidoFinal = esSinCargo ? 0 : montoTotal;
  const montoPagado = (esCobro && estadoPago === "PAGADO") ? montoTotal : (esSinCargo ? 0 : 0);
  const pagosParciales = (esCobro && estadoPago === "PAGADO")
    ? [
        {
          monto: montoTotal,
          formaPago: formaPago,
          fecha: fecha,
        },
      ]
    : null;

  const primerProducto = esCobro ? null : (itemsParsed[0]?.idProducto ?? null);
  const maduracionResumen = esCobro
    ? null
    : (itemsParsed.length === 1
        ? itemsParsed[0].maduracion
        : itemsParsed.map((i) => `${i.cajas} ${i.maduracion}`).join(" + "));

  const session = await auth();
  const idUsuario = session?.user?.id ? Number(session.user.id) : null;
  const esFacturable = requiereFactura && !esSinCargo;

  await prisma.pedido.create({
    data: {
      fecha: parseFechaRuta(fecha),
      idCliente,
      idProducto: primerProducto,
      maduracion: maduracionResumen,
      cajas: totalCajas,
      montoTotal: montoPedidoFinal,
      formaPago: formaPago as never,
      estadoPago: estadoPago as never,
      montoPagado,
      idRepartidor,
      idUsuario,
      requiereFactura: esFacturable,
      estadoFactura: esFacturable ? "PENDIENTE" : "NO_REQUIERE",
      esCobro,
      esReposicion,
      comisionRevendedor,
      descuentoEfectivo: tieneDescuentoEfectivo,
      descuentoPorCaja: tieneDescuentoEfectivo ? descuentoPorCaja : null,
      observaciones,
      pagosParciales: pagosParciales ? (pagosParciales as never) : undefined,
      items: (!esCobro && itemsParsed.length > 0)
        ? {
            create: itemsParsed.map((i) => ({
              idProducto: i.idProducto,
              cajas: i.cajas,
              maduracion: i.maduracion,
              precioUnitario: i.precioUnitario,
              subtotal: esSinCargo ? 0 : (i.subtotal ?? 0),
            })),
          }
        : undefined,
    },
  });

  // Descontar stock si es entrega normal, muestra o canje (RETIRO no descuenta stock de cámara)
  if (!esCobro && formaPago !== "RETIRO" && itemsParsed.length > 0) {
    for (const it of itemsParsed) {
      if (it.idProducto && it.cajas > 0) {
        await prisma.producto.update({
          where: { id: it.idProducto },
          data: { stockCajas: { decrement: it.cajas } },
        });
      }
    }
  }

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/pedidos/${fecha}`);
}

export async function marcarPagado(idPedido: number) {
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });
  const fechaStr = pedido.fecha
    ? (pedido.fecha instanceof Date ? pedido.fecha.toISOString().split("T")[0] : String(pedido.fecha).split("T")[0])
    : new Date().toISOString().split("T")[0];
  const formaPago = pedido.formaPago ?? "EFECTIVO";

  await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      estadoPago: "PAGADO",
      montoPagado: pedido.montoTotal,
      pagosParciales: [
        {
          monto: pedido.montoTotal,
          formaPago: formaPago,
          fecha: fechaStr,
        },
      ],
    },
  });
  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/");
  revalidatePath("/cobranzas");
}

export async function registrarCobro(idPedido: number, formData: FormData) {
  const monto = parseFloat(formData.get("monto") as string);
  const formaPago = (formData.get("formaPago") as string) || "EFECTIVO";
  const aplicarDescuentoEfectivo = formData.get("aplicarDescuentoEfectivo") === "on" || formData.get("descuentoEfectivo") === "true";
  
  if (isNaN(idPedido) || idPedido <= 0) {
    throw new Error("ID de pedido inválido.");
  }
  if (isNaN(monto) || monto <= 0) {
    throw new Error("El monto a cobrar debe ser un número válido mayor a cero.");
  }
  
  const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id: idPedido } });

  let montoTotal = pedido.montoTotal;
  let observaciones = pedido.observaciones;

  // Si aplica descuento por pago en efectivo y no lo tenía previamente
  const aplicaDescNuevo = aplicarDescuentoEfectivo && formaPago === "EFECTIVO" && pedido.cajas > 0 && !pedido.descuentoEfectivo;
  if (aplicaDescNuevo) {
    const descuentoPorCajaRaw = formData.get("descuentoPorCaja");
    const descuentoPorCaja = descuentoPorCajaRaw && !isNaN(Number(descuentoPorCajaRaw)) ? Number(descuentoPorCajaRaw) : 6000;
    const descuento = pedido.cajas * descuentoPorCaja;
    montoTotal = Math.max(0, pedido.montoTotal - descuento);
    const notaDescuento = `[Desc. efectivo: -$${descuento.toLocaleString("es-AR")}]`;
    if (observaciones && observaciones.includes("[Desc. efectivo")) {
      observaciones = observaciones.replace(/\[Desc\. efectivo:[^\]]*\]/, notaDescuento);
    } else {
      observaciones = observaciones ? `${observaciones} ${notaDescuento}` : notaDescuento;
    }
  }

  const nuevoPagado = Math.min(pedido.montoPagado + monto, montoTotal);
  const estadoPago = nuevoPagado >= montoTotal ? "PAGADO" : "PARCIAL";

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
    fecha: hoyLocal,
  });

  await prisma.pedido.update({
    where: { id: idPedido },
    data: { 
      montoTotal,
      montoPagado: nuevoPagado, 
      estadoPago: estadoPago as never,
      pagosParciales: listaPagos,
      observaciones,
      descuentoEfectivo: pedido.descuentoEfectivo || aplicaDescNuevo,
    },
  });

  revalidatePath("/pedidos/[fecha]", "page");
  revalidatePath("/cobranzas");
  revalidatePath("/");
}

export async function eliminarPedido(idPedido: number, fechaStr: string) {
  const pedido = await prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    include: { items: true },
  });
  if (!pedido.esCobro) {
    if (pedido.items && pedido.items.length > 0) {
      for (const item of pedido.items) {
        if (item.idProducto && item.cajas > 0) {
          await prisma.producto.update({
            where: { id: item.idProducto },
            data: { stockCajas: { increment: item.cajas } },
          });
        }
      }
    } else if (pedido.idProducto && pedido.cajas > 0) {
      await prisma.producto.update({
        where: { id: pedido.idProducto },
        data: { stockCajas: { increment: pedido.cajas } },
      });
    }
  }
  await prisma.pedido.delete({ where: { id: idPedido } });
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
      items: {
        include: { producto: true }
      },
      repartidor: true,
      usuario: { select: { id: true, nombre: true } },
    },
  });
}

export async function actualizarPedido(idPedido: number, formData: FormData) {
  const fecha = formData.get("fecha") as string;
  const montoTotal = parseFloat(formData.get("montoTotal") as string) || 0;
  const estadoPago = formData.get("estadoPago") as string;
  const montoPagado = parseFloat(formData.get("montoPagado") as string) || 0;
  const comisionRevendedor = parseFloat(formData.get("comisionRevendedor") as string) || 0;
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const esCobro = formData.get("esCobro") === "on";
  let observaciones = (formData.get("observaciones") as string)?.trim() || null;
  const descuentoEfectivo = formData.get("descuentoEfectivo") === "on" || formData.get("descuentoEfectivo") === "true";
  
  if (isNaN(idPedido) || idPedido <= 0) {
    throw new Error("ID de pedido inválido.");
  }
  if (!fecha) {
    throw new Error("La fecha es requerida.");
  }
  if (isNaN(montoTotal) || montoTotal < 0) {
    throw new Error("El monto total del pedido no puede ser negativo.");
  }
  if (isNaN(montoPagado) || montoPagado < 0) {
    throw new Error("El monto pagado no puede ser negativo.");
  }
  if (isNaN(comisionRevendedor)) {
    throw new Error("La comisión del revendedor no es válida.");
  }

  const pedido = await prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    include: { items: true },
  });
  const formaPago = (formData.get("formaPago") as string) || pedido.formaPago;
  const esReposicion = formData.has("esReposicion") ? formData.get("esReposicion") === "true" : pedido.esReposicion;

  // Modos sin cargo: Canje, Muestra, Retiro, o Cambio sin cargo (reposición)
  const esSinCargo = (formaPago === "CAMBIO" && esReposicion) || formaPago === "CANJE" || formaPago === "MUESTRA" || formaPago === "RETIRO";

  // Parsear itemsJson si viene del formulario dinámico
  const itemsJsonRaw = formData.get("itemsJson") as string | null;
  let itemsParsed: ItemPedidoInput[] = [];
  if (itemsJsonRaw) {
    try {
      const parsed = JSON.parse(itemsJsonRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        itemsParsed = parsed
          .filter((it: any) => it && it.idProducto && !isNaN(Number(it.idProducto)) && Number(it.idProducto) > 0)
          .map((it: any) => ({
            idProducto: Number(it.idProducto),
            cajas: parseFloat(it.cajas) || 0,
            maduracion: String(it.maduracion ?? "").trim().toUpperCase(),
            precioUnitario: it.precioUnitario ? parseFloat(it.precioUnitario) : undefined,
            subtotal: esSinCargo ? 0 : (it.subtotal ? parseFloat(it.subtotal) : 0),
          }));
      }
    } catch (e) {
      console.error("Error al parsear itemsJson en actualizarPedido:", e);
    }
  }

  // Fallback para pedidos legacy / tests sin itemsJson
  const idProductoRaw = formData.get("idProducto");
  const nuevoIdProductoLegacy = idProductoRaw ? Number(idProductoRaw) : (!esCobro ? pedido.idProducto : null);
  const nuevaMaduracionLegacy = formData.has("maduracion")
    ? ((formData.get("maduracion") as string)?.trim().toUpperCase() || null)
    : (!esCobro ? pedido.maduracion : null);
  const cajasLegacy = esCobro ? 0 : (formData.has("cajas") ? parseFloat(formData.get("cajas") as string) : pedido.cajas);

  if (!esCobro && itemsParsed.length === 0 && nuevoIdProductoLegacy && cajasLegacy > 0) {
    itemsParsed = [{
      idProducto: nuevoIdProductoLegacy,
      cajas: cajasLegacy,
      maduracion: nuevaMaduracionLegacy || "",
      subtotal: esSinCargo ? 0 : montoTotal,
    }];
  }

  const totalCajas = esCobro
    ? 0
    : (itemsParsed.length > 0 ? itemsParsed.reduce((s, it) => s + it.cajas, 0) : cajasLegacy);

  if (!esCobro) {
    if (itemsParsed.length === 0) {
      throw new Error("Debe agregar al menos un producto al pedido.");
    }
    for (const item of itemsParsed) {
      if (!item.idProducto || item.idProducto <= 0) {
        throw new Error("Debe seleccionar un producto válido.");
      }
      if (!item.maduracion) {
        throw new Error("La maduración es requerida.");
      }
      if (isNaN(item.cajas) || item.cajas < 0) {
        throw new Error("La cantidad de cajas debe ser un número válido mayor o igual a cero.");
      }
    }
  }

  // Si aplica descuento por efectivo al editar
  const tieneDescuentoEfectivo = !esCobro && !esSinCargo && formaPago === "EFECTIVO" && descuentoEfectivo && totalCajas > 0;
  let descuentoPorCaja: number | null = null;
  if (tieneDescuentoEfectivo) {
    const descuentoPorCajaRaw = formData.get("descuentoPorCaja");
    descuentoPorCaja = descuentoPorCajaRaw && !isNaN(Number(descuentoPorCajaRaw)) ? Number(descuentoPorCajaRaw) : (pedido.descuentoPorCaja ?? 6000);
    const desc = totalCajas * descuentoPorCaja;
    const notaDesc = `[Desc. efectivo: -$${desc.toLocaleString("es-AR")}]`;
    if (observaciones && observaciones.includes("[Desc. efectivo")) {
      observaciones = observaciones.replace(/\[Desc\. efectivo:[^\]]*\]/, notaDesc);
    } else {
      observaciones = observaciones ? `${observaciones} ${notaDesc}` : notaDesc;
    }
  } else if (!tieneDescuentoEfectivo && observaciones && observaciones.includes("[Desc. efectivo")) {
    observaciones = observaciones.replace(/\[Desc\. efectivo:[^\]]*\]/, "").trim();
  }

  const pagosParcialesJson = formData.get("pagosParcialesJson") as string | null;
  let pagosParciales = null;
  if (pagosParcialesJson) {
    try {
      pagosParciales = JSON.parse(pagosParcialesJson);
    } catch (e) {
      console.error("Error al parsear pagosParcialesJson:", e);
    }
  }

  // Reversión de stock de los ítems o producto anterior (si no era un RETIRO)
  if (!pedido.esCobro && (pedido.formaPago as string) !== "RETIRO") {
    if (pedido.items && pedido.items.length > 0) {
      for (const oldItem of pedido.items) {
        if (oldItem.idProducto && oldItem.cajas > 0) {
          await prisma.producto.update({
            where: { id: oldItem.idProducto },
            data: { stockCajas: { increment: oldItem.cajas } },
          });
        }
      }
    } else if (pedido.idProducto && pedido.cajas > 0) {
      await prisma.producto.update({
        where: { id: pedido.idProducto },
        data: { stockCajas: { increment: pedido.cajas } },
      });
    }
  }

  // Recreación de ítems y descuento de stock
  await prisma.itemPedido.deleteMany({
    where: { idPedido },
  });

  if (!esCobro && itemsParsed.length > 0) {
    for (const it of itemsParsed) {
      await prisma.itemPedido.create({
        data: {
          idPedido,
          idProducto: it.idProducto,
          cajas: it.cajas,
          maduracion: it.maduracion,
          precioUnitario: it.precioUnitario,
          subtotal: esSinCargo ? 0 : (it.subtotal ?? 0),
        },
      });
      if (formaPago !== "RETIRO" && it.idProducto && it.cajas > 0) {
        await prisma.producto.update({
          where: { id: it.idProducto },
          data: { stockCajas: { decrement: it.cajas } },
        });
      }
    }
  }

  const primerProducto = esCobro ? null : (itemsParsed[0]?.idProducto ?? null);
  const maduracionResumen = esCobro
    ? null
    : (itemsParsed.length === 1
        ? itemsParsed[0].maduracion
        : itemsParsed.map((i) => `${i.cajas} ${i.maduracion}`).join(" + "));

  const montoFinalActualizado = esSinCargo ? 0 : montoTotal;
  const montoPagadoActualizado = esSinCargo ? 0 : montoPagado;
  const estadoPagoActualizado = esSinCargo ? "PAGADO" : estadoPago;
  const esFacturable = requiereFactura && !esSinCargo;

  await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      idProducto: primerProducto,
      maduracion: maduracionResumen,
      cajas: totalCajas,
      montoTotal: montoFinalActualizado,
      formaPago: formaPago as never,
      estadoPago: estadoPagoActualizado as never,
      montoPagado: montoPagadoActualizado,
      idRepartidor,
      requiereFactura: esFacturable,
      estadoFactura: esFacturable ? (pedido.estadoFactura === "NO_REQUIERE" ? "PENDIENTE" : pedido.estadoFactura) : "NO_REQUIERE",
      esCobro,
      comisionRevendedor,
      descuentoEfectivo: tieneDescuentoEfectivo,
      descuentoPorCaja: tieneDescuentoEfectivo ? descuentoPorCaja : null,
      observaciones: observaciones?.trim() || null,
      pagosParciales: pagosParciales ?? null,
    },
  });

  revalidatePath(`/pedidos/${fecha}`);
  revalidatePath("/productos");
  revalidatePath("/");
  redirect(`/pedidos/${fecha}`);
}

export async function actualizarRepartidorPedido(idPedido: number, idRepartidor: number | null) {
  const pedidoExistente = await prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    select: { estadoPago: true },
  });

  if (pedidoExistente.estadoPago === "PAGADO") {
    throw new Error("No se puede modificar el repartidor de un pedido ya pagado.");
  }

  const pedido = await prisma.pedido.update({
    where: { id: idPedido },
    data: { idRepartidor: idRepartidor || null },
    select: { fecha: true },
  });
  const fechaStr = pedido.fecha instanceof Date
    ? pedido.fecha.toISOString().split("T")[0]
    : String(pedido.fecha).split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarProductoPedido(idPedido: number, idProductoNuevo: number) {
  const pedido = await prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    include: { items: true },
  });

  if (pedido.esCobro) {
    throw new Error("No se puede cambiar el producto de una cobranza.");
  }

  if (pedido.estadoPago === "PAGADO") {
    throw new Error("No se puede modificar el producto de un pedido ya pagado.");
  }

  const idProductoViejo = pedido.idProducto;
  if (idProductoViejo === idProductoNuevo) return { ok: true };

  // Revertir stock del producto anterior (si no era retiro)
  if ((pedido.formaPago as string) !== "RETIRO" && idProductoViejo && pedido.cajas > 0) {
    await prisma.producto.update({
      where: { id: idProductoViejo },
      data: { stockCajas: { increment: pedido.cajas } },
    });
  }

  // Descontar stock del producto nuevo (si no es retiro)
  if ((pedido.formaPago as string) !== "RETIRO" && pedido.cajas > 0) {
    await prisma.producto.update({
      where: { id: idProductoNuevo },
      data: { stockCajas: { decrement: pedido.cajas } },
    });
  }

  const productoNuevo = await prisma.producto.findUniqueOrThrow({
    where: { id: idProductoNuevo },
  });

  const esSinCargo =
    ((pedido.formaPago as string) === "CAMBIO" && pedido.esReposicion) ||
    ((pedido.formaPago as string) === "CANJE") ||
    ((pedido.formaPago as string) === "MUESTRA") ||
    ((pedido.formaPago as string) === "RETIRO");

  const nuevoPrecioUnit = productoNuevo.precioReferencia;
  const nuevoSubtotal = esSinCargo ? 0 : Math.round(nuevoPrecioUnit * pedido.cajas);
  const descPorCaja = pedido.descuentoEfectivo ? (pedido.descuentoPorCaja ?? 6000) : 0;
  const descuentoTotal = descPorCaja * pedido.cajas;
  const nuevoMontoTotal = esSinCargo ? 0 : Math.max(0, Math.round(nuevoSubtotal - descuentoTotal));

  let nuevoEstadoPago: string = pedido.estadoPago;
  if (nuevoMontoTotal === 0 || esSinCargo) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado >= nuevoMontoTotal) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado > 0) {
    nuevoEstadoPago = "PARCIAL";
  } else {
    nuevoEstadoPago = "PENDIENTE";
  }

  // Actualizar pedido
  await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      idProducto: idProductoNuevo,
      montoTotal: nuevoMontoTotal,
      estadoPago: nuevoEstadoPago as never,
    },
  });

  // Si tiene un único ítem en ItemPedido, actualizarlo también con precioUnitario y subtotal
  if (pedido.items && pedido.items.length === 1) {
    await prisma.itemPedido.update({
      where: { id: pedido.items[0].id },
      data: {
        idProducto: idProductoNuevo,
        precioUnitario: nuevoPrecioUnit,
        subtotal: nuevoSubtotal,
      },
    });
  }

  const fechaStr = pedido.fecha instanceof Date
    ? pedido.fecha.toISOString().split("T")[0]
    : String(pedido.fecha).split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarProductoItemPedido(idItemPedido: number, idProductoNuevo: number) {
  const item = await prisma.itemPedido.findUniqueOrThrow({
    where: { id: idItemPedido },
    include: {
      pedido: {
        include: { items: true },
      },
    },
  });

  const { pedido } = item;
  if (pedido.esCobro) {
    throw new Error("No se puede cambiar el producto de una cobranza.");
  }

  if (pedido.estadoPago === "PAGADO") {
    throw new Error("No se puede modificar el producto de un pedido ya pagado.");
  }

  const idProductoViejo = item.idProducto;
  if (idProductoViejo === idProductoNuevo) return { ok: true };

  // Revertir stock del producto anterior (si no era retiro y tenía cajas)
  if ((pedido.formaPago as string) !== "RETIRO" && idProductoViejo && item.cajas > 0) {
    await prisma.producto.update({
      where: { id: idProductoViejo },
      data: { stockCajas: { increment: item.cajas } },
    });
  }

  // Descontar stock del producto nuevo (si no es retiro y tiene cajas)
  if ((pedido.formaPago as string) !== "RETIRO" && item.cajas > 0) {
    await prisma.producto.update({
      where: { id: idProductoNuevo },
      data: { stockCajas: { decrement: item.cajas } },
    });
  }

  const productoNuevo = await prisma.producto.findUniqueOrThrow({
    where: { id: idProductoNuevo },
  });

  const esSinCargo =
    ((pedido.formaPago as string) === "CAMBIO" && pedido.esReposicion) ||
    ((pedido.formaPago as string) === "CANJE") ||
    ((pedido.formaPago as string) === "MUESTRA") ||
    ((pedido.formaPago as string) === "RETIRO");

  const nuevoPrecioUnit = productoNuevo.precioReferencia;
  const nuevoSubtotal = esSinCargo ? 0 : Math.round(nuevoPrecioUnit * item.cajas);

  // Actualizar el ítem
  await prisma.itemPedido.update({
    where: { id: idItemPedido },
    data: {
      idProducto: idProductoNuevo,
      precioUnitario: nuevoPrecioUnit,
      subtotal: nuevoSubtotal,
    },
  });

  // Recalcular pedido total
  const itemsActualizados = pedido.items.map((it) =>
    it.id === idItemPedido
      ? { ...it, idProducto: idProductoNuevo, precioUnitario: nuevoPrecioUnit, subtotal: nuevoSubtotal }
      : it
  );
  const totalCajas = itemsActualizados.reduce((acc, it) => acc + it.cajas, 0);
  const sumaSubtotales = itemsActualizados.reduce((acc, it) => acc + it.subtotal, 0);

  const descPorCaja = pedido.descuentoEfectivo ? (pedido.descuentoPorCaja ?? 6000) : 0;
  const descuentoTotal = descPorCaja * totalCajas;
  const nuevoMontoTotal = esSinCargo ? 0 : Math.max(0, Math.round(sumaSubtotales - descuentoTotal));

  let nuevoEstadoPago: string = pedido.estadoPago;
  if (nuevoMontoTotal === 0 || esSinCargo) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado >= nuevoMontoTotal) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado > 0) {
    nuevoEstadoPago = "PARCIAL";
  } else {
    nuevoEstadoPago = "PENDIENTE";
  }

  const dataPedidoUpdate: any = {
    montoTotal: nuevoMontoTotal,
    estadoPago: nuevoEstadoPago as never,
  };

  // Si este ítem es el primer ítem del pedido o el único, mantener sincronizado pedido.idProducto
  if (pedido.items.length === 1 || pedido.items[0]?.id === idItemPedido) {
    dataPedidoUpdate.idProducto = idProductoNuevo;
  }

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: dataPedidoUpdate,
  });

  const fechaStr = pedido.fecha instanceof Date
    ? pedido.fecha.toISOString().split("T")[0]
    : String(pedido.fecha).split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarCajasItemPedido(idItemPedido: number, nuevasCajas: number) {
  if (nuevasCajas <= 0) {
    throw new Error("La cantidad de cajas debe ser mayor a 0.");
  }

  const item = await prisma.itemPedido.findUniqueOrThrow({
    where: { id: idItemPedido },
    include: {
      pedido: {
        include: {
          items: {
            include: { producto: true },
          },
        },
      },
      producto: true,
    },
  });

  const { pedido } = item;
  if (pedido.esCobro) {
    throw new Error("No se pueden modificar cajas de una cobranza.");
  }

  if (pedido.estadoPago === "PAGADO") {
    throw new Error("No se puede modificar la cantidad de un pedido ya pagado.");
  }

  const diffCajas = nuevasCajas - item.cajas;
  if (diffCajas === 0) return { ok: true };

  // Ajustar stock físico del producto si no es retiro
  if ((pedido.formaPago as string) !== "RETIRO" && item.idProducto) {
    if (diffCajas > 0) {
      await prisma.producto.update({
        where: { id: item.idProducto },
        data: { stockCajas: { decrement: diffCajas } },
      });
    } else {
      await prisma.producto.update({
        where: { id: item.idProducto },
        data: { stockCajas: { increment: Math.abs(diffCajas) } },
      });
    }
  }

  const esSinCargo =
    ((pedido.formaPago as string) === "CAMBIO" && pedido.esReposicion) ||
    ((pedido.formaPago as string) === "CANJE") ||
    ((pedido.formaPago as string) === "MUESTRA") ||
    ((pedido.formaPago as string) === "RETIRO");

  const precioUnit =
    item.precioUnitario ??
    item.producto?.precioReferencia ??
    (item.cajas > 0 ? item.subtotal / item.cajas : 0);

  const nuevoSubtotal = esSinCargo ? 0 : Math.round(precioUnit * nuevasCajas);

  // Actualizar el ítem
  await prisma.itemPedido.update({
    where: { id: idItemPedido },
    data: {
      cajas: nuevasCajas,
      subtotal: nuevoSubtotal,
    },
  });

  // Recalcular pedido total
  const itemsActualizados = pedido.items.map((it) =>
    it.id === idItemPedido ? { ...it, cajas: nuevasCajas, subtotal: nuevoSubtotal } : it
  );
  const totalCajas = itemsActualizados.reduce((acc, it) => acc + it.cajas, 0);
  const sumaSubtotales = itemsActualizados.reduce((acc, it) => acc + it.subtotal, 0);

  const descPorCaja = pedido.descuentoEfectivo ? (pedido.descuentoPorCaja ?? 6000) : 0;
  const descuentoTotal = descPorCaja * totalCajas;
  const nuevoMontoTotal = esSinCargo ? 0 : Math.max(0, Math.round(sumaSubtotales - descuentoTotal));

  let nuevoEstadoPago: string = pedido.estadoPago;
  if (nuevoMontoTotal === 0 || esSinCargo) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado >= nuevoMontoTotal) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado > 0) {
    nuevoEstadoPago = "PARCIAL";
  } else {
    nuevoEstadoPago = "PENDIENTE";
  }

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: {
      cajas: totalCajas,
      montoTotal: nuevoMontoTotal,
      estadoPago: nuevoEstadoPago as never,
    },
  });

  const fechaStr = pedido.fecha instanceof Date
    ? pedido.fecha.toISOString().split("T")[0]
    : String(pedido.fecha).split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarCajasPedido(idPedido: number, nuevasCajas: number) {
  if (nuevasCajas <= 0) {
    throw new Error("La cantidad de cajas debe ser mayor a 0.");
  }

  const pedido = await prisma.pedido.findUniqueOrThrow({
    where: { id: idPedido },
    include: {
      items: {
        include: { producto: true },
      },
      producto: true,
    },
  });

  if (pedido.esCobro) {
    throw new Error("No se pueden modificar cajas de una cobranza.");
  }

  if (pedido.estadoPago === "PAGADO") {
    throw new Error("No se puede modificar la cantidad de un pedido ya pagado.");
  }

  // Si tiene un único ítem en ItemPedido, delegar para mantener consistencia
  if (pedido.items && pedido.items.length === 1) {
    return actualizarCajasItemPedido(pedido.items[0].id, nuevasCajas);
  }

  const diffCajas = nuevasCajas - pedido.cajas;
  if (diffCajas === 0) return { ok: true };

  // Ajustar stock físico si no es retiro
  if ((pedido.formaPago as string) !== "RETIRO" && pedido.idProducto) {
    if (diffCajas > 0) {
      await prisma.producto.update({
        where: { id: pedido.idProducto },
        data: { stockCajas: { decrement: diffCajas } },
      });
    } else {
      await prisma.producto.update({
        where: { id: pedido.idProducto },
        data: { stockCajas: { increment: Math.abs(diffCajas) } },
      });
    }
  }

  const esSinCargo =
    ((pedido.formaPago as string) === "CAMBIO" && pedido.esReposicion) ||
    ((pedido.formaPago as string) === "CANJE") ||
    ((pedido.formaPago as string) === "MUESTRA") ||
    ((pedido.formaPago as string) === "RETIRO");

  const precioUnit =
    pedido.producto?.precioReferencia ??
    (pedido.cajas > 0 ? pedido.montoTotal / pedido.cajas : 0);

  const subtotal = esSinCargo ? 0 : Math.round(precioUnit * nuevasCajas);
  const descPorCaja = pedido.descuentoEfectivo ? (pedido.descuentoPorCaja ?? 6000) : 0;
  const descuentoTotal = descPorCaja * nuevasCajas;
  const nuevoMontoTotal = esSinCargo ? 0 : Math.max(0, Math.round(subtotal - descuentoTotal));

  let nuevoEstadoPago: string = pedido.estadoPago;
  if (nuevoMontoTotal === 0 || esSinCargo) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado >= nuevoMontoTotal) {
    nuevoEstadoPago = "PAGADO";
  } else if (pedido.montoPagado > 0) {
    nuevoEstadoPago = "PARCIAL";
  } else {
    nuevoEstadoPago = "PENDIENTE";
  }

  await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      cajas: nuevasCajas,
      montoTotal: nuevoMontoTotal,
      estadoPago: nuevoEstadoPago as never,
    },
  });

  const fechaStr = pedido.fecha instanceof Date
    ? pedido.fecha.toISOString().split("T")[0]
    : String(pedido.fecha).split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/productos");
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarEstadoFactura(idPedido: number, estadoFactura: "NO_REQUIERE" | "PENDIENTE" | "EMITIDA") {
  const pedido = await prisma.pedido.update({
    where: { id: idPedido },
    data: {
      estadoFactura: estadoFactura as never,
      requiereFactura: estadoFactura !== "NO_REQUIERE",
    },
    select: { fecha: true },
  });
  const fechaStr = pedido.fecha.toISOString().split("T")[0];
  revalidatePath(`/pedidos/${fechaStr}`);
  revalidatePath("/pedidos");
  revalidatePath("/clientes");
}
