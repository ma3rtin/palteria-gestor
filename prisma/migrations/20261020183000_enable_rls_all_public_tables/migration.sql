-- Habilitar Row-Level Security (RLS) en todas las tablas del esquema public
-- para bloquear el acceso público desde PostgREST (anon / authenticated) de Supabase.
-- El rol `postgres` utilizado por Prisma en el servidor posee `BYPASSRLS`, por lo que
-- la aplicación continúa operando de forma transparente sin requerir políticas públicas.

ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."zonas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."revendedores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."liquidaciones_revendedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."repartidores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cuentas_corrientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."periodos_semanales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pagos_locales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."items_pedido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sucursales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."envios_sucursales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."items_envio_sucursal" ENABLE ROW LEVEL SECURITY;

-- Asegurar que _prisma_migrations y cualquier otra tabla en public también tengan RLS activo
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('ALTER TABLE "public".%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
