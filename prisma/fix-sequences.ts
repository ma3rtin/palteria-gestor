import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const tablas = ["pedidos", "clientes", "zonas", "repartidores", "productos", "cuentas_corrientes", "periodos_semanales"];
  const columnas: Record<string, string> = {
    pedidos: "id_pedido",
    clientes: "id_cliente",
    zonas: "id_zona",
    repartidores: "id_repartidor",
    productos: "id_producto",
    cuentas_corrientes: "id_cuenta",
    periodos_semanales: "id_periodo",
  };

  for (const tabla of tablas) {
    const col = columnas[tabla];
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${tabla}"', '${col}'),
        COALESCE((SELECT MAX("${col}") FROM "${tabla}"), 0) + 1,
        false
      )
    `);
    console.log(`✓ ${tabla}.${col} sequence reset`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
