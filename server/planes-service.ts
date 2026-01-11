import { eq, count } from "drizzle-orm";
import { getDb } from "./db";
import { planes, clientes, InsertPlan } from "../drizzle/schema";

/**
 * Servicio mejorado de gestión de planes
 * Incluye CRUD completo y contador de clientes por plan
 */

/**
 * Obtener todos los planes con contador de clientes
 */
export async function getAllPlanesConContador() {
  const db = await getDb();
  if (!db) return [];

  // Obtener todos los planes
  const todosPlanes = await db.select().from(planes).orderBy(planes.tipo, planes.precioMensual);

  // Para cada plan, contar clientes
  const planesConContador = await Promise.all(
    todosPlanes.map(async (plan) => {
      const clientesCount = await db
        .select({ count: count() })
        .from(clientes)
        .where(eq(clientes.planId, plan.id));

      return {
        ...plan,
        clientesCount: clientesCount[0]?.count || 0,
      };
    })
  );

  return planesConContador;
}

/**
 * Obtener plan por ID con contador de clientes
 */
export async function getPlanConContador(id: number) {
  const db = await getDb();
  if (!db) return null;

  const plan = await db.select().from(planes).where(eq(planes.id, id)).limit(1);
  if (!plan[0]) return null;

  const clientesCount = await db
    .select({ count: count() })
    .from(clientes)
    .where(eq(clientes.planId, id));

  return {
    ...plan[0],
    clientesCount: clientesCount[0]?.count || 0,
  };
}

/**
 * Crear nuevo plan
 */
export async function crearPlan(data: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validaciones
  if (!data.nombre) throw new Error("El nombre del plan es requerido");
  if (!data.tipo) throw new Error("El tipo de plan es requerido");
  if (!data.precioMensual) throw new Error("El precio mensual es requerido");

  const result = await db.insert(planes).values(data);
  const planId = result[0].insertId;

  return getPlanConContador(planId);
}

/**
 * Actualizar plan
 */
export async function actualizarPlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar que el plan existe
  const planExistente = await db.select().from(planes).where(eq(planes.id, id)).limit(1);
  if (!planExistente[0]) throw new Error("Plan no encontrado");

  // Actualizar
  await db.update(planes).set(data).where(eq(planes.id, id));

  return getPlanConContador(id);
}

/**
 * Eliminar plan (solo si no tiene clientes)
 */
export async function eliminarPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar que el plan existe
  const plan = await db.select().from(planes).where(eq(planes.id, id)).limit(1);
  if (!plan[0]) throw new Error("Plan no encontrado");

  // Verificar que no tiene clientes
  const clientesConPlan = await db
    .select({ count: count() })
    .from(clientes)
    .where(eq(clientes.planId, id));

  if ((clientesConPlan[0]?.count || 0) > 0) {
    throw new Error(
      `No se puede eliminar el plan porque tiene ${clientesConPlan[0]?.count} cliente(s) asignado(s)`
    );
  }

  // Eliminar
  await db.delete(planes).where(eq(planes.id, id));

  return { success: true, mensaje: "Plan eliminado correctamente" };
}

/**
 * Obtener planes activos con contador
 */
export async function getPlanesActivos() {
  const db = await getDb();
  if (!db) return [];

  const todosPlanes = await db
    .select()
    .from(planes)
    .where(eq(planes.activo, true))
    .orderBy(planes.tipo, planes.precioMensual);

  const planesConContador = await Promise.all(
    todosPlanes.map(async (plan) => {
      const clientesCount = await db
        .select({ count: count() })
        .from(clientes)
        .where(eq(clientes.planId, plan.id));

      return {
        ...plan,
        clientesCount: clientesCount[0]?.count || 0,
      };
    })
  );

  return planesConContador;
}

/**
 * Obtener estadísticas de planes
 */
export async function getEstadisticasPlanes() {
  const db = await getDb();
  if (!db) return null;

  const planesConContador = await getAllPlanesConContador();

  const estadisticas = {
    totalPlanes: planesConContador.length,
    totalClientes: planesConContador.reduce((sum, p) => sum + (p.clientesCount || 0), 0),
    planesConClientes: planesConContador.filter((p) => (p.clientesCount || 0) > 0).length,
    planesSinClientes: planesConContador.filter((p) => (p.clientesCount || 0) === 0).length,
    ingresoMensualEstimado: planesConContador.reduce((sum, p) => {
      const precio = Number(p.precioMensual) || 0;
      return sum + (precio * (p.clientesCount || 0));
    }, 0),
    planes: planesConContador,
  };

  return estadisticas;
}
