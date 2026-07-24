import { prisma } from "@/lib/prisma";
import { ZonasConfigUI } from "./zonas-ui";

export default async function ConfigZonasPage() {
  const zonas = await prisma.zona.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { clientes: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Zonas</h1>
      </div>

      <ZonasConfigUI initialZonas={zonas} />
    </div>
  );
}
