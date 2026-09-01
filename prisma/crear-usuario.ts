/**
 * Crea o actualiza un usuario en la base de datos.
 * Uso: npx tsx prisma/crear-usuario.ts email@ejemplo.com "Nombre Apellido" contraseña
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

import { RolUsuario } from "../src/generated/prisma/enums";

// dotenv carga \$ literal; Next.js usa dotenv-expand que lo convierte a $. Lo hacemos acá manualmente.
const connectionString = (process.env.DATABASE_URL ?? "").replace(/\\\$/g, "$");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

const [, , email, nombre, password, rolArg] = process.argv;

if (!email || !nombre || !password) {
  console.error("Uso: npx tsx prisma/crear-usuario.ts email \"Nombre Apellido\" contraseña [ADMIN|EMPLEADO]");
  process.exit(1);
}

const rolNormalizado = rolArg ? (rolArg.toUpperCase() as RolUsuario) : RolUsuario.ADMIN;
if (!Object.values(RolUsuario).includes(rolNormalizado)) {
  console.error(`Error: Rol inválido "${rolArg}". Roles permitidos: ${Object.values(RolUsuario).join(", ")}`);
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { nombre, passwordHash: hash, rol: rolNormalizado, activo: true },
    create: { email, nombre, passwordHash: hash, rol: rolNormalizado },
  });
  console.log(`✓ Usuario "${usuario.nombre}" (${usuario.email}) listo con rol [${usuario.rol}].`);
  console.log(`  Que cambie la contraseña en su primer ingreso.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
