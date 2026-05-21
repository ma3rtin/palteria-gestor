import { crearRevendedor, getRevendedores, toggleRevendedor } from "@/actions/revendedores";
import { BotonSubmit } from "@/components/boton-submit";

const TIPOS = [
  { value: "COMISION", label: "Comisión por caja" },
  { value: "MARGEN", label: "Margen sobre precio" },
  { value: "DESCUENTO", label: "Descuento por caja" },
];

export default async function ConfigRevendedoresPage() {
  const revendedores = await getRevendedores();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Revendedores</h1>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 font-medium">Tipo</th>
              <th className="text-right px-4 py-3 font-medium">Clientes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {revendedores.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#6b7280]">
                  Sin revendedores cargados.
                </td>
              </tr>
            ) : (
              revendedores.map((r) => (
                <tr key={r.id} className={`border-b border-[#22252e] last:border-0 ${!r.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-[#f9fafb]">{r.nombre}</td>
                  <td className="px-4 py-3 text-[#9ca3af] text-xs">
                    {TIPOS.find((t) => t.value === r.tipo)?.label ?? r.tipo}
                  </td>
                  <td className="px-4 py-3 text-right text-[#9ca3af]">{r._count.clientes}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleRevendedor}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="activo" value={r.activo.toString()} />
                      <BotonSubmit className="text-xs text-[#6b7280] hover:text-[#9ca3af]">
                        {r.activo ? "Desactivar" : "Activar"}
                      </BotonSubmit>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
        <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">Agregar revendedor</h3>
        <form action={crearRevendedor} className="flex gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Nombre *</label>
            <input
              name="nombre"
              required
              placeholder="OSCAR, PATO, PUESTO DE PALTA..."
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div className="flex flex-col gap-1 w-52">
            <label className="text-[10px] uppercase tracking-widest text-[#6b7280]">Tipo *</label>
            <select
              name="tipo"
              required
              className="border border-[#2a2d35] rounded-lg px-3 py-2 text-sm bg-[#1c1f26] focus:outline-none focus:border-[#a3e635]"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <BotonSubmit className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Agregar
          </BotonSubmit>
        </form>
      </div>
    </div>
  );
}
