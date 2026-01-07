import { eq, and, desc, gte, lte, like, or, sql, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  clientes, InsertCliente, Cliente,
  planes, InsertPlan, Plan,
  serviciosCliente, InsertServicioCliente,
  facturas, InsertFactura, Factura,
  conceptosFactura, InsertConceptoFactura,
  pagos, InsertPago,
  tickets, InsertTicket, Ticket,
  comentariosTicket, InsertComentarioTicket,
  leads, InsertLead, Lead,
  campanas, InsertCampana,
  logsPSO, InsertLogPSO,
  actividadCliente, InsertActividadCliente,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USUARIOS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ============================================================================
// CLIENTES
// ============================================================================

export async function createCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clientes).values(data);
  return result;
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result[0] || null;
}

export async function getClienteBySN(numeroSerieONT: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(clientes).where(eq(clientes.numeroSerieONT, numeroSerieONT)).limit(1);
  return result[0] || null;
}

export async function getAllClientes(filters?: {
  estado?: string;
  localidad?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(clientes);
  
  const conditions = [];
  if (filters?.estado) {
    conditions.push(eq(clientes.estado, filters.estado as any));
  }
  if (filters?.localidad) {
    conditions.push(eq(clientes.localidad, filters.localidad));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(clientes.nombre, `%${filters.search}%`),
        like(clientes.apellidos, `%${filters.search}%`),
        like(clientes.dni, `%${filters.search}%`),
        like(clientes.email, `%${filters.search}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(clientes.createdAt));
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function getClientesActivos() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(clientes).where(eq(clientes.estado, 'activo'));
}

// ============================================================================
// PLANES
// ============================================================================

export async function createPlan(data: InsertPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(planes).values(data);
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(planes).where(eq(planes.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllPlanes(activosOnly = false) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(planes);
  
  if (activosOnly) {
    query = query.where(eq(planes.activo, true)) as any;
  }
  
  return query.orderBy(planes.tipo, planes.precioMensual);
}

export async function updatePlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(planes).set(data).where(eq(planes.id, id));
}

// ============================================================================
// SERVICIOS CLIENTE
// ============================================================================

export async function createServicioCliente(data: InsertServicioCliente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(serviciosCliente).values(data);
}

export async function getServiciosActivosCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(serviciosCliente)
    .where(and(
      eq(serviciosCliente.clienteId, clienteId),
      eq(serviciosCliente.activo, true)
    ));
}

// ============================================================================
// FACTURAS
// ============================================================================

export async function createFactura(data: InsertFactura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(facturas).values(data);
}

export async function getFacturaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(facturas).where(eq(facturas.id, id)).limit(1);
  return result[0] || null;
}

export async function getFacturasCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(facturas)
    .where(eq(facturas.clienteId, clienteId))
    .orderBy(desc(facturas.fechaEmision));
}

export async function getFacturasPendientes() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(facturas)
    .where(eq(facturas.estado, 'pendiente'))
    .orderBy(facturas.fechaVencimiento);
}

export async function updateFactura(id: number, data: Partial<InsertFactura>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(facturas).set(data).where(eq(facturas.id, id));
}

// ============================================================================
// CONCEPTOS FACTURA
// ============================================================================

export async function createConceptoFactura(data: InsertConceptoFactura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(conceptosFactura).values(data);
}

export async function getConceptosFactura(facturaId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(conceptosFactura)
    .where(eq(conceptosFactura.facturaId, facturaId));
}

// ============================================================================
// PAGOS
// ============================================================================

export async function createPago(data: InsertPago) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(pagos).values(data);
}

export async function getPagosFactura(facturaId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(pagos)
    .where(eq(pagos.facturaId, facturaId))
    .orderBy(desc(pagos.fechaPago));
}

// ============================================================================
// TICKETS
// ============================================================================

export async function createTicket(data: Omit<InsertTicket, 'numeroTicket'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generar número de ticket único
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const count = await db.select({ count: sql<number>`count(*)` }).from(tickets);
  const ticketNumber = `TK-${year}${month}-${String((count[0]?.count || 0) + 1).padStart(4, '0')}`;
  
  return db.insert(tickets).values({
    ...data,
    numeroTicket: ticketNumber,
  });
}

export async function getTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return result[0] || null;
}

export async function getTicketsCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(tickets)
    .where(eq(tickets.clienteId, clienteId))
    .orderBy(desc(tickets.fechaApertura));
}

export async function getTicketsAbiertos() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(tickets)
    .where(or(
      eq(tickets.estado, 'abierto'),
      eq(tickets.estado, 'en_proceso')
    ))
    .orderBy(tickets.prioridad, desc(tickets.fechaApertura));
}

export async function updateTicket(id: number, data: Partial<InsertTicket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(tickets).set(data).where(eq(tickets.id, id));
}

// ============================================================================
// COMENTARIOS TICKET
// ============================================================================

export async function createComentarioTicket(data: InsertComentarioTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(comentariosTicket).values(data);
}

export async function getComentariosTicket(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(comentariosTicket)
    .where(eq(comentariosTicket.ticketId, ticketId))
    .orderBy(comentariosTicket.createdAt);
}

// ============================================================================
// LEADS
// ============================================================================

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(leads).values(data);
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllLeads(filters?: {
  estado?: string;
  asignadoA?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(leads);
  
  const conditions = [];
  if (filters?.estado) {
    conditions.push(eq(leads.estado, filters.estado as any));
  }
  if (filters?.asignadoA) {
    conditions.push(eq(leads.asignadoA, filters.asignadoA));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(leads.createdAt));
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(leads).set(data).where(eq(leads.id, id));
}

// ============================================================================
// CAMPAÑAS
// ============================================================================

export async function createCampana(data: InsertCampana) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(campanas).values(data);
}

export async function getAllCampanas() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(campanas).orderBy(desc(campanas.fechaInicio));
}

// ============================================================================
// ACTIVIDAD CLIENTE
// ============================================================================

export async function createActividadCliente(data: InsertActividadCliente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(actividadCliente).values(data);
}

export async function getActividadesCliente(clienteId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(actividadCliente)
    .where(eq(actividadCliente.clienteId, clienteId))
    .orderBy(desc(actividadCliente.createdAt))
    .limit(limit);
}

// ============================================================================
// ESTADÍSTICAS Y KPIs
// ============================================================================

export async function getKPIs() {
  const db = await getDb();
  if (!db) return null;
  
  const [
    totalClientesResult,
    clientesActivosResult,
    ticketsAbiertosResult,
    facturasVencidasResult,
    leadsNuevosResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(clientes),
    db.select({ count: count() }).from(clientes).where(eq(clientes.estado, 'activo')),
    db.select({ count: count() }).from(tickets).where(or(
      eq(tickets.estado, 'abierto'),
      eq(tickets.estado, 'en_proceso')
    )),
    db.select({ count: count() }).from(facturas).where(eq(facturas.estado, 'vencida')),
    db.select({ count: count() }).from(leads).where(eq(leads.estado, 'nuevo')),
  ]);
  
  return {
    totalClientes: totalClientesResult[0]?.count || 0,
    clientesActivos: clientesActivosResult[0]?.count || 0,
    ticketsAbiertos: ticketsAbiertosResult[0]?.count || 0,
    facturasVencidas: facturasVencidasResult[0]?.count || 0,
    leadsNuevos: leadsNuevosResult[0]?.count || 0,
  };
}

export async function getClientesPorMes(meses = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - meses);
  
  return db
    .select({
      mes: sql<string>`DATE_FORMAT(${clientes.fechaAlta}, '%Y-%m')`,
      total: count(),
    })
    .from(clientes)
    .where(gte(clientes.fechaAlta, fechaInicio))
    .groupBy(sql`DATE_FORMAT(${clientes.fechaAlta}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${clientes.fechaAlta}, '%Y-%m')`);
}

export async function getIngresosMensuales(meses = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - meses);
  
  return db
    .select({
      mes: sql<string>`DATE_FORMAT(${facturas.fechaEmision}, '%Y-%m')`,
      total: sum(facturas.total),
    })
    .from(facturas)
    .where(and(
      gte(facturas.fechaEmision, fechaInicio),
      eq(facturas.estado, 'pagada')
    ))
    .groupBy(sql`DATE_FORMAT(${facturas.fechaEmision}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${facturas.fechaEmision}, '%Y-%m')`);
}
