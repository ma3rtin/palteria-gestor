"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hoyISO, parseFechaRuta } from "@/lib/utils";

export async function getClientes(busqueda?: string, idZona?: number) {
  return prisma.cliente.findMany({
    where: {
      activo: true,
      ...(busqueda
        ? { nombre: { contains: busqueda, mode: "insensitive" } }
        : {}),
      ...(idZona ? { idZona } : {}),
    },
    include: { zona: true, repartidor: true, cuentaCorriente: true },
    orderBy: [{ zona: { nombre: "asc" } }, { nombre: "asc" }],
  });
}

export async function getClientesBasicos() {
  return prisma.cliente.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, idZona: true, zona: { select: { nombre: true } }, formaPagoPref: true, idRepartidor: true, requiereFactura: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getCliente(id: number) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      zona: true,
      repartidor: true,
      cuentaCorriente: true,
      pedidos: {
        orderBy: { fecha: "desc" },
        take: 50,
        include: {
          producto: true,
          cliente: { include: { zona: true } }
        },
      },
      pagosLocales: {
        orderBy: { fechaPago: "desc" },
        include: { repartidor: true }
      }
    },
  });

  if (!cliente) return null;

  const hoy = parseFechaRuta(hoyISO());
  const limite28Dias = new Date(hoy);
  limite28Dias.setDate(hoy.getDate() - 28);

  const pedidos28Dias = await prisma.pedido.findMany({
    where: {
      idCliente: id,
      fecha: { gte: limite28Dias },
      esCobro: false,
    },
    select: { cajas: true },
  });

  const cajas28Dias = pedidos28Dias.reduce((sum, p) => sum + p.cajas, 0);

  const msPorSemana = 1000 * 60 * 60 * 24 * 7;
  const semanasDesdeCreacion = (hoy.getTime() - cliente.creadoEn.getTime()) / msPorSemana;
  const divisorSemanas = Math.max(1, Math.min(4, semanasDesdeCreacion));
  const volumenSemanal = cajas28Dias / divisorSemanas;

  let rangoVolumen = "0-10";
  if (volumenSemanal >= 70) {
    rangoVolumen = "70+";
  } else if (volumenSemanal >= 50) {
    rangoVolumen = "50-70";
  } else if (volumenSemanal >= 30) {
    rangoVolumen = "30-50";
  } else if (volumenSemanal >= 20) {
    rangoVolumen = "20-30";
  } else if (volumenSemanal >= 10) {
    rangoVolumen = "10-20";
  } else {
    rangoVolumen = "0-10";
  }

  return {
    ...cliente,
    volumenSemanal,
    rangoVolumen,
  };
}

export async function getSaldoCliente(idCliente: number) {
  const agg = await prisma.pedido.aggregate({
    where: { idCliente, estadoPago: { not: "PAGADO" }, esCobro: false },
    _sum: { montoTotal: true, montoPagado: true },
  });
  return (agg._sum.montoTotal ?? 0) - (agg._sum.montoPagado ?? 0);
}

export async function getClientesConSaldo(
  idZona?: number,
  idRepartidor?: number,
  incluirInactivos?: boolean
) {
  const clientes = await prisma.cliente.findMany({
    where: {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(idZona ? { idZona } : {}),
      ...(idRepartidor ? { idRepartidor } : {}),
    },
    include: { zona: true, repartidor: true },
    orderBy: { nombre: "asc" },
  });

  const saldos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: { estadoPago: { not: "PAGADO" }, esCobro: false },
    _sum: { montoTotal: true, montoPagado: true },
  });

  const mapaDeuda = new Map(
    saldos.map((s) => [
      s.idCliente,
      (s._sum.montoTotal ?? 0) - (s._sum.montoPagado ?? 0),
    ])
  );

  return clientes.map((c) => ({ ...c, saldoPendiente: mapaDeuda.get(c.id) ?? 0 }));
}

export interface ClienteConIndicadores {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  idZona: number;
  idRepartidor: number | null;
  formaPagoPref: string;
  requiereFactura: boolean;
  idCuentaCorriente: number | null;
  idRevendedor: number | null;
  activo: boolean;
  observaciones: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  zona: { id: number; nombre: string };
  repartidor: { id: number; nombre: string } | null;
  saldoPendiente: number;
  ultimoPedido: string | null;
  diasInactivo: number;
  volumenSemanal: number;
  rangoVolumen: string;
  tendenciaCajas: number | null;
}

