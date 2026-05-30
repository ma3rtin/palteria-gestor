# Plan: Resolver Agotamiento Pool Supabase (EMAXCONNSESSION)

## Context

**Problem:** Error `(EMAXCONNSESSION) max clients reached in session mode` ocurre cuando múltiples usuarios o búsquedas rápidas saturan el pool de 15 conexiones de Supabase.

**Root Cause:** 
- Pool size limitado a 15 en Vercel Free + Supabase
- Muchos requests HTTP simultáneos cada uno esperando conexión de BD
- Particularmente en `/clientes` al hacer búsquedas rápidas (6 requests en 700ms)

**Solution Strategy:** 
1. **Solución 1 (Corto Plazo):** Error boundary + retry automático con exponential backoff
2. **Solución 2 (Arquitectura):** Pagination en lista de clientes (cargar 20 a la vez en lugar de todos)

**Expected Outcome:**
- Error no será visible al usuario (retry automático)
- Pool se agotará menos frecuentemente (menos datos por request)
- UX mejora dramáticamente (parece estable)

---

## Solución 1: Error Boundary + Retry Automático (30-45 min)

### 1.1 Crear Retry Utility Function

**File:** `src/lib/retry.ts` (CREAR NUEVO)

```typescript
export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 5000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // No reintentar si es el último intento
      if (attempt === maxAttempts - 1) {
        throw error;
      }

      // Exponential backoff: 1000ms, 2000ms, 4000ms (máx 5000ms)
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );
      
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Unknown error");
}

export function isPoolExhaustedError(error: unknown): boolean {
  const msg = String(error);
  return (
    msg.includes("EMAXCONNSESSION") ||
    msg.includes("max clients reached") ||
    msg.includes("pool_size")
  );
}
```

**Reuses:** Extensión de patterns existentes (similar a .catch() en pagos-semanales/[id]/page.tsx)

---

### 1.2 Crear Error Boundary Global

**File:** `src/app/error.tsx` (CREAR NUEVO)

```typescript
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary:", error);
  }, [error]);

  const isPoolError = error.message?.includes("EMAXCONNSESSION");
  
  return (
    <div className="p-8 text-center">
      <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-8">
        <h1 className="text-xl font-bold text-[#f9fafb] mb-4">
          {isPoolError ? "Conexión temporal" : "Error"}
        </h1>
        <p className="text-[#9ca3af] mb-6">
          {isPoolError
            ? "La base de datos está bajo carga. Reintentando..."
            : error.message || "Algo salió mal. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
```

---

### 1.3 Modificar `/clientes/page.tsx` para Retry

**File:** `src/app/clientes/page.tsx`

**Changes:**
- Envolver `getClientesConSaldo` y `getCatalogoFormulario` en `retryWithExponentialBackoff`
- Mostrar estado "cargando" mientras se reintenta
- Sin cambiar la estructura de datos, solo agregar retry

```typescript
import { retryWithExponentialBackoff } from "@/lib/retry";

export default async function ClientesPage({ searchParams }: Props) {
  const { q, zona, repartidor, inactivos } = await searchParams;

  // Wrapped with retry
  const clientesTodos = await retryWithExponentialBackoff(
    () => getClientesConSaldo(
      zona ? Number(zona) : undefined,
      repartidor ? Number(repartidor) : undefined,
      !!inactivos
    ),
    { maxAttempts: 3, baseDelayMs: 1000 }
  );

  const catalogo = await retryWithExponentialBackoff(
    () => getCatalogoFormulario(),
    { maxAttempts: 3, baseDelayMs: 800 }
  );

  // ... resto del componente igual
}
```

---

## Solución 2: Pagination en Clientes (1-1.5 horas)

### 2.1 Crear Nueva Función Paginada

**File:** `src/actions/clientes.ts` (MODIFICAR EXISTENTE)

**Add new function after `getClientesConSaldo`:**

