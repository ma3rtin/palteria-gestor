/**
 * Resetea los datos transaccionales de la base de datos (pedidos, pagos, liquidaciones)
 * y pone el stock de todos los productos en 0.
 * Deja intactos los catálogos de clientes, repartidores, revendedores, zonas, productos y usuarios.
 * 
 * Uso: npx tsx prisma/clear-transactions.ts --confirmar
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Carga de la conexión
const connectionString = (process.env.DATABASE_URL ?? "").replace(/\\\$/g, "$");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

const args = process.argv.slice(2);
const verificado = args.includes("--confirmar");

async function main() {
  if (!verificado) {
    console.log("======================================================================");
    console.log("⚠️ ADVERTENCIA: SE ELIMINARÁN TODOS LOS DATOS TRANSACCIONALES DE PRUEBA");
    console.log("======================================================================");
    console.log("Este script realizará las siguientes operaciones:");
    console.log("1. Eliminará todos los pagos registrados (pagos_locales).");
    console.log("2. Eliminará todos los períodos semanales de cuentas corrientes.");
    console.log("3. Eliminará todos los pedidos (pedidos de entrega, cobranzas, cambios, etc.).");
    console.log("4. Eliminará todas las liquidaciones e historial de revendedores.");
    console.log("5. Reseteará el stock de cajas de TODOS los productos a 0.");
    console.log("\nPermanecerán intactos:");
    console.log("- Clientes (su padrón completo de locales)");
    console.log("- Zonas");
    console.log("- Repartidores");
    console.log("- Revendedores");
    console.log("- Cuentas Corrientes (las agrupaciones)");
    console.log("- Productos (las variedades/lotes)");
    console.log("- Usuarios");
    console.log("\nPara confirmar la ejecución, corre el comando agregando la opción '--confirmar':");
    console.log("👉 npx tsx prisma/clear-transactions.ts --confirmar");
    console.log("======================================================================");
    process.exit(0);
  }

  console.log("Iniciando reseteo de datos transaccionales...");

  // Eliminación secuencial por restricciones de integridad referencial
  console.log("- Borrando pagos locales...");
  const pagos = await prisma.pagoLocal.deleteMany();
  console.log(`  ✓ Se eliminaron ${pagos.count} pagos locales.`);

  console.log("- Borrando períodos semanales...");
  const periodos = await prisma.periodoSemanal.deleteMany();
  console.log(`  ✓ Se eliminaron ${periodos.count} períodos semanales.`);

  console.log("- Borrando pedidos y cobros...");
  const pedidos = await prisma.pedido.deleteMany();
  console.log(`  ✓ Se eliminaron ${pedidos.count} pedidos/cobros.`);

  console.log("- Borrando liquidaciones de revendedor...");
  const liquidaciones = await prisma.liquidacionRevendedor.deleteMany();
  console.log(`  ✓ Se eliminaron ${liquidaciones.count} liquidaciones.`);

  console.log("- Reseteando stock de cajas de productos a 0...");
  const productos = await prisma.producto.updateMany({
    data: {
      stockCajas: 0,
    },
  });
  console.log(`  ✓ Se actualizó el stock de ${productos.count} productos a 0 cajas.`);

  console.log("\n=======================================================");
  console.log("✅ RESETEO COMPLETADO CON ÉXITO.");
  console.log("La base de datos está lista para empezar a operar de 0.");
  console.log("=======================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
