import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BotonSubmit } from "@/components/boton-submit";

async function crearRepartidor(formData: FormData) {
  "use server";
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  const max = await prisma.repartidor.aggregate({ _max: { id: true } });
  const nuevoId = (max._max.id ?? 0) + 1;
  await prisma.repartidor.create({ data: { id: nuevoId, nombre } });
  revalidatePath("/config/repartidores");
}

async function toggleActivo(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await prisma.repartidor.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/config/repartidores");
}

async function renombrarRepartidor(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.repartidor.update({ where: { id }, data: { nombre } });
  revalidatePath("/config/repartidores");
}

export default async function ConfigRepartidoresPage() {
  const repartidores = await prisma.repartidor.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { pedidos: true } } },
  });

  const activos = repartidores.filter((r) => r.activo);
  const inactivos = repartidores.filter((r) => !r.activo);

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href="/config/zonas" className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Configuración
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Repartidores</h1>
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium">Pedidos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {activos.map((r) => (
              <tr key={r.id} className="border-b border-[#22252e] last:border-0">
                <td className="px-4 py-2">
                  <form action={renombrarRepartidor} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="nombre"
                      defaultValue={r.nombre}
                      className="border border-[#2a2d35] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#a3e635] w-40"
                    />
                    <BotonSubmit className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
                      Renombrar
                    </BotonSubmit>
                  </form>
                </td>
                <td className="px-4 py-2 text-right text-[#6b7280]">{r._count.pedidos}</td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleActivo}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="activo" value="true" />
                    <BotonSubmit className="text-xs text-[#6b7280] hover:text-red-500">
                      Desactivar
                    </BotonSubmit>
                  </form>
                </td>
              </tr>
            ))}

            {inactivos.length > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-xs text-[#6b7280] bg-[#22252e] font-medium">
                    Inactivos
                  </td>
                </tr>
                {inactivos.map((r) => (
                  <tr key={r.id} className="border-b border-[#22252e] last:border-0 opacity-50">
                    <td className="px-4 py-2 text-[#9ca3af]">{r.nombre}</td>
                    <td className="px-4 py-2 text-right text-[#6b7280]">{r._count.pedidos}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={toggleActivo}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="activo" value="false" />
                        <BotonSubmit className="text-xs text-[#4ade80] hover:underline">
                          Activar
                        </BotonSubmit>
                      </form>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
        <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">Agregar repartidor</h3>
        <form action={crearRepartidor} className="flex gap-3">
          <input
            name="nombre"
            required
            placeholder="Nombre del repartidor"
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
          <BotonSubmit
            className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Agregar
          </BotonSubmit>
        </form>
      </div>
    </div>
  );
}
