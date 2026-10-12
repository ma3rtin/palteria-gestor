export default function ReportesLoading() {
  return (
    <div className="p-8 mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-36 bg-[#22252e] rounded-md mb-2" />
        <div className="h-4 w-44 bg-[#1c1f26] rounded" />
      </div>

      {/* Selector de período */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-[#1c1f26] border border-[#2a2d35] rounded-md" />
        ))}
        <div className="w-px h-5 bg-[#2a2d35] mx-1" />
        <div className="h-8 w-32 bg-[#1c1f26] border border-[#2a2d35] rounded-md" />
        <div className="w-3 h-3 bg-[#22252e] rounded" />
        <div className="h-8 w-32 bg-[#1c1f26] border border-[#2a2d35] rounded-md" />
        <div className="h-8 w-20 bg-[#22252e] rounded-md" />
      </div>

      {/* Subtítulo período */}
      <div className="h-3 w-40 bg-[#22252e] rounded mb-3" />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4">
            <div className="h-2.5 w-16 bg-[#22252e] rounded mb-2" />
            <div className="h-6 w-24 bg-[#2a2d35] rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top productos */}
        <div>
          <div className="h-3 w-28 bg-[#22252e] rounded mb-3" />
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#22252e] rounded" />
                  <div className="h-4 w-32 bg-[#22252e] rounded" />
                </div>
                <div className="h-4 w-20 bg-[#2a2d35] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Por repartidor */}
        <div>
          <div className="h-3 w-32 bg-[#22252e] rounded mb-3" />
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="h-4 w-24 bg-[#22252e] rounded" />
                  <div className="h-4 w-16 bg-[#2a2d35] rounded" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 w-16 bg-[#22252e] rounded" />
                  <div className="h-3 w-20 bg-[#22252e] rounded" />
                  <div className="h-3 w-20 bg-[#22252e] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por forma de pago */}
        <div>
          <div className="h-3 w-36 bg-[#22252e] rounded mb-3" />
          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] divide-y divide-[#22252e]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="h-4 w-28 bg-[#22252e] rounded" />
                <div className="h-4 w-24 bg-[#2a2d35] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
