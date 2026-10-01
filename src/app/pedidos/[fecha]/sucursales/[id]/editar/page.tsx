import { getEnvioSucursal, getSucursales, actualizarEnvioSucursal } from "@/actions/sucursales";
import { getRepartidores } from "@/actions/repartidores";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { MADURACIONES_SUGERIDAS } from "@/lib/utils";
import { FormEditarEnvioSucursal } from "./form";

interface Props {
  params: Promise<{ fecha: string; id: string }>;
}

export default async function EditarEnvioSucursalPage({ params }: Props) {
  const { fecha, id } = await params;
  const idEnvio = Number(id);

  const [envio, sucursales, repartidores, productos] = await Promise.all([
    getEnvioSucursal(idEnvio),
    getSucursales(),
    getRepartidores(),
    prisma.producto.findMany({
      where: {
        OR: [
          { activo: true },
          { itemsEnvioSucursal: { some: { idEnvio } } },
        ],
      },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <a
          href={`/pedidos/${fecha}?vista=palterias`}
          className="text-xs text-[#6b7280] hover:text-[#a3e635] flex items-center gap-1"
        >
          <ChevronLeft size={14} />
          Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Editar envío a sucursal</h1>
        <div className="text-[#9ca3af] text-sm flex items-center gap-2 flex-wrap mt-0.5">
          <span className="font-medium text-[#f9fafb]">{envio.sucursal.nombre}</span>
          <span>·</span>
          <span>{fecha}</span>
          {envio.usuario?.nombre && (
            <span>
              · Cargado por{" "}
              <strong className="text-[#f9fafb] font-medium">
                {envio.usuario.nombre.trim().split(" ")[0]}
              </strong>
            </span>
          )}
        </div>
      </div>

      <FormEditarEnvioSucursal
        fecha={fecha}
        idEnvio={idEnvio}
        envio={envio}
        sucursales={sucursales}
        productos={productos}
        repartidores={repartidores}
        maduracionesSugeridas={MADURACIONES_SUGERIDAS}
        actualizarEnvioSucursal={actualizarEnvioSucursal.bind(null, idEnvio)}
      />
    </div>
  );
}
