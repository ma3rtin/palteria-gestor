import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/config/zonas" className="text-xs text-[#9aab9d] hover:text-[#ea580c]">
          ← Configuración
        </a>
        <h1 className="text-2xl font-bold text-[#1a2419] mt-1">Repartidores</h1>
      </div>

      <div className="bg-white rounded-lg border border-[#dde6de] overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#dde6de] text-[#9aab9d] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium">Pedidos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {activos.map((r) => (
              <tr key={r.id} className="border-b border-[#f2f5f2] last:border-0">
                <td className="px-4 py-2">
                  <form action={renombrarRepartidor} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="nombre"
                      defaultValue={r.nombre}
                      className="border border-[#dde6de] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#16a34a] w-40"
                    />
                    <button type="submit" className="text-xs text-[#ea580c] hover:underline whitespace-nowrap">
                      Renombrar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right text-[#9aab9d]">{r._count.pedidos}</td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleActivo}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="activo" value="true" />
                    <button type="submit" className="text-xs text-[#9aab9d] hover:text-red-500">
                      Desactivar
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {inactivos.length > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-xs text-[#9aab9d] bg-[#f7faf7] font-medium">
                    Inactivos
                  </td>
                </tr>
                {inactivos.map((r) => (
                  <tr key={r.id} className="border-b border-[#f2f5f2] last:border-0 opacity-50">
                    <td className="px-4 py-2 text-[#5a6b5c]">{r.nombre}</td>
                    <td className="px-4 py-2 text-right text-[#9aab9d]">{r._count.pedidos}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={toggleActivo}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="activo" value="false" />
                        <button type="submit" className="text-xs text-[#16a34a] hover:underline">
                          Activar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-[#dde6de] p-5">
        <h3 className="text-sm font-semibold text-[#1a2419] mb-3">Agregar repartidor</h3>
        <form action={crearRepartidor} className="flex gap-3">
          <input
            name="nombre"
            required
            placeholder="Nombre del repartidor"
            className="flex-1 border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a]"
          />
          <button
            type="submit"
            className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
