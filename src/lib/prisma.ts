import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // DB_PASSWORD override: evita que dotenv-expand mangle caracteres especiales en la URL
    password: process.env.DB_PASSWORD || undefined,
    max: 10, // Máximo de conexiones simultáneas por instancia
    idleTimeoutMillis: 30000, // Cierra conexiones inactivas después de 30s
    connectionTimeoutMillis: 2000, // Falla rápido si no puede conectar
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as never);
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
