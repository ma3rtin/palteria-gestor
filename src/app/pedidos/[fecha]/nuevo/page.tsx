import { getCatalogoNuevoPedido, crearPedido } from "@/actions/pedidos";
import { MADURACIONES_SUGERIDAS } from "@/lib/utils";
import { FormNuevoPedido } from "./form";

interface Props {
  params: Promise<{ fecha: string }>;
}

export default async function NuevoPedidoPage({ params }: Props) {
  const { fecha } = await params;
  const { clientes, productos, repartidores } = await getCatalogoNuevoPedido();

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href={`/pedidos/${fecha}`} className="text-xs text-[#6b7280] hover:text-[#a3e635]">
          ← Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#f9fafb] mt-1">Nuevo pedido</h1>
        <p className="text-[#9ca3af] text-sm">{fecha}</p>
      </div>

      <FormNuevoPedido
        fecha={fecha}
        clientes={clientes}
        productos={productos}
        repartidores={repartidores}
        maduracionesSugeridas={MADURACIONES_SUGERIDAS}
        crearPedido={crearPedido}
      />
    </div>
  );
}
