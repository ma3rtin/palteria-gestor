"use server";

import { prisma } from "@/lib/prisma";
import { hoyISO, parseFechaRuta } from "@/lib/utils";

export async function getStatsSemana() {
  const hoy = parseFechaRuta(hoyISO());

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const agregado = await prisma.pedido.aggregate({
    where: { fecha: { gte: lunes, lte: domingo }, esCobro: false },
    _sum: { cajas: true, montoTotal: true, montoPagado: true },
    _count: { id: true },
  });
  const porProducto = await prisma.itemPedido.groupBy({
    by: ["idProducto"],
    where: {
      pedido: {
        fecha: { gte: lunes, lte: domingo },
        esCobro: false,
      },
    },
    _sum: { cajas: true, subtotal: true },
    orderBy: { _sum: { cajas: "desc" } },
    take: 6,
  });

  const idsProductos = porProducto
    .map((p) => p.idProducto)
    .filter((id): id is number => id !== null);

  const productos = await prisma.producto.findMany({
    where: { id: { in: idsProductos } },
    select: { id: true, nombre: true },
  });

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

  return {
    totalCajasSemana: agregado._sum.cajas ?? 0,
    totalMontoSemana: agregado._sum.montoTotal ?? 0,
    totalCobradoSemana: agregado._sum.montoPagado ?? 0,
    totalPedidosSemana: agregado._count.id,
    topProductos: porProducto.map((p) => ({
      nombre: productos.find((pr) => pr.id === p.idProducto)?.nombre ?? "?",
      cajas: p._sum.cajas ?? 0,
      monto: p._sum.subtotal ?? 0,
    })),
    semanaLabel: `${fmt(lunes)} – ${fmt(domingo)}`,
  };
}

export async function getStatsHoy() {
  const hoy = parseFechaRuta(hoyISO());

  const pedidosHoy = await prisma.pedido.findMany({
    where: { fecha: hoy, esCobro: false },
    include: {
      cliente: {
        include: {
          zona: true,
          revendedor: { select: { id: true, nombre: true } },
        },
      },
      producto: true,
      items: { include: { producto: true } },
      repartidor: true,
    },
    orderBy: [
      { creadoEn: "desc" }
    ],
  });
  const deudaAgregada = await prisma.pedido.aggregate({
    where: { estadoPago: { not: "PAGADO" }, esCobro: false },
    _sum: { montoTotal: true, montoPagado: true },
  });
  const clientesConDeudaGrupos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: { estadoPago: { not: "PAGADO" }, esCobro: false },
  });

  const totalCajas = pedidosHoy.reduce((s, p) => s + p.cajas, 0);
  const totalMonto = pedidosHoy.reduce((s, p) => s + p.montoTotal, 0);
  const totalCobrado = pedidosHoy.reduce((s, p) => s + p.montoPagado, 0);
  const pedidosPendientes = pedidosHoy.filter((p) => p.estadoPago !== "PAGADO").length;
  const montoDeuda =
    (deudaAgregada._sum.montoTotal ?? 0) - (deudaAgregada._sum.montoPagado ?? 0);

  return {
    totalPedidosHoy: pedidosHoy.length,
    totalCajasHoy: totalCajas,
    totalMontoHoy: totalMonto,
    totalCobradoHoy: totalCobrado,
    pedidosPendientesHoy: pedidosPendientes,
    clientesConDeuda: clientesConDeudaGrupos.length,
    montoTotalDeuda: montoDeuda,
    pedidosHoy,
  };
}

export async function getResumenPorRepartidorHoy() {
  const hoy = parseFechaRuta(hoyISO());

  const [grupos, gruposSucursales] = await Promise.all([
    prisma.pedido.groupBy({
      by: ["idRepartidor"],
      where: { fecha: hoy, esCobro: false },
      _sum: { cajas: true, montoTotal: true, montoPagado: true },
      _count: { id: true },
    }),
    prisma.envioSucursal.groupBy({
      by: ["idRepartidor"],
      where: { fecha: hoy },
      _sum: { cajas: true },
      _count: { id: true },
    }),
  ]);

  const repMap = new Map<number | null, {
    totalCajas: number;
    totalMonto: number;
    totalCobrado: number;
    cantPedidos: number;
  }>();

  for (const g of grupos) {
    repMap.set(g.idRepartidor, {
      totalCajas: g._sum.cajas ?? 0,
      totalMonto: g._sum.montoTotal ?? 0,
      totalCobrado: g._sum.montoPagado ?? 0,
      cantPedidos: g._count.id,
    });
  }

  for (const gs of gruposSucursales) {
    const existing = repMap.get(gs.idRepartidor) ?? {
      totalCajas: 0,
      totalMonto: 0,
      totalCobrado: 0,
      cantPedidos: 0,
    };
    existing.totalCajas += gs._sum.cajas ?? 0;
    existing.cantPedidos += gs._count.id;
    repMap.set(gs.idRepartidor, existing);
  }

  const idsValidos = Array.from(repMap.keys()).filter((id): id is number => id !== null);
  const repartidores = await prisma.repartidor.findMany({
    where: { id: { in: idsValidos } },
  });

  return Array.from(repMap.entries())
    .map(([idRepartidor, datos]) => ({
      repartidor: idRepartidor ? (repartidores.find((r) => r.id === idRepartidor) ?? null) : null,
      totalCajas: datos.totalCajas,
      totalMonto: datos.totalMonto,
      totalCobrado: datos.totalCobrado,
      cantPedidos: datos.cantPedidos,
    }))
    .sort((a, b) => {
      // Sin asignar al final, resto por totalCajas desc
      if (!a.repartidor) return 1;
      if (!b.repartidor) return -1;
      return b.totalCajas - a.totalCajas;
    });
}

