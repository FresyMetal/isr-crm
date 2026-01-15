import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ISR CRM - Esquema de Base de Datos
 * Sistema integral para gestión de operador de telecomunicaciones
 */

// ============================================================================
// USUARIOS Y AUTENTICACIÓN
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "tecnico", "comercial"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// CLIENTES
// ============================================================================

export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Datos personales
  codigo: varchar("codigo", { length: 50 }).unique(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }),
  tipoCliente: varchar("tipo_cliente", { length: 50 }),
  tipoId: varchar("tipo_id", { length: 20 }),
  dni: varchar("dni", { length: 20 }),
  email: varchar("email", { length: 320 }),
  telefono: varchar("telefono", { length: 20 }),
  telefonoAlternativo: varchar("telefono_alternativo", { length: 20 }),
  numero: varchar("numero", { length: 20 }),
  contacto: varchar("contacto", { length: 255 }),
  
  // Dirección de instalación
  direccion: text("direccion").notNull(),
  calle1: varchar("calle1", { length: 255 }),
  calle2: varchar("calle2", { length: 255 }),
  domicilio: text("domicilio"),
  codigoPostal: varchar("codigo_postal", { length: 10 }),
  localidad: varchar("localidad", { length: 255 }).notNull(),
  provincia: varchar("provincia", { length: 255 }),
  latitud: varchar("latitud", { length: 50 }),
  longitud: varchar("longitud", { length: 50 }),
  extra1: varchar("extra1", { length: 255 }),
  extra2: varchar("extra2", { length: 255 }),
  
  // Datos de facturación (si diferentes)
  direccionFacturacion: text("direccion_facturacion"),
  domicilioFiscal: text("domicilio_fiscal"),
  
  // Datos técnicos GPON
  numeroSerieONT: varchar("numero_serie_ont", { length: 50 }).unique(),
  macONT: varchar("mac_ont", { length: 20 }),
  modeloONT: varchar("modelo_ont", { length: 100 }),
  perfilVelocidad: varchar("perfil_velocidad", { length: 100 }),
  perfilUsuario: varchar("perfil_usuario", { length: 100 }),
  olt: varchar("olt", { length: 100 }),
  pon: varchar("pon", { length: 50 }),
  vlan: varchar("vlan", { length: 20 }),
  ipFija: varchar("ip_fija", { length: 45 }),
  
  // Estado del servicio
  estado: mysqlEnum("estado", ["activo", "suspendido", "baja", "pendiente_instalacion"]).default("pendiente_instalacion").notNull(),
  motivoSuspension: text("motivo_suspension"),
  fechaAlta: timestamp("fecha_alta").defaultNow().notNull(),
  fechaBaja: timestamp("fecha_baja"),
  motivoBaja: text("motivo_baja"),
  
  // Datos contractuales
  planId: int("plan_id"),
  precioMensual: decimal("precio_mensual", { precision: 10, scale: 2 }),
  numeroCuenta: varchar("numero_cuenta", { length: 50 }),
  fechaInstalacion: timestamp("fecha_instalacion"),
  observaciones: text("observaciones"),
  
  // Datos comerciales
  medioPago: varchar("medio_pago", { length: 50 }),
  cobrador: varchar("cobrador", { length: 255 }),
  vendedor: varchar("vendedor", { length: 255 }),
  contrato: boolean("contrato").default(false),
  tipoContrato: varchar("tipo_contrato", { length: 100 }),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  
  // Datos financieros
  gratis: boolean("gratis").default(false),
  recuperacion: varchar("recuperacion", { length: 255 }),
  cbu: varchar("cbu", { length: 50 }),
  tarjetaCredito: varchar("tarjeta_credito", { length: 100 }),
  pagoAutomatico: boolean("pago_automatico").default(false),
  
  // Configuración de envíos
  envioFacturaAuto: boolean("envio_factura_auto").default(false),
  envioReciboPagoAuto: boolean("envio_recibo_pago_auto").default(false),
  
  // Control y gestión
  bloquear: boolean("bloquear").default(false),
  preAviso: boolean("pre_aviso").default(false),
  terVenc: int("ter_venc").default(0),
  proxMes: boolean("prox_mes").default(false),
  actividadComercial: text("actividad_comercial"),
  
  // Metadatos
  creadoPor: int("creado_por"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  estadoIdx: index("estado_idx").on(table.estado),
  localidadIdx: index("localidad_idx").on(table.localidad),
  dniIdx: index("dni_idx").on(table.dni),
}));

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ============================================================================
// PLANES Y SERVICIOS
// ============================================================================

