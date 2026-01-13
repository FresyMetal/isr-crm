import { mysqlTable, int, varchar, decimal, timestamp, text, index } from "drizzle-orm/mysql-core";

/**
 * Tabla para registrar el historial de cambios de plan de los clientes
 */
export const historialCambiosPlan = mysqlTable("historial_cambios_plan", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("cliente_id").notNull(),
  
  // Plan anterior
  planAnteriorId: int("plan_anterior_id"),
  planAnteriorNombre: varchar("plan_anterior_nombre", { length: 255 }),
  precioAnterior: decimal("precio_anterior", { precision: 10, scale: 2 }),
  
  // Plan nuevo
  planNuevoId: int("plan_nuevo_id").notNull(),
  planNuevoNombre: varchar("plan_nuevo_nombre", { length: 255 }).notNull(),
  precioNuevo: decimal("precio_nuevo", { precision: 10, scale: 2 }).notNull(),
  
  // Cálculo de prorrateo
  diasRestantes: int("dias_restantes"),
  ajusteProrrateo: decimal("ajuste_prorrateo", { precision: 10, scale: 2 }).default("0.00"),
  
  // Fechas
  fechaCambio: timestamp("fecha_cambio").defaultNow().notNull(),
  fechaAplicacion: timestamp("fecha_aplicacion").notNull(), // Cuándo se hace efectivo el cambio
  
  // Motivo y observaciones
  motivo: text("motivo"),
  observaciones: text("observaciones"),
  
  // Usuario que realizó el cambio
  realizadoPor: int("realizado_por"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  fechaCambioIdx: index("fecha_cambio_idx").on(table.fechaCambio),
}));

export type HistorialCambioPlan = typeof historialCambiosPlan.$inferSelect;
export type InsertHistorialCambioPlan = typeof historialCambiosPlan.$inferInsert;
