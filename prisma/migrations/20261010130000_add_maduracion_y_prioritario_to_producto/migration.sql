-- AlterTable
ALTER TABLE "productos" ADD COLUMN "maduracion" TEXT;
ALTER TABLE "productos" ADD COLUMN "prioritario" BOOLEAN NOT NULL DEFAULT false;
