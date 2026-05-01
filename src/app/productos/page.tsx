import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatearPeso } from "@/lib/utils";

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
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Productos</h1>
      <p className="text-xs text-[#6b7280] mb-4">
        Los precios de referencia se usan para pre-calcular el monto al crear un pedido. El precio final siempre es editable.
      </p>

      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2d35] text-[#6b7280] text-xs">
              <th className="text-left px-4 py-3 font-medium">Producto</th>
              <th className="text-right px-4 py-3 font-medium">Precio ref. / caja</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className={`border-b border-[#22252e] last:border-0 ${!p.activo ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-[#f9fafb]">{p.nombre}</td>
                <td className="px-4 py-3">
                  <form action={actualizarPrecio} className="flex items-center justify-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="precioReferencia"
                      type="number"
                      step={1000}
                      defaultValue={p.precioReferencia}
                      className="w-32 border border-[#2a2d35] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-[#a3e635]"
                    />
                    <button type="submit" className="text-xs text-[#a3e635] hover:underline">
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleProducto}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="activo" value={p.activo.toString()} />
                    <button type="submit" className="text-xs text-[#6b7280] hover:text-[#9ca3af]">
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
