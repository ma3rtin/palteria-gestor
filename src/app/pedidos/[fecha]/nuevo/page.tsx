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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href={`/pedidos/${fecha}`} className="text-xs text-[#9aab9d] hover:text-[#ea580c]">
          ← Volver a {fecha}
        </a>
        <h1 className="text-2xl font-bold text-[#1a2419] mt-1">Nuevo pedido</h1>
        <p className="text-[#5a6b5c] text-sm">{fecha}</p>
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
