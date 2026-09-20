import { vi, describe, it, expect, beforeEach } from "vitest";
import { crearCliente, actualizarCliente } from "./clientes";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Mock de prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      cliente: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

// Mock de next/cache
vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
  };
});

// Mock de next/navigation
vi.mock("next/navigation", () => {
  return {
    redirect: vi.fn(),
  };
});

describe("Server Actions - Clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("crearCliente", () => {
    it("debería crear un cliente con email, CUIT y campos opcionales", async () => {
      vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 42 } as never);

      const formData = new FormData();
      formData.append("nombre", " panera rosa moron ");
      formData.append("idZona", "3");
      formData.append("formaPagoPref", "TRANSFERENCIA");
      formData.append("email", "  contacto@panera.com  ");
      formData.append("telefono", "11 5555-5555");
      formData.append("cuit", "30-12345678-9");
      formData.append("requiereFactura", "on");
      formData.append("idRevendedor", "2");

      await crearCliente(formData);

      expect(prisma.cliente.create).toHaveBeenCalledWith({
        data: {
          nombre: "PANERA ROSA MORON",
          cuit: "30-12345678-9",
          email: "contacto@panera.com",
          direccion: null,
          telefono: "11 5555-5555",
          idZona: 3,
          idRepartidor: null,
          formaPagoPref: "TRANSFERENCIA",
          requiereFactura: true,
          idCuentaCorriente: null,
          idRevendedor: 2,
          observaciones: null,
        },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/clientes");
      expect(redirect).toHaveBeenCalledWith("/clientes/42");
    });

    it("debería guardar email como null si viene vacío", async () => {
      vi.mocked(prisma.cliente.create).mockResolvedValue({ id: 43 } as never);

      const formData = new FormData();
      formData.append("nombre", "CLIENTE SIN EMAIL");
      formData.append("idZona", "1");
      formData.append("formaPagoPref", "EFECTIVO");
      formData.append("email", "   ");

      await crearCliente(formData);

      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: null,
          }),
        })
      );
    });

    it("debería lanzar error si falta el nombre o zona", async () => {
      const formData = new FormData();
      formData.append("nombre", "   ");
      formData.append("idZona", "1");

      await expect(crearCliente(formData)).rejects.toThrow("El nombre del cliente es requerido.");
    });
  });

  describe("actualizarCliente", () => {
    it("debería actualizar un cliente con nuevo email", async () => {
      vi.mocked(prisma.cliente.update).mockResolvedValue({ id: 42 } as never);

      const formData = new FormData();
      formData.append("nombre", "PANERA ROSA ACTUALIZADA");
      formData.append("idZona", "3");
      formData.append("formaPagoPref", "PAGO_SEMANAL");
      formData.append("email", "nuevo@panera.com");
      formData.append("cuit", "30-99999999-9");

      await actualizarCliente(42, formData);

      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: expect.objectContaining({
          nombre: "PANERA ROSA ACTUALIZADA",
          email: "nuevo@panera.com",
          cuit: "30-99999999-9",
        }),
      });

      expect(revalidatePath).toHaveBeenCalledWith("/clientes/42");
      expect(revalidatePath).toHaveBeenCalledWith("/clientes");
      expect(redirect).toHaveBeenCalledWith("/clientes/42");
    });
  });
});
