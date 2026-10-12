export default function DashboardLoading() {
  return (
    <div className="p-8 mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-48 bg-[#22252e] rounded-md mb-2" />
          <div className="h-4 w-36 bg-[#1c1f26] rounded" />
        </div>
        <div className="h-9 w-32 bg-[#22252e] rounded-lg" />
      </div>

      {/* Stats del día */}
      <div className="h-3 w-10 bg-[#22252e] rounded mb-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-4">
            <div className="h-2.5 w-16 bg-[#22252e] rounded mb-2" />
            <div className="h-6 w-24 bg-[#2a2d35] rounded mb-1.5" />
            <div className="h-3 w-28 bg-[#22252e] rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos del día */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-28 bg-[#22252e] rounded" />
            <div className="h-3 w-16 bg-[#22252e] rounded" />
          </div>

          <div className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] overflow-hidden">
            <div className="border-b border-[#2a2d35] p-3 flex gap-4">
              <div className="h-3 w-24 bg-[#22252e] rounded" />
              <div className="h-3 w-20 bg-[#22252e] rounded" />
              <div className="h-3 w-20 bg-[#22252e] rounded" />
              <div className="h-3 w-12 bg-[#22252e] rounded ml-auto" />
            </div>
            <div className="divide-y divide-[#22252e]">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 w-40">
                    <div className="h-4 w-32 bg-[#22252e] rounded" />
                    <div className="h-3 w-20 bg-[#1c1f26] rounded" />
                  </div>
                  <div className="h-4 w-24 bg-[#22252e] rounded hidden sm:block" />
                  <div className="h-4 w-20 bg-[#22252e] rounded hidden md:block" />
                  <div className="h-4 w-12 bg-[#22252e] rounded" />
                  <div className="h-4 w-16 bg-[#2a2d35] rounded font-mono" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesos rápidos y Repartidores */}
        <div>
          <div className="h-3 w-24 bg-[#22252e] rounded mb-3" />
          <div className="flex flex-col gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-[#1c1f26] border border-[#2a2d35] rounded-lg" />
            ))}
          </div>

          <div className="h-3 w-32 bg-[#22252e] rounded mb-3" />
          <div className="bg-[#1c1f26] border border-[#2a2d35] rounded-lg p-4">
            <div className="flex gap-2 mb-4 pb-2 border-b border-[#2a2d35]">
              <div className="h-6 w-24 bg-[#22252e] rounded" />
              <div className="h-6 w-16 bg-[#22252e] rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="h-4 w-24 bg-[#22252e] rounded" />
                  <div className="h-4 w-12 bg-[#2a2d35] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
