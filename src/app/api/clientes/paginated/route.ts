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
    const tab = searchParams.get("tab") ?? "activos";
    const volumen = searchParams.get("volumen") ?? undefined;

    const q = searchParams.get("q") ?? undefined;

    const data = await retryWithExponentialBackoff(
      () =>
        getClientesConSaldoPaginado(
          page,
          pageSize,
          zona ? Number(zona) : undefined,
          repartidor ? Number(repartidor) : undefined,
          q,
          tab,
          volumen
        ),
      { maxAttempts: 3, baseDelayMs: 1000 }
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
