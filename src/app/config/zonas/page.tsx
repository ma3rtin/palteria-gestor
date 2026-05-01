import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function crearZona(formData: FormData) {
  "use server";
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.zona.create({ data: { nombre } });
  revalidatePath("/config/zonas");
}

async function renombrarZona(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  if (!nombre) return;
  await prisma.zona.update({ where: { id }, data: { nombre } });
  revalidatePath("/config/zonas");
}

export default async function ConfigZonasPage() {
  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { clientes: true } } },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/config/repartidores" className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Configuración
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Zonas</h1>
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-right px-4 py-3 font-medium">Clientes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {zonas.map((z) => (
              <tr key={z.id} className="border-b border-[#22252e] last:border-0">
                <td className="px-4 py-2">
                  <form action={renombrarZona} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={z.id} />
                    <input
                      name="nombre"
                      defaultValue={z.nombre}
                      className="border border-[#2a2d35] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#a3e635] w-48"
                    />
                    <button type="submit" className="text-xs text-[#a3e635] hover:underline whitespace-nowrap">
                      Renombrar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2 text-right text-[#6b7280]">{z._count.clientes}</td>
                <td className="px-4 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
        <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">Agregar zona</h3>
        <form action={crearZona} className="flex gap-3">
          <input
            name="nombre"
            required
            placeholder="Nombre de la zona"
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
          <button
            type="submit"
            className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Agregar
          </button>
        </form>
      </div>
    </div>
  );
}
