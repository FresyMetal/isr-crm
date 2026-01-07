import { describe, it, expect } from "vitest";
import {
  entregarFactura,
  entregarFacturasDelMes,
  reenviarFactura,
} from "./invoice-delivery-service";

/**
 * Tests unitarios para el servicio de entrega de facturas
 */

describe("Invoice Delivery Service", () => {
  describe("entregarFactura", () => {
    it("debe retornar estructura correcta de entrega", async () => {
      const resultado = await entregarFactura(1);

      expect(resultado).toHaveProperty("facturaId");
      expect(resultado).toHaveProperty("numeroFactura");
      expect(resultado).toHaveProperty("pdfGenerado");
      expect(resultado).toHaveProperty("emailEnviado");

      expect(typeof resultado.facturaId).toBe("number");
      expect(typeof resultado.pdfGenerado).toBe("boolean");
      expect(typeof resultado.emailEnviado).toBe("boolean");
    });

    it("debe retornar error si la factura no existe", async () => {
      const resultado = await entregarFactura(99999);

      expect(resultado.pdfGenerado).toBe(false);
      expect(resultado.error).toBeDefined();
    });
  });

  describe("entregarFacturasDelMes", () => {
    it("debe retornar estructura correcta de resumen", async () => {
      const resultado = await entregarFacturasDelMes(1, 2024);

      expect(resultado).toHaveProperty("total");
      expect(resultado).toHaveProperty("pdfGenerados");
      expect(resultado).toHaveProperty("emailsEnviados");
      expect(resultado).toHaveProperty("entregas");

      expect(typeof resultado.total).toBe("number");
      expect(typeof resultado.pdfGenerados).toBe("number");
      expect(typeof resultado.emailsEnviados).toBe("number");
      expect(Array.isArray(resultado.entregas)).toBe(true);
    });

    it("debe retornar 0 entregas si no hay facturas", async () => {
      const resultado = await entregarFacturasDelMes(1, 2024);

      expect(resultado.total).toBe(0);
      expect(resultado.pdfGenerados).toBe(0);
      expect(resultado.emailsEnviados).toBe(0);
      expect(resultado.entregas).toEqual([]);
    });

    it("debe validar mes entre 1 y 12", async () => {
      const resultado1 = await entregarFacturasDelMes(1, 2024);
      expect(resultado1).toBeDefined();

      const resultado12 = await entregarFacturasDelMes(12, 2024);
      expect(resultado12).toBeDefined();
    });

    it("debe validar año mayor a 2000", async () => {
      const resultado = await entregarFacturasDelMes(1, 2024);
      expect(resultado).toBeDefined();
    });
  });

  describe("reenviarFactura", () => {
    it("debe retornar estructura correcta de reenvío", async () => {
      const resultado = await reenviarFactura(1);

      expect(resultado).toHaveProperty("facturaId");
      expect(resultado).toHaveProperty("numeroFactura");
      expect(resultado).toHaveProperty("pdfGenerado");
      expect(resultado).toHaveProperty("emailEnviado");
    });

    it("debe retornar error si la factura no existe", async () => {
      const resultado = await reenviarFactura(99999);

      expect(resultado.pdfGenerado).toBe(false);
      expect(resultado.error).toBeDefined();
    });
  });
});
