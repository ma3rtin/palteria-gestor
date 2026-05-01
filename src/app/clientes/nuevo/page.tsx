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
      <h1 className="text-2xl font-bold text-[#1a2419] mb-6">Nuevo cliente</h1>

      <form action={crearCliente} className="bg-white rounded-lg border border-[#dde6de] p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-[#1a2419] mb-1">Nombre / Dirección *</label>
          <input
            name="nombre"
            required
            placeholder="Ej: ROSALES 763, SUSHI POP TIGRE"
            className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Zona *</label>
            <select
              name="idZona"
              required
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a] bg-white"
            >
              <option value="">Seleccionar...</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Repartidor</label>
            <select
              name="idRepartidor"
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a] bg-white"
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
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Forma de pago habitual *</label>
            <select
              name="formaPagoPref"
              required
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a] bg-white"
            >
              {FORMAS_PAGO.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Cuenta corriente</label>
            <select
              name="idCuentaCorriente"
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a] bg-white"
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
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              placeholder="Ej: 11 1234-5678"
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2419] mb-1">Dirección (opcional)</label>
            <input
              name="direccion"
              placeholder="Solo si difiere del nombre"
              className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a2419] mb-1">Observaciones</label>
          <textarea
            name="observaciones"
            rows={2}
            placeholder="Notas internas sobre el cliente"
            className="w-full border border-[#dde6de] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#16a34a] resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="requiereFactura" className="rounded" />
          <span className="text-sm text-[#1a2419]">Requiere factura</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Crear cliente
          </button>
          <a href="/clientes" className="px-6 py-2 rounded-lg text-sm text-[#5a6b5c] hover:text-[#1a2419] border border-[#dde6de] hover:border-[#9aab9d] transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
