/**
 * Resetea y elimina todos los revendedores de la base de datos, 
 * limpiando la relación (idRevendedor = null) en todos los clientes.
 * 
 * Uso: npx tsx prisma/reset-revendedores.ts
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

async function main() {
  console.log("=======================================================");
  console.log("Iniciando reseteo y eliminación de revendedores...");
  console.log("=======================================================");

  // 1. Quitar la relación en los clientes
  console.log("- Desvinculando revendedores de los clientes (idRevendedor = null)...");
  const clientesActualizados = await prisma.cliente.updateMany({
    where: { idRevendedor: { not: null } },
    data: { idRevendedor: null },
  });
  console.log(`  ✓ Se desvincularon ${clientesActualizados.count} clientes.`);

  // 2. Eliminar liquidaciones de revendedor (por restricción de clave foránea)
  console.log("- Eliminando historial de liquidaciones de revendedor...");
  const liquidaciones = await prisma.liquidacionRevendedor.deleteMany();
  console.log(`  ✓ Se eliminaron ${liquidaciones.count} liquidaciones.`);

  // 3. Eliminar todos los revendedores
  console.log("- Eliminando todos los revendedores...");
  const revendedores = await prisma.revendedor.deleteMany();
  console.log(`  ✓ Se eliminaron ${revendedores.count} revendedores.`);

  console.log("\n=======================================================");
  console.log("✅ RESETEO DE REVENDEDORES COMPLETADO CON ÉXITO.");
  console.log("=======================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