export interface ClientesPagedResponse {
  clientes: ClienteConIndicadores[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getClientesConSaldoPaginado(
  page: number = 0,
  pageSize: number = 20,
  idZona?: number,
  idRepartidor?: number,
  busqueda?: string,
  tab: string = "activos",
  volumen?: string
): Promise<ClientesPagedResponse> {
  const skip = page * pageSize;

  const where = {
    activo: true,
    ...(idZona ? { idZona } : {}),
    ...(idRepartidor ? { idRepartidor } : {}),
    ...(busqueda ? {
      OR: [
        { nombre: { contains: busqueda, mode: "insensitive" as const } },
        { zona: { nombre: { contains: busqueda, mode: "insensitive" as const } } }
      ]
    } : {})
  };

  // 1. Obtener todos los clientes que coinciden con los criterios de búsqueda principales
  const todosClientes = await prisma.cliente.findMany({
    where,
    include: { zona: true, repartidor: true },
  });

  if (todosClientes.length === 0) {
    return {
      clientes: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  // 2. Obtener los saldos pendientes de estos clientes
  const saldos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: {
      idCliente: { in: todosClientes.map((c) => c.id) },
      estadoPago: { not: "PAGADO" },
      esCobro: false,
    },
    _sum: { montoTotal: true, montoPagado: true },
  });

  const mapaDeuda = new Map(
    saldos.map((s) => [
      s.idCliente,
      (s._sum.montoTotal ?? 0) - (s._sum.montoPagado ?? 0),
    ])
  );

  // 3. Obtener los pedidos y cobranzas de los últimos 28 días
  const hoy = parseFechaRuta(hoyISO());
  const limite14Dias = new Date(hoy);
  limite14Dias.setDate(hoy.getDate() - 14);
  const limite28Dias = new Date(hoy);
  limite28Dias.setDate(hoy.getDate() - 28);

  const pedidosRecientes = await prisma.pedido.findMany({
    where: {
      idCliente: { in: todosClientes.map((c) => c.id) },
      fecha: { gte: limite28Dias },
    },
    select: {
      idCliente: true,
      fecha: true,
      cajas: true,
      esCobro: true,
    },
    orderBy: { fecha: "desc" },
  });

  // Agrupar pedidos recientes por cliente
  const pedidosPorCliente = new Map<number, typeof pedidosRecientes>();
  for (const p of pedidosRecientes) {
    if (!pedidosPorCliente.has(p.idCliente)) {
      pedidosPorCliente.set(p.idCliente, []);
    }
    pedidosPorCliente.get(p.idCliente)!.push(p);
  }

  // 4. Calcular indicadores para cada cliente en memoria
  const clientesConIndicadores = todosClientes.map((c) => {
    const pedidosC = pedidosPorCliente.get(c.id) ?? [];

    // Último pedido o cobro registrado
    const ultReg = pedidosC[0];
    const ultimoPedido = ultReg ? ultReg.fecha.toISOString().split("T")[0] : null;

    let diasInactivo = 0;
    if (ultReg) {
      const diffMs = hoy.getTime() - ultReg.fecha.getTime();
      diasInactivo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else {
      const diffMs = hoy.getTime() - c.creadoEn.getTime();
      diasInactivo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Volumen de cajas (excluyendo cobranzas)
    const pedidosEntrega = pedidosC.filter((p) => !p.esCobro);
    const cajas28Dias = pedidosEntrega.reduce((sum, p) => sum + p.cajas, 0);

    const msPorSemana = 1000 * 60 * 60 * 24 * 7;
    const semanasDesdeCreacion = (hoy.getTime() - c.creadoEn.getTime()) / msPorSemana;
    const divisorSemanas = Math.max(1, Math.min(4, semanasDesdeCreacion));
    const volumenSemanal = cajas28Dias / divisorSemanas;

    let rangoVolumen = "0-10";
    if (volumenSemanal >= 70) {
      rangoVolumen = "70+";
    } else if (volumenSemanal >= 50) {
      rangoVolumen = "50-70";
    } else if (volumenSemanal >= 30) {
      rangoVolumen = "30-50";
    } else if (volumenSemanal >= 20) {
      rangoVolumen = "20-30";
    } else if (volumenSemanal >= 10) {
      rangoVolumen = "10-20";
    } else {
      rangoVolumen = "0-10";
    }

    // Tendencia de cajas: últimos 14 días vs los 14 días anteriores
    const cajasPeriodoA = pedidosEntrega
      .filter((p) => p.fecha >= limite14Dias)
      .reduce((sum, p) => sum + p.cajas, 0);
    const cajasPeriodoB = pedidosEntrega
      .filter((p) => p.fecha < limite14Dias)
      .reduce((sum, p) => sum + p.cajas, 0);

    const hasActivity = pedidosEntrega.length > 0;
    const tendenciaCajas = hasActivity ? cajasPeriodoA - cajasPeriodoB : null;

    const saldoPendiente = mapaDeuda.get(c.id) ?? 0;

    return {
      ...c,
      saldoPendiente,
      ultimoPedido,
      diasInactivo,
      volumenSemanal,
      rangoVolumen,
      tendenciaCajas,
    };
  });

  // 5. Aplicar filtros dinámicos
  let filtrados = clientesConIndicadores;

  // Filtrado por pestaña de inactividad de pedidos (14 días sin actividad)
  if (tab === "inactivos") {
    filtrados = filtrados.filter((c) => c.diasInactivo >= 14);
  } else {
    // por defecto "activos"
    filtrados = filtrados.filter((c) => c.diasInactivo < 14);
  }

  // Filtrado por rango de volumen semanal
  if (volumen) {
    filtrados = filtrados.filter((c) => c.rangoVolumen === volumen);
  }

  // Ordenación (por nombre ascendente para consistencia)
  filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const total = filtrados.length;
  const clientesPaginados = filtrados.slice(skip, skip + pageSize);

  return {
    clientes: clientesPaginados,
    total,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function getCatalogoFormulario() {
  const zonas = await prisma.zona.findMany({ orderBy: { nombre: "asc" } });
  const repartidores = await prisma.repartidor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  const cuentas = await prisma.cuentaCorriente.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  const revendedores = await prisma.revendedor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
  return { zonas, repartidores, cuentas, revendedores };
}

export async function crearCliente(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string | null;
  const telefono = formData.get("telefono") as string | null;
  const idZona = Number(formData.get("idZona"));
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const formaPagoPref = formData.get("formaPagoPref") as string;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const idCuentaCorriente = formData.get("idCuentaCorriente") ? Number(formData.get("idCuentaCorriente")) : null;
  const idRevendedor = formData.get("idRevendedor") ? Number(formData.get("idRevendedor")) : null;
  const observaciones = formData.get("observaciones") as string | null;

  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre del cliente es requerido.");
  }
  if (isNaN(idZona) || idZona <= 0) {
    throw new Error("Debe seleccionar una zona válida para el cliente.");
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre: nombre.trim().toUpperCase(),
      direccion: direccion?.trim() || null,
      telefono: telefono?.trim() || null,
      idZona,
      idRepartidor,
      formaPagoPref: formaPagoPref as never,
      requiereFactura,
      idCuentaCorriente,
      idRevendedor,
      observaciones: observaciones?.trim() || null,
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${cliente.id}`);
}

export async function actualizarCliente(id: number, formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string | null;
  const telefono = formData.get("telefono") as string | null;
  const idZona = Number(formData.get("idZona"));
  const idRepartidor = formData.get("idRepartidor") ? Number(formData.get("idRepartidor")) : null;
  const formaPagoPref = formData.get("formaPagoPref") as string;
  const requiereFactura = formData.get("requiereFactura") === "on";
  const idCuentaCorriente = formData.get("idCuentaCorriente") ? Number(formData.get("idCuentaCorriente")) : null;
  const idRevendedor = formData.get("idRevendedor") ? Number(formData.get("idRevendedor")) : null;
  const observaciones = formData.get("observaciones") as string | null;

  if (isNaN(id) || id <= 0) {
    throw new Error("ID de cliente inválido.");
  }
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre del cliente es requerido.");
  }
  if (isNaN(idZona) || idZona <= 0) {
    throw new Error("Debe seleccionar una zona válida para el cliente.");
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      nombre: nombre.trim().toUpperCase(),
      direccion: direccion?.trim() || null,
      telefono: telefono?.trim() || null,
      idZona,
      idRepartidor,
      formaPagoPref: formaPagoPref as never,
      requiereFactura,
      idCuentaCorriente,
      idRevendedor,
      observaciones: observaciones?.trim() || null,
    },
  });

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

export async function toggleActivoCliente(id: number, activo: boolean) {
  await prisma.cliente.update({ where: { id }, data: { activo } });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
