import Link from "next/link";
import { getCuentasCorrientesPaginadas } from "@/actions/pagos-semanales";
import { formatearPeso } from "@/lib/utils";
import { BuscadorPagosSemanales } from "./buscador";
import { Paginador } from "@/components/paginador";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function PagosSemanalesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q;
  const page = sp.page ?? "0";
  const pageNum = Number(page);
  const pageSize = 20;

  const { cuentas, total, deudaTotalGlobal, hasMore } = await getCuentasCorrientesPaginadas(q, pageNum, pageSize);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Pagos semanales</h1>
        <p className="text-[#9ca3af] mt-0.5 text-sm">
          {total} cuentas corrientes · {formatearPeso(deudaTotalGlobal)} pendiente total
        </p>
      </div>

      {/* Buscador */}
      <BuscadorPagosSemanales qActual={q} />

      {cuentas.length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-12 text-center">
          <p className="text-[#6b7280] text-sm">No se encontraron cuentas corrientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {cuentas.map((cc) => (
            <Link
              key={cc.id}
              href={`/pagos-semanales/${cc.id}`}
              className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] hover:border-[#a3e635] px-4 py-2.5 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#f9fafb] group-hover:text-[#a3e635] transition-colors">
                  {cc.nombre}
                </span>
                <span className="text-[10px] text-[#6b7280] bg-[#22252e] px-1.5 py-0.5 rounded font-medium">
                  {cc.clientes.length} local{cc.clientes.length !== 1 ? "es" : ""} {cc.diaCobranza && `· Cobra: ${cc.diaCobranza}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cc.deudaTotal > 0 ? (
                  <span className="text-sm font-bold text-red-500 font-mono">{formatearPeso(cc.deudaTotal)}</span>
                ) : (
                  <span className="text-[#4ade80] font-medium text-xs bg-[#166534]/30 px-1.5 py-0.5 rounded">Al día ✓</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginación */}
      <Paginador
        pageActual={pageNum}
        totalPaginas={Math.ceil(total / pageSize)}
        totalItems={total}
        hrefAnterior={`?page=${pageNum - 1}${q ? `&q=${q}` : ""}`}
        hrefSiguiente={`?page=${pageNum + 1}${q ? `&q=${q}` : ""}`}
        hasMore={hasMore}
        className="mt-6"
      />
    </div>
  );
}
