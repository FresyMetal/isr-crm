import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getAllPlanesConContador,
  getPlanConContador,
  crearPlan,
  actualizarPlan,
  eliminarPlan,
  getEstadisticasPlanes,
} from "./planes-service";
import { getDb } from "./db";

describe("Planes Service", () => {
  let planId: number;

  beforeAll(async () => {
    // Limpiar planes de prueba antes de empezar
    const db = await getDb();
    if (db) {
      // Los tests se ejecutan en una BD de prueba
    }
  });

  afterAll(async () => {
    // Limpiar después de los tests
  });

  it("debería crear un nuevo plan", async () => {
    const resultado = await crearPlan({
      nombre: "Plan Test Fibra 100",
      descripcion: "Plan de prueba",
      tipo: "fibra",
      velocidadBajada: 100,
      velocidadSubida: 10,
      precioMensual: "29.99",
      activo: true,
    });

    expect(resultado).toBeDefined();
    expect(resultado.nombre).toBe("Plan Test Fibra 100");
    expect(resultado.clientesCount).toBe(0);
    planId = resultado.id;
  });

  it("debería obtener plan con contador", async () => {
    const plan = await getPlanConContador(planId);

    expect(plan).toBeDefined();
    expect(plan?.id).toBe(planId);
    expect(plan?.clientesCount).toBe(0);
  });

  it("debería listar todos los planes con contador", async () => {
    const planes = await getAllPlanesConContador();

    expect(Array.isArray(planes)).toBe(true);
    expect(planes.length).toBeGreaterThan(0);
    expect(planes[0]).toHaveProperty("clientesCount");
  });

  it("debería actualizar un plan", async () => {
    const resultado = await actualizarPlan(planId, {
      nombre: "Plan Test Fibra 100 Actualizado",
      precioMensual: "39.99",
    });

    expect(resultado?.nombre).toBe("Plan Test Fibra 100 Actualizado");
    expect(resultado?.precioMensual).toBe("39.99");
  });

  it("debería obtener estadísticas de planes", async () => {
    const estadisticas = await getEstadisticasPlanes();

    expect(estadisticas).toBeDefined();
    expect(estadisticas?.totalPlanes).toBeGreaterThan(0);
    expect(estadisticas?.totalClientes).toBeGreaterThanOrEqual(0);
    expect(estadisticas?.ingresoMensualEstimado).toBeGreaterThanOrEqual(0);
  });

  it("debería validar que no se puede eliminar plan sin datos", async () => {
    // Crear un plan para eliminar
    const nuevoplan = await crearPlan({
      nombre: "Plan a Eliminar",
      tipo: "movil",
      precioMensual: "19.99",
      activo: true,
    });

    // Debería poder eliminarse si no tiene clientes
    const resultado = await eliminarPlan(nuevoplan.id);
    expect(resultado.success).toBe(true);
  });

  it("debería validar campos requeridos", async () => {
    try {
      await crearPlan({
        nombre: "",
        tipo: "fibra",
        precioMensual: "29.99",
      } as any);
      expect.fail("Debería lanzar error por nombre vacío");
    } catch (error: any) {
      expect(error.message).toContain("nombre");
    }
  });

  it("debería retornar null para plan inexistente", async () => {
    const plan = await getPlanConContador(99999);
    expect(plan).toBeNull();
  });
});
