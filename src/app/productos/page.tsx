import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BotonSubmit } from "@/components/boton-submit";
import { FiltroProductos } from "./filtro-productos";

async function getProductos() {
  return prisma.producto.findMany({ orderBy: { nombre: "asc" } });
}

async function actualizarPrecio(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const precio = parseFloat(formData.get("precioReferencia") as string);
  await prisma.producto.update({ where: { id }, data: { precioReferencia: precio } });
  revalidatePath("/productos");
}

async function toggleProducto(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await prisma.producto.update({ where: { id }, data: { activo: !activo } });
  revalidatePath("/productos");
}

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Productos</h1>
      <p className="text-xs text-[#6b7280] mb-4">
        Los precios de referencia se usan para pre-calcular el monto al crear un pedido. El precio final siempre es editable.
      </p>

      <FiltroProductos
        productos={productos}
        actualizarPrecio={actualizarPrecio}
        toggleProducto={toggleProducto}
      />

      <div className="mt-6 bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-5">
        <h3 className="text-sm font-semibold text-[#f9fafb] mb-3">Agregar producto</h3>
        <form
          action={async (formData) => {
            "use server";
            const nombre = (formData.get("nombre") as string).trim().toUpperCase();
            const precio = parseFloat(formData.get("precioReferencia") as string);
            await prisma.producto.create({ data: { nombre, precioReferencia: precio } });
            revalidatePath("/productos");
          }}
          className="flex gap-3"
        >
          <input
            name="nombre"
            required
            placeholder="Nombre del producto"
            className="flex-1 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
          <input
            name="precioReferencia"
            type="number"
            required
            step={1000}
            placeholder="Precio/caja"
            className="w-36 border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
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
