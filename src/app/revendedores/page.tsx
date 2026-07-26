import Link from "next/link";
import { getRevendedores } from "@/actions/revendedores";
import { prisma } from "@/lib/prisma";
import { formatearPeso, hoyISO, parseFechaRuta } from "@/lib/utils";

// Removed ETIQUETAS_TIPO

async function getResumenSemana() {
  const hoy = parseFechaRuta(hoyISO());
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: lunes, hasta: domingo };
}

export default async function RevendedoresPage() {
  const revendedores = await getRevendedores();
  const { desde, hasta } = await getResumenSemana();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f9fafb]">Revendedores</h1>
          <p className="text-[#9ca3af] mt-0.5 text-sm">Liquidaciones semanales</p>
        </div>
        <Link
          href="/config/revendedores"
          className="text-xs text-[#6b7280] hover:text-[#a3e635] border border-[#2a2d35] px-3 py-1.5 rounded-md transition-colors"
        >
          Configurar
        </Link>
      </div>

      {revendedores.filter((r) => r.activo).length === 0 ? (
        <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-12 text-center">
          <p className="text-[#6b7280] text-sm">No hay revendedores activos.</p>
          <Link href="/config/revendedores" className="inline-block mt-3 text-[#a3e635] text-sm hover:underline">
            Agregar revendedor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {revendedores.filter((r) => r.activo).map((r) => (
            <Link
              key={r.id}
              href={`/revendedores/${r.id}`}
              className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-5 hover:border-[#a3e635] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-semibold text-[#f9fafb]">{r.nombre}</span>
              </div>
              <p className="text-xs text-[#6b7280]">
                {r._count.clientes} cliente{r._count.clientes !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#a3e635] mt-2">Ver liquidación</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