export async function getStockHoy() {
  const hoy = parseFechaRuta(hoyISO());

  // 1. Cajas vendidas hoy desde itemsPedido
  const itemsHoy = await prisma.itemPedido.groupBy({
    by: ["idProducto"],
    where: {
      pedido: {
        fecha: hoy,
        esCobro: false,
      },
    },
    _sum: { cajas: true },
  });

  // 2. Cajas vendidas hoy desde pedidos legados
  const pedidosLegadosHoy = await prisma.pedido.findMany({
    where: {
      fecha: hoy,
      esCobro: false,
      idProducto: { not: null },
      items: { none: {} },
    },
    select: {
      idProducto: true,
      cajas: true,
    },
  });

  // 3. Cajas trasladadas a sucursales hoy desde itemsEnvioSucursal
  const itemsSucursalesHoy = await prisma.itemEnvioSucursal.groupBy({
    by: ["idProducto"],
    where: {
      envio: {
        fecha: hoy,
      },
    },
    _sum: { cajas: true },
  });

  const cajasVendidasMap = new Map<number, number>();
  for (const it of itemsHoy) {
    cajasVendidasMap.set(it.idProducto, (cajasVendidasMap.get(it.idProducto) ?? 0) + (it._sum.cajas ?? 0));
  }
  for (const pl of pedidosLegadosHoy) {
    if (pl.idProducto) {
      cajasVendidasMap.set(pl.idProducto, (cajasVendidasMap.get(pl.idProducto) ?? 0) + pl.cajas);
    }
  }
  for (const its of itemsSucursalesHoy) {
    cajasVendidasMap.set(its.idProducto, (cajasVendidasMap.get(its.idProducto) ?? 0) + (its._sum.cajas ?? 0));
  }

  const idsVendidosHoy = Array.from(cajasVendidasMap.keys());

  // 3. Productos que están activos en catálogo O que tuvieron ventas en la jornada
  const productos = await prisma.producto.findMany({
    where: {
      OR: [
        { activo: true },
        { id: { in: idsVendidosHoy } },
      ],
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      fechaIngreso: true,
      stockCajas: true,
      kgPorCaja: true,
      activo: true,
    },
  });

  const fmtFecha = (d: Date | null) =>
    d ? d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) : null;

  // Filtrar estrictamente: solo productos con ventas hoy O con stock real en cámara (> 0)
  const variedades = productos
    .map((p) => {
      const vendidas = cajasVendidasMap.get(p.id) ?? 0;
      return {
        id: p.id,
        nombre: p.nombre,
        lote: fmtFecha(p.fechaIngreso),
        cajasVendidasHoy: vendidas,
        stockDisponible: p.stockCajas,
        kgPorCaja: p.kgPorCaja,
        activo: p.activo,
      };
    })
    .filter((v) => v.cajasVendidasHoy > 0 || (v.activo && v.stockDisponible > 0));

  variedades.sort((a, b) => {
    if (b.cajasVendidasHoy !== a.cajasVendidasHoy) {
      return b.cajasVendidasHoy - a.cajasVendidasHoy;
    }
    return b.stockDisponible - a.stockDisponible;
  });

  const totalCajasVendidasHoy = Array.from(cajasVendidasMap.values()).reduce((s, c) => s + c, 0);
  const totalStockDisponible = productos
    .filter((p) => p.activo)
    .reduce((s, p) => s + p.stockCajas, 0);

  return {
    variedades,
    totalCajasVendidasHoy,
    totalStockDisponible,
  };
}
