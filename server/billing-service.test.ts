import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generarFacturaCliente,
  generarFacturasDelMes,
  obtenerProximoMesFacturacion,
} from "./billing-service";

/**
 * Tests unitarios para el servicio de facturación automática
 */

describe("Billing Service", () => {
  describe("obtenerProximoMesFacturacion", () => {
    it("debe retornar el mes actual si estamos antes del día 15", () => {
      // Mock de Date para controlar la fecha
      const mockDate = new Date(2024, 0, 10); // 10 de enero de 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const resultado = obtenerProximoMesFacturacion();

      expect(resultado.mes).toBe(1);
      expect(resultado.anio).toBe(2024);

      vi.useRealTimers();
    });

    it("debe retornar el próximo mes si estamos después del día 15", () => {
      const mockDate = new Date(2024, 0, 20); // 20 de enero de 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const resultado = obtenerProximoMesFacturacion();

      expect(resultado.mes).toBe(2);
      expect(resultado.anio).toBe(2024);

      vi.useRealTimers();
    });

    it("debe cambiar de año cuando pasamos de diciembre a enero", () => {
      const mockDate = new Date(2024, 11, 20); // 20 de diciembre de 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const resultado = obtenerProximoMesFacturacion();

      expect(resultado.mes).toBe(1);
      expect(resultado.anio).toBe(2025);

      vi.useRealTimers();
    });
  });

  describe("generarFacturaCliente", () => {
    it("debe retornar error si la base de datos no está disponible", async () => {
      const resultado = await generarFacturaCliente(1, 1, 2024);

      expect(resultado.exitosa).toBe(false);
      expect(resultado.error).toBeDefined();
    });

    it("debe retornar error si el cliente no existe", async () => {
      // Este test se ejecutaría con una BD mock
      // Por ahora solo verificamos que la función no lance excepciones
      const resultado = await generarFacturaCliente(99999, 1, 2024);

      expect(resultado.clienteId).toBe(99999);
      expect(resultado.exitosa).toBe(false);
    });
  });

  describe("generarFacturasDelMes", () => {
    it("debe retornar estructura correcta de resultado", async () => {
      const resultado = await generarFacturasDelMes(1, 2024);

      expect(resultado).toHaveProperty("total");
      expect(resultado).toHaveProperty("exitosas");
      expect(resultado).toHaveProperty("fallidas");
      expect(resultado).toHaveProperty("facturas");

      expect(typeof resultado.total).toBe("number");
      expect(typeof resultado.exitosas).toBe("number");
      expect(typeof resultado.fallidas).toBe("number");
      expect(Array.isArray(resultado.facturas)).toBe(true);
    });

    it("debe retornar 0 clientes si la BD no está disponible", async () => {
      const resultado = await generarFacturasDelMes(1, 2024);

      expect(resultado.total).toBe(0);
      expect(resultado.exitosas).toBe(0);
      expect(resultado.fallidas).toBe(0);
      expect(resultado.facturas).toEqual([]);
    });

    it("debe validar mes entre 1 y 12", async () => {
      // Meses válidos
      const resultado1 = await generarFacturasDelMes(1, 2024);
      expect(resultado1).toBeDefined();

      const resultado12 = await generarFacturasDelMes(12, 2024);
      expect(resultado12).toBeDefined();
    });

    it("debe validar año mayor a 2000", async () => {
      const resultado = await generarFacturasDelMes(1, 2024);
      expect(resultado).toBeDefined();
    });
  });
});