export const planes = mysqlTable("planes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Información del plan
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  tipo: mysqlEnum("tipo", ["fibra", "movil", "tv", "telefonia_fija", "combo"]).notNull(),
  
  // Características técnicas
  velocidadBajada: int("velocidad_bajada"), // Mbps
  velocidadSubida: int("velocidad_subida"), // Mbps
  datosMoviles: int("datos_moviles"), // GB
  minutosLlamadas: int("minutos_llamadas"),
  canalesTV: int("canales_tv"),
  
  // Mapeo a PSO Anvimur
  perfilVelocidadPSO: varchar("perfil_velocidad_pso", { length: 100 }),
  perfilUsuarioPSO: varchar("perfil_usuario_pso", { length: 100 }),
  
  // Precios
  precioMensual: decimal("precio_mensual", { precision: 10, scale: 2 }).notNull(),
  precioInstalacion: decimal("precio_instalacion", { precision: 10, scale: 2 }).default("0.00"),
  precioPromocion: decimal("precio_promocion", { precision: 10, scale: 2 }),
  mesesPromocion: int("meses_promocion"),
  
  // Estado
  activo: boolean("activo").default(true).notNull(),
  destacado: boolean("destacado").default(false),
  
  // Metadatos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof planes.$inferSelect;
export type InsertPlan = typeof planes.$inferInsert;

// ============================================================================
// SERVICIOS CONTRATADOS POR CLIENTE
// ============================================================================

export const serviciosCliente = mysqlTable("servicios_cliente", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("cliente_id").notNull(),
  planId: int("plan_id").notNull(),
  
  // Fechas
  fechaInicio: timestamp("fecha_inicio").defaultNow().notNull(),
  fechaFin: timestamp("fecha_fin"),
  
  // Precio aplicado (puede diferir del plan por promociones)
  precioMensual: decimal("precio_mensual", { precision: 10, scale: 2 }).notNull(),
  
  // Estado
  activo: boolean("activo").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  planIdx: index("plan_idx").on(table.planId),
}));

export type ServicioCliente = typeof serviciosCliente.$inferSelect;
export type InsertServicioCliente = typeof serviciosCliente.$inferInsert;

// ============================================================================
// FACTURACIÓN
// ============================================================================

export const facturas = mysqlTable("facturas", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("cliente_id").notNull(),
  
  // Datos de la factura
  numeroFactura: varchar("numero_factura", { length: 50 }).notNull().unique(),
  fechaEmision: timestamp("fecha_emision").defaultNow().notNull(),
  fechaVencimiento: timestamp("fecha_vencimiento").notNull(),
  periodoDesde: timestamp("periodo_desde").notNull(),
  periodoHasta: timestamp("periodo_hasta").notNull(),
  
  // Importes
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  iva: decimal("iva", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Estado
  estado: mysqlEnum("estado", ["pendiente", "pagada", "vencida", "anulada"]).default("pendiente").notNull(),
  fechaPago: timestamp("fecha_pago"),
  metodoPago: varchar("metodo_pago", { length: 50 }),
  
  // Observaciones
  observaciones: text("observaciones"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  estadoIdx: index("estado_idx").on(table.estado),
  fechaEmisionIdx: index("fecha_emision_idx").on(table.fechaEmision),
}));

export type Factura = typeof facturas.$inferSelect;
export type InsertFactura = typeof facturas.$inferInsert;

export const conceptosFactura = mysqlTable("conceptos_factura", {
  id: int("id").autoincrement().primaryKey(),
  facturaId: int("factura_id").notNull(),
  
  descripcion: varchar("descripcion", { length: 255 }).notNull(),
  cantidad: int("cantidad").default(1).notNull(),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  facturaIdx: index("factura_idx").on(table.facturaId),
}));

export type ConceptoFactura = typeof conceptosFactura.$inferSelect;
export type InsertConceptoFactura = typeof conceptosFactura.$inferInsert;

export const pagos = mysqlTable("pagos", {
  id: int("id").autoincrement().primaryKey(),
  facturaId: int("factura_id").notNull(),
  clienteId: int("cliente_id").notNull(),
  
  importe: decimal("importe", { precision: 10, scale: 2 }).notNull(),
  fechaPago: timestamp("fecha_pago").defaultNow().notNull(),
  metodoPago: varchar("metodo_pago", { length: 50 }).notNull(),
  referencia: varchar("referencia", { length: 100 }),
  
  observaciones: text("observaciones"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  facturaIdx: index("factura_idx").on(table.facturaId),
  clienteIdx: index("cliente_idx").on(table.clienteId),
}));