```typescript
export interface ClientesPagedResponse {
  clientes: Array<typeof clientesTodos[number]>; // Same type as getClientesConSaldo
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export async function getClientesConSaldoPaginado(
  page: number = 0,
  pageSize: number = 20,
  idZona?: number,
  idRepartidor?: number,
  incluirInactivos: boolean = false
): Promise<ClientesPagedResponse> {
  const skip = page * pageSize;

  // Query 1: Get paginated clients
  const clientes = await prisma.cliente.findMany({
    where: {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(idZona ? { idZona } : {}),
      ...(idRepartidor ? { idRepartidor } : {}),
    },
    include: { zona: true, repartidor: true },
    orderBy: { nombre: "asc" },
    skip,
    take: pageSize,
  });

  // Query 2: Get balance for these clients (NOT all clients)
  const saldos = await prisma.pedido.groupBy({
    by: ["idCliente"],
    where: {
      idCliente: { in: clientes.map((c) => c.id) },
      estadoPago: { not: "PAGADO" },
      esCobro: false,
    },
    _sum: { montoTotal: true, montoPagado: true },
  });

  const mapaDeuda = new Map(
    saldos.map((s) => [
      s.idCliente,
      (s._sum.montoTotal ?? 0) - (s._sum.montoPagado ?? 0),
    ])
  );

  // Query 3: Get total count (cached per filter combo)
  const total = await prisma.cliente.count({
    where: {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(idZona ? { idZona } : {}),
      ...(idRepartidor ? { idRepartidor } : {}),
    },
  });

  const clientesConSaldo = clientes.map((c) => ({
    ...c,
    saldoPendiente: mapaDeuda.get(c.id) ?? 0,
  }));

  return {
    clientes: clientesConSaldo,
    total,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}
```

**Key differences from `getClientesConSaldo`:**
- Acepta `page` y `pageSize` parámetros
- `skip` = page * pageSize
- Query de saldos SOLO para clientes en esta página (no todos)
- Retorna `total`, `hasMore`, `page` metadata

---

### 2.2 Crear Componente Paginado (Client-side)

**File:** `src/app/clientes/clientes-list-paginated.tsx` (CREAR NUEVO)

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatearPeso } from "@/lib/utils";

