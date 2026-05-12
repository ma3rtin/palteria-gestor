/**
 * Crea o actualiza un usuario en la base de datos.
 * Uso: npx tsx prisma/crear-usuario.ts email@ejemplo.com "Nombre Apellido" contraseña
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

const [, , email, nombre, password] = process.argv;

if (!email || !nombre || !password) {
  console.error("Uso: npx tsx prisma/crear-usuario.ts email nombre contraseña");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { nombre, passwordHash: hash, activo: true },
    create: { email, nombre, passwordHash: hash },
  });
  console.log(`✓ Usuario "${usuario.nombre}" (${usuario.email}) listo.`);
  console.log(`  Que cambie la contraseña en su primer ingreso.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