export type Pago = typeof pagos.$inferSelect;
export type InsertPago = typeof pagos.$inferInsert;

// ============================================================================
// SOPORTE TÉCNICO
// ============================================================================

export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("cliente_id").notNull(),
  
  // Datos del ticket
  numeroTicket: varchar("numero_ticket", { length: 50 }).notNull().unique(),
  asunto: varchar("asunto", { length: 255 }).notNull(),
  descripcion: text("descripcion").notNull(),
  
  // Clasificación
  tipo: mysqlEnum("tipo", ["averia", "consulta", "instalacion", "cambio_servicio", "baja", "otro"]).notNull(),
  prioridad: mysqlEnum("prioridad", ["baja", "media", "alta", "urgente"]).default("media").notNull(),
  
  // Estado y asignación
  estado: mysqlEnum("estado", ["abierto", "en_proceso", "pendiente_cliente", "resuelto", "cerrado"]).default("abierto").notNull(),
  asignadoA: int("asignado_a"),
  
  // Fechas
  fechaApertura: timestamp("fecha_apertura").defaultNow().notNull(),
  fechaCierre: timestamp("fecha_cierre"),
  
  // Resolución
  solucion: text("solucion"),
  tiempoResolucion: int("tiempo_resolucion"), // minutos
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  estadoIdx: index("estado_idx").on(table.estado),
  asignadoIdx: index("asignado_idx").on(table.asignadoA),
}));

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

export const comentariosTicket = mysqlTable("comentarios_ticket", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticket_id").notNull(),
  usuarioId: int("usuario_id").notNull(),
  
  comentario: text("comentario").notNull(),
  interno: boolean("interno").default(false), // Si es visible solo para técnicos
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ticketIdx: index("ticket_idx").on(table.ticketId),
}));

export type ComentarioTicket = typeof comentariosTicket.$inferSelect;
export type InsertComentarioTicket = typeof comentariosTicket.$inferInsert;

// ============================================================================
// MARKETING Y VENTAS
// ============================================================================

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  
  // Datos del prospecto
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }),
  email: varchar("email", { length: 320 }),
  telefono: varchar("telefono", { length: 20 }),
  direccion: text("direccion"),
  localidad: varchar("localidad", { length: 255 }),
  
  // Origen y clasificación
  fuente: varchar("fuente", { length: 100 }), // web, telefono, referido, etc.
  estado: mysqlEnum("estado", ["nuevo", "contactado", "calificado", "propuesta", "ganado", "perdido"]).default("nuevo").notNull(),
  interes: mysqlEnum("interes", ["bajo", "medio", "alto"]).default("medio"),
  
  // Seguimiento comercial
  asignadoA: int("asignado_a"),
  planInteres: int("plan_interes"),
  observaciones: text("observaciones"),
  
  // Conversión
  convertidoClienteId: int("convertido_cliente_id"),
  fechaConversion: timestamp("fecha_conversion"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  estadoIdx: index("estado_idx").on(table.estado),
  asignadoIdx: index("asignado_idx").on(table.asignadoA),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const campanas = mysqlTable("campanas", {
  id: int("id").autoincrement().primaryKey(),
  
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 100 }), // email, sms, redes_sociales, puerta_a_puerta
  
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin"),
  
  presupuesto: decimal("presupuesto", { precision: 10, scale: 2 }),
  leadsGenerados: int("leads_generados").default(0),
  clientesConvertidos: int("clientes_convertidos").default(0),
  
  activa: boolean("activa").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Campana = typeof campanas.$inferSelect;
export type InsertCampana = typeof campanas.$inferInsert;

// ============================================================================
// LOGS Y AUDITORÍA
// ============================================================================

export const logsPSO = mysqlTable("logs_pso", {
  id: int("id").autoincrement().primaryKey(),
  
  clienteId: int("cliente_id"),
  operacion: varchar("operacion", { length: 100 }).notNull(), // añadir_ont, eliminar_ont, modificar_ont, etc.
  
  // Request
  requestPayload: text("request_payload"),
  
  // Response
  codigoRespuesta: int("codigo_respuesta"),
  respuesta: text("respuesta"),
  exitoso: boolean("exitoso").notNull(),
  
  // Error handling
  mensajeError: text("mensaje_error"),
  intentos: int("intentos").default(1),
  
  usuarioId: int("usuario_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  operacionIdx: index("operacion_idx").on(table.operacion),
  fechaIdx: index("fecha_idx").on(table.createdAt),
}));

export type LogPSO = typeof logsPSO.$inferSelect;
export type InsertLogPSO = typeof logsPSO.$inferInsert;

export const actividadCliente = mysqlTable("actividad_cliente", {
  id: int("id").autoincrement().primaryKey(),
  
  clienteId: int("cliente_id").notNull(),
  usuarioId: int("usuario_id"),
  
  tipo: varchar("tipo", { length: 100 }).notNull(), // cambio_plan, suspension, pago, contacto, etc.
  descripcion: text("descripcion").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  clienteIdx: index("cliente_idx").on(table.clienteId),
  fechaIdx: index("fecha_idx").on(table.createdAt),
}));

