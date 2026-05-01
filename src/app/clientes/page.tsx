import Link from "next/link";
import { getClientesConSaldo } from "@/actions/clientes";
import { formatearPeso } from "@/lib/utils";
import { BuscadorClientes } from "./buscador";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClientesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const clientes = await getClientesConSaldo();

  const filtrados = q
    ? clientes.filter((c) =>
        c.nombre.toLowerCase().includes(q.toLowerCase()) ||
        c.zona.nombre.toLowerCase().includes(q.toLowerCase())
      )
    : clientes;

  const conDeuda = filtrados.filter((c) => c.saldoPendiente > 0);
  const sinDeuda = filtrados.filter((c) => c.saldoPendiente === 0);
  const ordenados = [...conDeuda, ...sinDeuda];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <BuscadorClientes valorInicial={q ?? ""} />

      <div className="mt-4 bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        {ordenados.length === 0 ? (
          <div className="p-8 text-center text-[#6b7280] text-sm">
            {q ? `Sin resultados para "${q}"` : "No hay clientes registrados."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Zona</th>
                <th className="text-left px-4 py-3 font-medium">Repartidor</th>
                <th className="text-left px-4 py-3 font-medium">Forma de pago</th>
                <th className="text-right px-4 py-3 font-medium">Saldo pendiente</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#22252e] last:border-0 hover:bg-[#22252e] cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <Link href={`/clientes/${c.id}`} className="block">
                      <span className="font-medium text-[#f9fafb]">{c.nombre}</span>
                      {!c.activo && (
                        <span className="ml-2 text-xs text-[#6b7280]">(inactivo)</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[#9ca3af]">
                    <Link href={`/clientes/${c.id}`} className="block">{c.zona.nombre}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-[#9ca3af]">
                    <Link href={`/clientes/${c.id}`} className="block">{c.repartidor?.nombre ?? "—"}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-[#9ca3af]">
                    <Link href={`/clientes/${c.id}`} className="block">
                      {c.formaPagoPref === "PAGO_SEMANAL"
                        ? "Pago semanal"
                        : c.formaPagoPref === "TRANSFERENCIA"
                        ? "Transferencia"
                        : "Efectivo"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/clientes/${c.id}`} className="block">
                      <span className={c.saldoPendiente > 0 ? "font-semibold text-red-600" : "text-[#6b7280]"}>
                        {c.saldoPendiente > 0 ? formatearPeso(c.saldoPendiente) : "—"}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-[#6b7280] mt-3">
        {filtrados.length} clientes · {conDeuda.length} con deuda
      </p>
    </div>
  );
}
