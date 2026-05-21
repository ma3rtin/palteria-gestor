import { notFound } from "next/navigation";
import { getPedidosPeriodo, getRevendedor, registrarLiquidacion } from "@/actions/revendedores";
import { formatearPeso, formatearFechaCorta, hoyISO, parseFechaRuta } from "@/lib/utils";
import { BotonSubmit } from "@/components/boton-submit";
import SelectorPeriodo from "./selector-periodo";

const ETIQUETAS_TIPO: Record<string, string> = {
  COMISION: "Comisión por caja",
  MARGEN: "Margen sobre precio",
  DESCUENTO: "Descuento por caja",
};

const FORMAS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

function semanaActualDesde() {
  const hoy = parseFechaRuta(hoyISO());
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return lunes.toLocaleDateString("en-CA");
}

function semanaActualHasta() {
  const hoy = parseFechaRuta(hoyISO());
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  return sabado.toLocaleDateString("en-CA");
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}

export default async function RevendedorDetallePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const desde = sp.desde ?? semanaActualDesde();
  const hasta = sp.hasta ?? semanaActualHasta();

  const [revendedor, { pedidos }] = await Promise.all([
    getRevendedor(Number(id)),
    getPedidosPeriodo(Number(id), desde, hasta),
  ]);

  if (!revendedor) notFound();

  const periodoLabel = `${formatearFechaCorta(desde)} – ${formatearFechaCorta(hasta)}`;

  // ====== Cálculos por tipo ======

  type PedidoConRelaciones = typeof pedidos[number];

  let montoCalculado = 0;
  let filas: React.ReactNode = null;
  let encabezados: React.ReactNode = null;

  if (revendedor.tipo === "COMISION") {
    // Agrupar por cliente
    const porCliente = new Map<number, { nombre: string; cajas: number; comision: number }>();
    for (const p of pedidos) {
      const comision = p.cliente.comisionPorCaja ?? 0;
      if (!porCliente.has(p.idCliente)) {
        porCliente.set(p.idCliente, { nombre: p.cliente.nombre, cajas: 0, comision });
      }
      porCliente.get(p.idCliente)!.cajas += p.cajas;
    }
    montoCalculado = [...porCliente.values()].reduce((s, c) => s + c.cajas * c.comision, 0);

    encabezados = (
      <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
        <th className="text-left px-4 py-3 font-medium">Cliente</th>
        <th className="text-right px-4 py-3 font-medium">Cajas</th>
        <th className="text-right px-4 py-3 font-medium">Comisión/caja</th>
        <th className="text-right px-4 py-3 font-medium">Subtotal</th>
      </tr>
    );
    filas = [...porCliente.entries()].map(([cid, c]) => (
      <tr key={cid} className="border-b border-[#22252e] last:border-0">
        <td className="px-4 py-3 text-[#f9fafb]">{c.nombre}</td>
        <td className="px-4 py-3 text-right text-[#9ca3af]">{c.cajas}</td>
        <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(c.comision)}</td>
        <td className="px-4 py-3 text-right font-semibold text-[#4ade80]">{formatearPeso(c.cajas * c.comision)}</td>
      </tr>
    ));
  } else if (revendedor.tipo === "MARGEN") {
    montoCalculado = pedidos.reduce((s, p) => s + (p.montoTotal - p.cajas * p.producto.precioReferencia), 0);

    encabezados = (
      <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
        <th className="text-left px-4 py-3 font-medium">Cliente</th>
        <th className="text-left px-4 py-3 font-medium">Producto</th>
        <th className="text-right px-4 py-3 font-medium">Cajas</th>
        <th className="text-right px-4 py-3 font-medium">P. lista</th>
        <th className="text-right px-4 py-3 font-medium">P. cobrado</th>
        <th className="text-right px-4 py-3 font-medium">Margen</th>
      </tr>
    );
    filas = pedidos.map((p) => {
      const margen = p.montoTotal - p.cajas * p.producto.precioReferencia;
      return (
        <tr key={p.id} className="border-b border-[#22252e] last:border-0">
          <td className="px-4 py-3 text-[#f9fafb]">{p.cliente.nombre}</td>
          <td className="px-4 py-3 text-[#9ca3af]">{p.producto.nombre}</td>
          <td className="px-4 py-3 text-right text-[#9ca3af]">{p.cajas}</td>
          <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(p.producto.precioReferencia)}</td>
          <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(p.montoTotal / p.cajas)}</td>
          <td className="px-4 py-3 text-right font-semibold text-[#4ade80]">{formatearPeso(margen)}</td>
        </tr>
      );
    });
  } else {
    // DESCUENTO
    encabezados = (
      <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
        <th className="text-left px-4 py-3 font-medium">Cliente</th>
        <th className="text-right px-4 py-3 font-medium">Cajas</th>
        <th className="text-right px-4 py-3 font-medium">Total Pedido</th>
        <th className="text-right px-4 py-3 font-medium">Monto Cobrado</th>
        <th className="text-left px-4 py-3 font-medium">Estado Pago</th>
      </tr>
    );
    filas = pedidos.map((p) => (
      <tr key={p.id} className="border-b border-[#22252e] last:border-0">
        <td className="px-4 py-3 text-[#f9fafb]">{p.cliente.nombre}</td>
        <td className="px-4 py-3 text-right text-[#9ca3af]">{p.cajas}</td>
        <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(p.montoTotal)}</td>
        <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(p.montoPagado)}</td>
        <td className="px-4 py-3 text-xs text-[#6b7280]">{p.estadoPago}</td>
      </tr>
    ));
    // Para DESCUENTO, el monto a liquidar se calcula 100% en el servidor.
    // El `montoCalculado` que se pasa al form es solo para los otros tipos.
  }

  const totalCajas = pedidos.reduce((s, p) => s + p.cajas, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <a href="/revendedores" className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Revendedores
        </a>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-[#f9fafb]">{revendedor.nombre}</h1>
          <span className="text-xs bg-[#22252e] text-[#9ca3af] px-2 py-0.5 rounded uppercase tracking-wide">
            {ETIQUETAS_TIPO[revendedor.tipo]}
          </span>
        </div>
        <p className="text-[#9ca3af] text-sm mt-0.5">
          {revendedor.clientes.length} cliente{revendedor.clientes.length !== 1 ? "s" : ""}:{" "}
          {revendedor.clientes.map((c) => c.nombre).join(", ")}
        </p>
      </div>

      <SelectorPeriodo idRevendedor={revendedor.id} desde={desde} hasta={hasta} />

      {pedidos.length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-10 text-center mb-6">
          <p className="text-[#6b7280] text-sm">Sin pedidos en el período {periodoLabel}.</p>
        </div>
      ) : (
        <>
          {/* Tabla de pedidos */}
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Pedidos — {periodoLabel}
          </h2>
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>{encabezados}</thead>
              <tbody>{filas}</tbody>
            </table>
            <div className="px-4 py-3 border-t border-[#2a2d35] flex justify-between items-center text-sm">
              <span className="text-[#6b7280]">{pedidos.length} pedidos · {totalCajas} cajas</span>
              {revendedor.tipo !== "DESCUENTO" && (
                <span className="font-semibold text-[#4ade80]">
                  Total: {formatearPeso(montoCalculado)}
                </span>
              )}
            </div>
          </div>

          {/* Form de liquidación */}
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-3">
            Registrar liquidación
          </h2>
          {(() => {
            const yaLiquidado = revendedor.liquidaciones.some(
              (l) =>
                l.fechaInicio.toLocaleDateString("en-CA") === desde &&
                l.fechaFin.toLocaleDateString("en-CA") === hasta
            );
            if (yaLiquidado) {
              return (
                <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg px-5 py-4 text-sm text-[#6b7280]">
                  Este período ya fue liquidado. Podés ver el detalle en el historial.
                </div>
              );
            }
            return null;
          })()}
          <form
            action={registrarLiquidacion}
            className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-5 flex flex-col gap-4"
          >
            <input type="hidden" name="idRevendedor" value={revendedor.id} />
            <input type="hidden" name="fechaInicio" value={desde} />
            <input type="hidden" name="fechaFin" value={hasta} />
            {/* El monto calculado solo se pasa para los tipos que lo pre-calculan en el cliente */}
            {revendedor.tipo !== "DESCUENTO" && (
              <input type="hidden" name="montoCalculado" value={montoCalculado} />
            )}
            {/* Para DESCUENTO, se pasa un valor dummy que el backend ignora y recalcula */}
            {revendedor.tipo === "DESCUENTO" && <input type="hidden" name="montoCalculado" value={0} />}

            <div className="grid grid-cols-2 gap-4">
              {revendedor.tipo === "DESCUENTO" && (
                <div>
                  <label className="block text-sm font-medium text-[#f9fafb] mb-1">
                    Descuento por caja
                  </label>
                  <input
                    name="descuentoPorCaja"
                    type="number"
                    step={500}
                    defaultValue={10000}
                    required
                    className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
                  />
                  <p className="text-xs text-[#6b7280] mt-1">
                    La ganancia a liquidar será: (descuento) × ({totalCajas} cajas).
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago</label>
                <select
                  name="formaPago"
                  className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
                >
                  <option value="">Sin especificar</option>
                  {FORMAS_PAGO.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
                <input
                  name="observaciones"
                  placeholder="Opcional"
                  className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#22252e]">
              <p className="text-sm text-[#9ca3af]">
                Paltería paga a {revendedor.nombre}:{" "}
                {revendedor.tipo !== "DESCUENTO" ? (
                  <span className="text-[#4ade80] font-semibold">{formatearPeso(montoCalculado)}</span>
                ) : (
                  <span className="text-[#9ca3af] italic">(monto calculado con el descuento de arriba)</span>
                )}
              </p>
              <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Registrar liquidación
              </BotonSubmit>
            </div>
          </form>
        </>
      )}

      {/* Historial */}
      {revendedor.liquidaciones.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mt-8 mb-3">
            Historial
          </h2>
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                  <th className="text-left px-4 py-3 font-medium">Período</th>
                  <th className="text-right px-4 py-3 font-medium">Comisión</th>
                  <th className="text-right px-4 py-3 font-medium">Pagado</th>
                  <th className="text-left px-4 py-3 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium">Forma de pago</th>
                </tr>
              </thead>
              <tbody>
                {revendedor.liquidaciones.map((l) => (
                  <tr key={l.id} className="border-b border-[#22252e] last:border-0">
                    <td className="px-4 py-3 text-[#9ca3af]">
                      {formatearFechaCorta(l.fechaInicio)} – {formatearFechaCorta(l.fechaFin)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#9ca3af]">{formatearPeso(l.montoCalculado)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#4ade80]">{formatearPeso(l.montoPagado)}</td>
                    <td className="px-4 py-3 text-[#9ca3af] text-xs">
                      {l.fechaPago ? formatearFechaCorta(l.fechaPago) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af] text-xs">{l.formaPago ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
