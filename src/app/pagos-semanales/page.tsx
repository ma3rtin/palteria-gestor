import Link from "next/link";
import { getCuentasCorrientes } from "@/actions/pagos-semanales";
import { formatearPeso } from "@/lib/utils";

export default async function PagosSemanalesPage() {
  const cuentas = await getCuentasCorrientes();
  const deudaTotal = cuentas.reduce((s, c) => s + c.deudaTotal, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Pagos semanales</h1>
        <p className="text-[#9ca3af] mt-0.5 text-sm">
          {cuentas.length} cuentas corrientes · {formatearPeso(deudaTotal)} pendiente total
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {cuentas.map((cc) => (
          <Link
            key={cc.id}
            href={`/pagos-semanales/${cc.id}`}
            className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] hover:border-[#a3e635] px-5 py-4 flex items-center justify-between transition-colors group"
          >
            <div>
              <span className="font-semibold text-[#f9fafb] group-hover:text-[#a3e635]">
                {cc.nombre}
              </span>
              <div className="flex gap-3 mt-1 text-xs text-[#6b7280]">
                <span>{cc.clientes.length} locales</span>
                {cc.diaCobranza && <span>Cobra: {cc.diaCobranza}</span>}
              </div>
            </div>
            <div className="text-right">
              {cc.deudaTotal > 0 ? (
                <span className="font-bold text-red-500">{formatearPeso(cc.deudaTotal)}</span>
              ) : (
                <span className="text-[#4ade80] font-medium text-sm">Al día ✓</span>
              )}
              <p className="text-[#6b7280] text-xs mt-0.5">pendiente</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
