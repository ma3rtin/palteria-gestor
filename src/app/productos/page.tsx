import { auth } from "@/auth";
import { tienePermiso } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { ProductosUI } from "./productos-ui";
import {
  crearProducto,
  actualizarPrecio,
  actualizarCosto,
  actualizarKg,
  actualizarStock,
  toggleProducto,
} from "@/actions/productos";

async function getProductos() {
  return prisma.producto.findMany({ orderBy: { nombre: "asc" } });
}

export default async function ProductosPage() {
  const session = await auth();
  const productos = await getProductos();
  const puedeVerCostos = tienePermiso(session?.user?.rol, "verCostos");
  const puedeEditarCostos = tienePermiso(session?.user?.rol, "editarCostos");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-2">Productos</h1>
      <p className="text-xs text-[#6b7280] mb-6">
        El stock se descuenta al registrar un pedido y se restaura al eliminarlo.
      </p>
      <ProductosUI
        productos={productos}
        puedeVerCostos={puedeVerCostos}
        puedeEditarCostos={puedeEditarCostos}
        crearProducto={crearProducto}
        actualizarPrecio={actualizarPrecio}
        actualizarCosto={actualizarCosto}
        actualizarKg={actualizarKg}
        actualizarStock={actualizarStock}
        toggleProducto={toggleProducto}
      />
    </div>
  );
}
