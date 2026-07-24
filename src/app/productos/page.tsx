import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ProductosUI } from "./productos-ui";

async function getProductos() {
  return prisma.producto.findMany({ orderBy: { nombre: "asc" } });
}

async function crearProducto(formData: FormData) {
  "use server";
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const precio = parseFloat(formData.get("precioReferencia") as string);
  const kg = parseFloat(formData.get("kgPorCaja") as string);
  const stock = parseFloat(formData.get("stockCajas") as string);
  const costo = parseFloat(formData.get("costo") as string);
  await prisma.producto.create({
    data: {
      nombre,
      precioReferencia: precio,
      kgPorCaja: isNaN(kg) ? null : kg,
      stockCajas: isNaN(stock) ? 0 : stock,
      costo: isNaN(costo) ? 0 : costo,
    },
  });
  revalidatePath("/productos");
}

async function actualizarPrecio(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const precio = parseFloat(formData.get("precioReferencia") as string);
  await prisma.producto.update({ where: { id }, data: { precioReferencia: precio } });
  revalidatePath("/productos");
}

async function actualizarCosto(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const costo = parseFloat(formData.get("costo") as string);
  await prisma.producto.update({ where: { id }, data: { costo: isNaN(costo) ? 0 : costo } });
  revalidatePath("/productos");
}

async function actualizarKg(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const kg = parseFloat(formData.get("kgPorCaja") as string);
  await prisma.producto.update({ where: { id }, data: { kgPorCaja: isNaN(kg) ? null : kg } });
  revalidatePath("/productos");
}

async function actualizarStock(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const stock = parseFloat(formData.get("stockCajas") as string);
  await prisma.producto.update({ where: { id }, data: { stockCajas: isNaN(stock) ? 0 : stock } });
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
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-2">Productos</h1>
      <p className="text-xs text-[#6b7280] mb-6">
        El stock se descuenta al registrar un pedido y se restaura al eliminarlo.
      </p>
      <ProductosUI
        productos={productos}
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
