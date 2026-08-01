"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  return prisma.cliente.findUnique({
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

export interface ClientesPagedResponse {
  clientes: Awaited<ReturnType<typeof getClientesConSaldo>>;
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
  incluirInactivos: boolean = false,
  busqueda?: string
): Promise<ClientesPagedResponse> {
  const skip = page * pageSize;

  const where = {
    ...(incluirInactivos ? {} : { activo: true }),
    ...(idZona ? { idZona } : {}),
    ...(idRepartidor ? { idRepartidor } : {}),
    ...(busqueda ? {
      OR: [
        { nombre: { contains: busqueda, mode: "insensitive" as const } },
        { zona: { nombre: { contains: busqueda, mode: "insensitive" as const } } }
      ]
    } : {})
  };

  const clientes = await prisma.cliente.findMany({
    where,
    include: { zona: true, repartidor: true },
    orderBy: { nombre: "asc" },
    skip,
    take: pageSize,
  });

  const saldos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: {
      idCliente: { in: clientes.map((c) => c.id) },
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

  const total = await prisma.cliente.count({ where });

  const clientesConSaldo = clientes.map((c) => ({
    ...c,
    saldoPendiente: mapaDeuda.get(c.id) ?? 0,
  }));

  return {
    clientes: clientesConSaldo,
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