interface ClientesListPaginatedProps {
  initialData: {
    clientes: any[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
  filters: {
    q?: string;
    zona?: string;
    repartidor?: string;
    inactivos?: string;
  };
}

export function ClientesListPaginated({
  initialData,
  filters,
}: ClientesListPaginatedProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const handlePageChange = async (newPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(newPage),
        pageSize: String(data.pageSize),
        ...(filters.q && { q: filters.q }),
        ...(filters.zona && { zona: filters.zona }),
        ...(filters.repartidor && { repartidor: filters.repartidor }),
        ...(filters.inactivos && { inactivos: filters.inactivos }),
      });

      const response = await fetch(`/api/clientes/paginated?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error("Error loading page:", error);
      // Show toast/notification
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div>
      {/* Cliente list */}
      <div className="space-y-2 mb-6">
        {data.clientes.map((cliente: any) => (
          <Link
            key={cliente.id}
            href={`/clientes/${cliente.id}`}
            className="block bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4 hover:border-[#a3e635] transition-colors"
          >
            <div className="flex justify-between">
              <span className="text-[#f9fafb] font-medium">{cliente.nombre}</span>
              <span className="text-[#9ca3af] text-sm">{cliente.zona.nombre}</span>
            </div>
            {cliente.saldoPendiente > 0 && (
              <p className="text-[#ef4444] text-sm mt-1">
                Deuda: {formatearPeso(cliente.saldoPendiente)}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <span className="text-[#9ca3af] text-sm">
          Página {data.page + 1} de {totalPages} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(data.page - 1)}
            disabled={data.page === 0 || loading}
            className="px-3 py-1 border border-[#2a2d35] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635]"
          >
            ← Anterior
          </button>
          <button
            onClick={() => handlePageChange(data.page + 1)}
            disabled={!data.hasMore || loading}
            className="px-3 py-1 border border-[#2a2d35] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#a3e635]"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center text-[#9ca3af] text-sm mt-4">
          Cargando...
        </div>
      )}
    </div>
  );
}
```

---

### 2.3 Crear API Route para Paginación

**File:** `src/app/api/clientes/paginated/route.ts` (CREAR NUEVO)

```typescript
import { getClientesConSaldoPaginado } from "@/actions/clientes";
import { retryWithExponentialBackoff } from "@/lib/retry";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? 0);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);
    const zona = searchParams.get("zona");
    const repartidor = searchParams.get("repartidor");

    const data = await retryWithExponentialBackoff(
      () =>
        getClientesConSaldoPaginado(
          page,
          pageSize,
          zona ? Number(zona) : undefined,
          repartidor ? Number(repartidor) : undefined,
          false
        ),
      { maxAttempts: 3 }
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
```

---

### 2.4 Modificar `/clientes/page.tsx` para Usar Componente Paginado

**File:** `src/app/clientes/page.tsx` (MODIFICAR)

```typescript
import { getClientesConSaldoPaginado, getCatalogoFormulario } from "@/actions/clientes";
import { ClientesListPaginated } from "./clientes-list-paginated";
import { FiltrosClientes } from "./buscador";
import { retryWithExponentialBackoff } from "@/lib/retry";

export default async function ClientesPage({ searchParams }: Props) {
  const { q, zona, repartidor, inactivos, page = "0" } = await searchParams;

  // Fetch initial page with retry
  const initialData = await retryWithExponentialBackoff(
    () =>
      getClientesConSaldoPaginado(
        Number(page),
        20,
        zona ? Number(zona) : undefined,
        repartidor ? Number(repartidor) : undefined,
        !!inactivos
      ),
    { maxAttempts: 3 }
  );

  const catalogo = await retryWithExponentialBackoff(
    () => getCatalogoFormulario(),
    { maxAttempts: 3 }
  );

  // Filter results if search query provided (client-side filtering)
  const filtered = q
    ? initialData.clientes.filter((c) =>
        c.nombre.toLowerCase().includes(q.toLowerCase()) ||
        c.zona.nombre.toLowerCase().includes(q.toLowerCase())
      )
    : initialData.clientes;

  return (
    <div className="p-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f9fafb]">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <FiltrosClientes
        zonas={catalogo.zonas}
        repartidores={catalogo.repartidores}
        q={q}
        zona={zona}
        repartidor={repartidor}
      />

      <ClientesListPaginated
        initialData={{
          clientes: filtered,
          total: initialData.total,
          page: Number(page),
          pageSize: 20,
          hasMore: initialData.hasMore,
        }}
        filters={{ q, zona, repartidor, inactivos }}
      />
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Setup (5 min)
- [ ] Create `/src/lib/retry.ts` with retry utility
- [ ] Test retry logic locally

### Phase 2: Error Boundary (10 min)
- [ ] Create `/src/app/error.tsx`
- [ ] Modify `/src/app/clientes/page.tsx` to use retry wrapper
- [ ] Test error boundary with manual error throw

### Phase 3: Pagination (40 min)
- [ ] Add `getClientesConSaldoPaginado` to `/src/actions/clientes.ts`
- [ ] Create `/src/app/clientes/clientes-list-paginated.tsx` component
- [ ] Create `/src/app/api/clientes/paginated/route.ts`
- [ ] Modify `/src/app/clientes/page.tsx` to use new component
- [ ] Test pagination: navigate pages, verify data loads

### Phase 4: Testing (15 min)
- [ ] Simulate pool exhaustion: rapidly navigate /clientes (10+ requests)
- [ ] Verify retry logic kicks in (console.log or network tab)
- [ ] Verify error boundary doesn't show scary error
- [ ] Verify pagination doesn't increase load (20 clients per page)
- [ ] Test filters work with pagination

### Phase 5: Deploy (5 min)
- [ ] `git add -A && git commit -m "feat: add error boundary, retry logic, and pagination to clientes"`
- [ ] `git push`
- [ ] Monitor Vercel logs for EMAXCONNSESSION errors

---

## Key Design Decisions

1. **Retry in Server Actions, not just client:** Reduces pool churn by retrying early before response is sent
2. **Error boundary for visual stability:** Pool errors won't break layout, just show "reintenting..."
3. **Pagination on server-side:** Load 20 clients per page → fewer rows per query, less BD work
4. **Client-side filter fallback:** Search `q` param filtered in React (data already on client) to avoid extra DB queries
5. **API route for pagination:** Allows dynamic page changes without full page reload, better UX

---

## Rollback Plan

If errors occur during implementation:

1. **Revert commits:** `git revert <commit-hash>`
2. **Comment out retry wrapper:** Remove retryWithExponentialBackoff calls, just keep original async
3. **Keep pagination as optional:** If pagination breaks, remove `/api/clientes/paginated` route and revert `page.tsx` to old version
4. **Error boundary won't break:** Safe to leave even if other features rollback

---

## Files to Create
1. `/src/lib/retry.ts` - Retry utility
2. `/src/app/error.tsx` - Error boundary
3. `/src/app/clientes/clientes-list-paginated.tsx` - Pagination component
4. `/src/app/api/clientes/paginated/route.ts` - API endpoint

## Files to Modify
1. `/src/actions/clientes.ts` - Add `getClientesConSaldoPaginado` function
2. `/src/app/clientes/page.tsx` - Add retry wrapper + use new component

---

## Validation Checklist

- [ ] No Promise.all() introduced (maintains sequential queries)
- [ ] Retry limits to 3 attempts max (prevents infinite loops)
- [ ] Page size 20 is reasonable for typical client counts
- [ ] Error boundary message is user-friendly
- [ ] Pagination buttons disabled during load
- [ ] API route has error handling
- [ ] All TypeScript types correct (no `any` unless necessary)
