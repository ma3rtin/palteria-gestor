import { getCatalogoFormulario, crearCliente } from "@/actions/clientes";

const FORMAS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "PAGO_SEMANAL", label: "Pago Semanal" },
  { value: "CAMBIO", label: "Cambio" },
];

export default async function NuevoClientePage() {
  const { zonas, repartidores, cuentas } = await getCatalogoFormulario();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#f9fafb] mb-6">Nuevo cliente</h1>

      <form action={crearCliente} className="bg-[#1c1f26] rounded-lg border border-[#2a2d35] p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Nombre / Dirección *</label>
          <input
            name="nombre"
            required
            placeholder="Ej: ROSALES 763, SUSHI POP TIGRE"
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Zona *</label>
            <select
              name="idZona"
              required
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
            >
              <option value="">Seleccionar...</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Repartidor</label>
            <select
              name="idRepartidor"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
            >
              <option value="">Sin asignar</option>
              {repartidores.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Forma de pago habitual *</label>
            <select
              name="formaPagoPref"
              required
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
            >
              {FORMAS_PAGO.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Cuenta corriente</label>
            <select
              name="idCuentaCorriente"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] bg-[#1c1f26]"
            >
              <option value="">Ninguna</option>
              {cuentas.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              placeholder="Ej: 11 1234-5678"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f9fafb] mb-1">Dirección (opcional)</label>
            <input
              name="direccion"
              placeholder="Solo si difiere del nombre"
              className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f9fafb] mb-1">Observaciones</label>
          <textarea
            name="observaciones"
            rows={2}
            placeholder="Notas internas sobre el cliente"
            className="w-full border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#a3e635] resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="requiereFactura" className="rounded" />
          <span className="text-sm text-[#f9fafb]">Requiere factura</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#a3e635] hover:bg-[#84cc16] text-[#0f1117] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Crear cliente
          </button>
          <a href="/clientes" className="px-6 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-[#f9fafb] border border-[#2a2d35] hover:border-[#4b5563] transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