export type ActividadCliente = typeof actividadCliente.$inferSelect;
export type InsertActividadCliente = typeof actividadCliente.$inferInsert;

// ============================================================================
// RELACIONES
// ============================================================================

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  plan: one(planes, {
    fields: [clientes.planId],
    references: [planes.id],
  }),
  servicios: many(serviciosCliente),
  facturas: many(facturas),
  tickets: many(tickets),
  actividades: many(actividadCliente),
  creadoPorUsuario: one(users, {
    fields: [clientes.creadoPor],
    references: [users.id],
  }),
}));

export const serviciosClienteRelations = relations(serviciosCliente, ({ one }) => ({
  cliente: one(clientes, {
    fields: [serviciosCliente.clienteId],
    references: [clientes.id],
  }),
  plan: one(planes, {
    fields: [serviciosCliente.planId],
    references: [planes.id],
  }),
}));

export const facturasRelations = relations(facturas, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [facturas.clienteId],
    references: [clientes.id],
  }),
  conceptos: many(conceptosFactura),
  pagos: many(pagos),
}));

export const conceptosFacturaRelations = relations(conceptosFactura, ({ one }) => ({
  factura: one(facturas, {
    fields: [conceptosFactura.facturaId],
    references: [facturas.id],
  }),
}));

export const pagosRelations = relations(pagos, ({ one }) => ({
  factura: one(facturas, {
    fields: [pagos.facturaId],
    references: [facturas.id],
  }),
  cliente: one(clientes, {
    fields: [pagos.clienteId],
    references: [clientes.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [tickets.clienteId],
    references: [clientes.id],
  }),
  asignado: one(users, {
    fields: [tickets.asignadoA],
    references: [users.id],
  }),
  comentarios: many(comentariosTicket),
}));

export const comentariosTicketRelations = relations(comentariosTicket, ({ one }) => ({
  ticket: one(tickets, {
    fields: [comentariosTicket.ticketId],
    references: [tickets.id],
  }),
  usuario: one(users, {
    fields: [comentariosTicket.usuarioId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  asignado: one(users, {
    fields: [leads.asignadoA],
    references: [users.id],
  }),
  planInteresado: one(planes, {
    fields: [leads.planInteres],
    references: [planes.id],
  }),
  clienteConvertido: one(clientes, {
    fields: [leads.convertidoClienteId],
    references: [clientes.id],
  }),
}));

export const logsPSORelations = relations(logsPSO, ({ one }) => ({
  cliente: one(clientes, {
    fields: [logsPSO.clienteId],
    references: [clientes.id],
  }),
  usuario: one(users, {
    fields: [logsPSO.usuarioId],
    references: [users.id],
  }),
}));

export const actividadClienteRelations = relations(actividadCliente, ({ one }) => ({
  cliente: one(clientes, {
    fields: [actividadCliente.clienteId],
    references: [clientes.id],
  }),
  usuario: one(users, {
    fields: [actividadCliente.usuarioId],
    references: [users.id],
  }),
}));

// ============================================================================
// HISTORIAL DE CAMBIOS DE PLAN
// ============================================================================

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
  fechaAplicacion: timestamp("fecha_aplicacion").notNull(),
  
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

export const historialCambiosPlanRelations = relations(historialCambiosPlan, ({ one }) => ({
  cliente: one(clientes, {
    fields: [historialCambiosPlan.clienteId],
    references: [clientes.id],
  }),
  planAnterior: one(planes, {
    fields: [historialCambiosPlan.planAnteriorId],
    references: [planes.id],
  }),
  planNuevo: one(planes, {
    fields: [historialCambiosPlan.planNuevoId],
    references: [planes.id],
  }),
  usuario: one(users, {
    fields: [historialCambiosPlan.realizadoPor],
    references: [users.id],
  }),
}));

