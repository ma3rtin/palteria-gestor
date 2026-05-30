import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // DB_PASSWORD override: evita que dotenv-expand mangle caracteres especiales en la URL
    password: process.env.DB_PASSWORD || undefined,
    max: 5, // Aumentado ligeramente ya que el usuario subió el límite a 30
    idleTimeoutMillis: 10000, // Cierra conexiones inactivas más rápido (10s) para liberar el pool en Serverless
    connectionTimeoutMillis: 5000, // Un poco más de margen para conectar si el pool está bajo carga
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as never);
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
