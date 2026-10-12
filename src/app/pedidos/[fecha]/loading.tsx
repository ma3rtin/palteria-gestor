export default function PedidosFechaLoading() {
  return (
    <div className="p-8 mx-auto animate-pulse">
      {/* Header con navegación de fechas */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-44 bg-[#22252e] rounded-md" />
            <div className="h-5 w-28 bg-[#1c1f26] rounded border border-[#2a2d35]" />
          </div>
          <div className="h-9 w-9 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-[#22252e] rounded-lg" />
      </div>

      {/* Totales del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] px-4 py-3">
            <div className="h-2.5 w-16 bg-[#22252e] rounded mb-1.5" />
            <div className="h-6 w-24 bg-[#2a2d35] rounded mb-1" />
            <div className="h-2.5 w-32 bg-[#22252e] rounded" />
          </div>
        ))}
      </div>

      {/* Resumen interactivo de cajas por repartidor (Chips) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-7 w-28 bg-[#1c1f26] border border-[#2a2d35] rounded-full" />
        ))}
      </div>

      {/* Pestañas de vista superior (Entregas / Palterías / Cobranzas) */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#2a2d35] pb-2">
        <div className="h-8 w-32 bg-[#22252e] rounded-lg" />
        <div className="h-8 w-28 bg-[#1c1f26] rounded-lg border border-[#2a2d35]" />
        <div className="h-8 w-28 bg-[#1c1f26] rounded-lg border border-[#2a2d35]" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="h-9 w-48 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        <div className="h-9 w-36 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        <div className="h-9 w-40 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        <div className="h-9 w-40 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        <div className="h-9 w-32 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
        <div className="h-9 w-36 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
      </div>

      {/* Tabla de entregas */}
      <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
        {/* Cabecera */}
        <div className="px-4 py-3 border-b border-[#2a2d35] flex items-center justify-between bg-[#17191e]/50">
          <div className="h-3.5 w-28 bg-[#22252e] rounded" />
          <div className="h-3.5 w-24 bg-[#22252e] rounded" />
        </div>

        {/* Fila encabezado de columnas */}
        <div className="border-b border-[#2a2d35] px-4 py-3 flex gap-4 bg-[#1c1f26]">
          <div className="w-6" />
          <div className="h-3 w-32 bg-[#22252e] rounded" />
          <div className="h-3 w-20 bg-[#22252e] rounded" />
          <div className="h-3 w-24 bg-[#22252e] rounded" />
          <div className="h-3 w-28 bg-[#22252e] rounded" />
          <div className="h-3 w-16 bg-[#22252e] rounded ml-auto" />
          <div className="h-3 w-20 bg-[#22252e] rounded" />
          <div className="h-3 w-20 bg-[#22252e] rounded" />
        </div>

        {/* Filas */}
        <div className="divide-y divide-[#22252e]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="w-6 h-4 bg-[#22252e] rounded shrink-0" />
              <div className="flex flex-col gap-1 w-44 shrink-0">
                <div className="h-4 w-36 bg-[#22252e] rounded" />
                <div className="h-3 w-24 bg-[#1c1f26] rounded" />
              </div>
              <div className="h-4 w-20 bg-[#22252e] rounded hidden sm:block shrink-0" />
              <div className="h-7 w-28 bg-[#1c1f26] border border-[#2a2d35] rounded hidden md:block shrink-0" />
              <div className="h-7 w-32 bg-[#1c1f26] border border-[#2a2d35] rounded hidden lg:block shrink-0" />
              <div className="h-4 w-20 bg-[#2a2d35] rounded font-mono ml-auto shrink-0" />
              <div className="h-6 w-16 bg-[#22252e] rounded-full shrink-0" />
              <div className="h-6 w-20 bg-[#22252e] rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
