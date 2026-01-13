import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getPSOClient, PSOClient } from "./pso-client";
import { generarFacturaCliente, generarFacturasDelMes, obtenerProximoMesFacturacion } from "./billing-service";
import { invoiceDeliveryRouter } from "./invoice-delivery-router";
import { getAllPlanesConContador, getPlanConContador, crearPlan, actualizarPlan, eliminarPlan, getPlanesActivos, getEstadisticasPlanes } from "./planes-service";

// ============================================================================
// MIDDLEWARE PARA ADMIN
// ============================================================================

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acceso denegado: se requiere rol de administrador' });
  }
  return next({ ctx });
});

// ============================================================================
// ROUTER DE CLIENTES
// ============================================================================

const clientesRouter = router({
  // Listar todos los clientes con filtros opcionales
  list: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      localidad: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAllClientes(input);
    }),

  // Obtener cliente por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const cliente = await db.getClienteById(input.id);
      if (!cliente) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }
      return cliente;
    }),

  // Crear nuevo cliente con integración PSO
  create: protectedProcedure
    .input(z.object({
      // Datos personales
      codigo: z.string().optional(),
      nombre: z.string().min(1),
      apellidos: z.string().optional(),
      tipoCliente: z.string().optional(),
      tipoId: z.string().optional(),
      dni: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      telefono: z.string().optional(),
      telefonoAlternativo: z.string().optional(),
      numero: z.string().optional(),
      contacto: z.string().optional(),
      
      // Dirección
      direccion: z.string().min(1),
      domicilioFiscal: z.string().optional(),
      calle1: z.string().optional(),
      calle2: z.string().optional(),
      codigoPostal: z.string().optional(),
      localidad: z.string().min(1),
      provincia: z.string().optional(),
      latitud: z.string().optional(),
      longitud: z.string().optional(),
      extra1: z.string().optional(),
      extra2: z.string().optional(),
      
      // Datos comerciales
      medioPago: z.string().optional(),
      cobrador: z.string().optional(),
      vendedor: z.string().optional(),
      contrato: z.boolean().optional(),
      tipoContrato: z.string().optional(),
      fechaVencimiento: z.string().optional(),
      
      // Datos financieros
      gratis: z.boolean().optional(),
      recuperacion: z.string().optional(),
      cbu: z.string().optional(),
      tarjetaCredito: z.string().optional(),
      pagoAutomatico: z.boolean().optional(),
      
      // Configuración
      envioFacturaAuto: z.boolean().optional(),
      envioReciboPagoAuto: z.boolean().optional(),
      bloquear: z.boolean().optional(),
      preAviso: z.boolean().optional(),
      terVenc: z.number().optional(),
      proxMes: z.boolean().optional(),
      actividadComercial: z.string().optional(),
      
      // Datos técnicos
      numeroSerieONT: z.string().optional(),
      modeloONT: z.string().optional(),
      olt: z.string().optional(),
      pon: z.string().optional(),
      
      // Plan contratado
      planId: z.number(),
      
      // Observaciones
      observaciones: z.string().optional(),
      
      // Si se debe activar inmediatamente en PSO
      activarEnPSO: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Obtener información del plan para mapear a PSO
        const plan = await db.getPlanById(input.planId);
        if (!plan) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Plan no encontrado' });
        }

      // Crear cliente en base de datos
      const clienteData = {
        ...input,
        fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : undefined,
        estado: (input.activarEnPSO && input.numeroSerieONT ? 'activo' : 'pendiente_instalacion') as 'activo' | 'suspendido' | 'baja' | 'pendiente_instalacion',
        creadoPor: ctx.user.id,
      };

      const result = await db.createCliente(clienteData);
      // Obtener el ID del cliente recién creado
      let clienteId: number;
      if (typeof result === 'object' && result !== null && 'insertId' in result) {
        clienteId = Number((result as any).insertId);
      } else {
        // Fallback: buscar el último cliente creado por este usuario
        const ultimoCliente = await db.getUltimoClienteCreado(ctx.user.id);
        if (!ultimoCliente) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No se pudo obtener el ID del cliente creado' });
        }
        clienteId = ultimoCliente.id;
      }

        // Si se debe activar en PSO y tenemos número de serie
        if (input.activarEnPSO && input.numeroSerieONT && input.olt && input.pon) {
          try {
            const psoClient = getPSOClient();
            const psoResult = await psoClient.agregarONT({
              sn: input.numeroSerieONT,
              perfilVelocidad: plan.perfilVelocidadPSO || 'default',
              perfilUsuario: plan.perfilUsuarioPSO || 'default',
              olt: input.olt,
              pon: input.pon,
              descripcion: `${input.nombre} ${input.apellidos || ''}`.trim(),
            }, clienteId, ctx.user.id);

            if (PSOClient.isSuccess(psoResult)) {
              // Actualizar estado del cliente a activo
              await db.updateCliente(clienteId, { estado: 'activo' });
              
              // Registrar actividad
              await db.createActividadCliente({
                clienteId,
                usuarioId: ctx.user.id,
                tipo: 'alta_servicio',
                descripcion: 'Cliente dado de alta en PSO correctamente',
              });
            } else {
              // Si falla PSO, registrar el error pero mantener el cliente
              await db.createActividadCliente({
                clienteId,
                usuarioId: ctx.user.id,
                tipo: 'error_pso',
                descripcion: `Error al dar de alta en PSO: ${psoResult.mensaje}`,
              });
            }
          } catch (error: any) {
            // Error de conexión con PSO, pero el cliente ya está creado
            await db.createActividadCliente({
              clienteId,
              usuarioId: ctx.user.id,
              tipo: 'error_pso',
              descripcion: `Error de conexión con PSO: ${error.message}`,
            });
          }
        }

        // Crear servicio contratado
        await db.createServicioCliente({
          clienteId,
          planId: input.planId,
          precioMensual: plan.precioPromocion || plan.precioMensual,
          activo: true,
        });

        // Registrar actividad de creación
        await db.createActividadCliente({
          clienteId,
          usuarioId: ctx.user.id,
          tipo: 'creacion',
          descripcion: 'Cliente creado en el sistema',
        });

        return { success: true, clienteId };
      } catch (error: any) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: `Error al crear cliente: ${error.message}` 
        });
      }
    }),

  // Actualizar cliente
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        // Datos básicos
        codigo: z.string().optional(),
        nombre: z.string().optional(),
        apellidos: z.string().optional(),
        tipoCliente: z.string().optional(),
        tipoId: z.string().optional(),
        dni: z.string().optional(),
        email: z.string().email().optional(),
        telefono: z.string().optional(),
        telefonoAlternativo: z.string().optional(),
        numero: z.string().optional(),
        contacto: z.string().optional(),
        
        // Dirección
        direccion: z.string().optional(),
        domicilioFiscal: z.string().optional(),
        calle1: z.string().optional(),
        calle2: z.string().optional(),
        codigoPostal: z.string().optional(),
        localidad: z.string().optional(),
        provincia: z.string().optional(),
        latitud: z.string().optional(),
        longitud: z.string().optional(),
        extra1: z.string().optional(),
        extra2: z.string().optional(),
        
        // Datos comerciales
        medioPago: z.string().optional(),
        cobrador: z.string().optional(),
        vendedor: z.string().optional(),
        contrato: z.boolean().optional(),
        tipoContrato: z.string().optional(),
        fechaVencimiento: z.string().optional(),
        
        // Datos financieros
        gratis: z.boolean().optional(),
        recuperacion: z.string().optional(),
        cbu: z.string().optional(),
        tarjetaCredito: z.string().optional(),
        pagoAutomatico: z.boolean().optional(),
        
        // Configuración
        envioFacturaAuto: z.boolean().optional(),
        envioReciboPagoAuto: z.boolean().optional(),
        bloquear: z.boolean().optional(),
        preAviso: z.boolean().optional(),
        terVenc: z.number().optional(),
        proxMes: z.boolean().optional(),
        actividadComercial: z.string().optional(),
        
        // Técnicos
        numeroSerieONT: z.string().optional(),
        modeloONT: z.string().optional(),
        olt: z.string().optional(),
        pon: z.string().optional(),
        
        // Plan y otros
        planId: z.number().optional(),
        numeroCuenta: z.string().optional(),
        precioMensual: z.string().optional(),
        observaciones: z.string().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const dataToUpdate = {
        ...input.data,
        fechaVencimiento: input.data.fechaVencimiento ? new Date(input.data.fechaVencimiento) : undefined,
      };
      await db.updateCliente(input.id, dataToUpdate);
      
      await db.createActividadCliente({
        clienteId: input.id,
        usuarioId: ctx.user.id,
        tipo: 'actualizacion',
        descripcion: 'Datos del cliente actualizados',
      });
      
      return { success: true };
    }),

  // Suspender servicio
  suspend: protectedProcedure
    .input(z.object({
      id: z.number(),
      motivo: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const cliente = await db.getClienteById(input.id);
      if (!cliente) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      // Suspender en PSO si tiene ONT
      if (cliente.numeroSerieONT) {
        try {
          const psoClient = getPSOClient();
          // En PSO se puede suspender modificando el perfil o eliminando temporalmente
          // Aquí usamos modificación a perfil "suspendido"
          await psoClient.modificarONT({
            sn: cliente.numeroSerieONT,
            perfilVelocidad: 'suspendido',
          }, input.id, ctx.user.id);
        } catch (error) {
          console.error('Error al suspender en PSO:', error);
        }
      }

      await db.updateCliente(input.id, {
        estado: 'suspendido',
        motivoSuspension: input.motivo,
      });

      await db.createActividadCliente({
        clienteId: input.id,
        usuarioId: ctx.user.id,
        tipo: 'suspension',
        descripcion: `Servicio suspendido: ${input.motivo}`,
      });

      return { success: true };
    }),

  // Reactivar servicio
  reactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const cliente = await db.getClienteById(input.id);
      if (!cliente) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      // Obtener plan actual para reactivar con perfil correcto
      const servicios = await db.getServiciosActivosCliente(input.id);
      if (servicios.length > 0) {
        const plan = await db.getPlanById(servicios[0].planId);
        
        if (cliente.numeroSerieONT && plan) {
          try {
            const psoClient = getPSOClient();
            await psoClient.modificarONT({
              sn: cliente.numeroSerieONT,
              perfilVelocidad: plan.perfilVelocidadPSO || 'default',
            }, input.id, ctx.user.id);
          } catch (error) {
            console.error('Error al reactivar en PSO:', error);
          }
        }
      }

      await db.updateCliente(input.id, {
        estado: 'activo',
        motivoSuspension: null,
      });

      await db.createActividadCliente({
        clienteId: input.id,
        usuarioId: ctx.user.id,
        tipo: 'reactivacion',
        descripcion: 'Servicio reactivado',
      });

      return { success: true };
    }),

  // Dar de baja cliente
  deactivate: protectedProcedure
    .input(z.object({
      id: z.number(),
      motivo: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const cliente = await db.getClienteById(input.id);
      if (!cliente) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      // Eliminar de PSO si tiene ONT
      if (cliente.numeroSerieONT) {
        try {
          const psoClient = getPSOClient();
          await psoClient.eliminarONT(cliente.numeroSerieONT, input.id, ctx.user.id);
        } catch (error) {
          console.error('Error al eliminar de PSO:', error);
        }
      }

      await db.updateCliente(input.id, {
        estado: 'baja',
        fechaBaja: new Date(),
        motivoBaja: input.motivo,
      });

      await db.createActividadCliente({
        clienteId: input.id,
        usuarioId: ctx.user.id,
        tipo: 'baja',
        descripcion: `Cliente dado de baja: ${input.motivo}`,
      });

      return { success: true };
    }),

  // Obtener actividad del cliente
  getActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getActividadesCliente(input.id);
    }),
});

// ============================================================================
// ROUTER DE PLANES
// ============================================================================

const planesRouter = router({
  // Listar todos los planes con contador de clientes
  list: protectedProcedure
    .input(z.object({ activosOnly: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.activosOnly) {
        return getPlanesActivos();
      }
      return getAllPlanesConContador();
    }),

  // Obtener plan por ID con contador
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const plan = await getPlanConContador(input.id);
      if (!plan) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan no encontrado' });
      }
      return plan;
    }),

  // Obtener estadísticas de planes
  estadisticas: protectedProcedure
    .query(async () => {
      return getEstadisticasPlanes();
    }),

  // Crear nuevo plan
  create: adminProcedure
    .input(z.object({
      nombre: z.string().min(1),
      descripcion: z.string().optional(),
      tipo: z.enum(['fibra', 'movil', 'tv', 'telefonia_fija', 'combo']),
      velocidadBajada: z.number().optional(),
      velocidadSubida: z.number().optional(),
      datosMoviles: z.number().optional(),
      minutosLlamadas: z.number().optional(),
      canalesTV: z.number().optional(),
      perfilVelocidadPSO: z.string().optional(),
      perfilUsuarioPSO: z.string().optional(),
      precioMensual: z.string(),
      precioInstalacion: z.string().optional(),
      precioPromocion: z.string().optional(),
      mesesPromocion: z.number().optional(),
      activo: z.boolean().default(true),
      destacado: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return crearPlan(input);
    }),

  // Actualizar plan
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        nombre: z.string().optional(),
        descripcion: z.string().optional(),
        precioMensual: z.string().optional(),
        precioPromocion: z.string().optional(),
        activo: z.boolean().optional(),
        destacado: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      return actualizarPlan(input.id, input.data);
    }),

  // Eliminar plan (solo si no tiene clientes)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return eliminarPlan(input.id);
    }),
});

// ============================================================================
// ROUTER DE FACTURAS
// ============================================================================

const facturasRouter = router({
  list: protectedProcedure
    .input(z.object({ clienteId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.clienteId) {
        return db.getFacturasCliente(input.clienteId);
      }
      // Si no hay clienteId, devolver facturas pendientes
      return db.getFacturasPendientes();
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const factura = await db.getFacturaById(input.id);
      if (!factura) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Factura no encontrada' });
      }
      
      const conceptos = await db.getConceptosFactura(input.id);
      const pagos = await db.getPagosFactura(input.id);
      
      return { ...factura, conceptos, pagos };
    }),

  registrarPago: protectedProcedure
    .input(z.object({
      facturaId: z.number(),
      importe: z.string(),
      metodoPago: z.string(),
      referencia: z.string().optional(),
      observaciones: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const factura = await db.getFacturaById(input.facturaId);
      if (!factura) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Factura no encontrada' });
      }

      // Registrar pago
      await db.createPago({
        facturaId: input.facturaId,
        clienteId: factura.clienteId,
        importe: input.importe,
        metodoPago: input.metodoPago,
        referencia: input.referencia,
        observaciones: input.observaciones,
      });

      // Actualizar estado de factura a pagada
      await db.updateFactura(input.facturaId, {
        estado: 'pagada',
        fechaPago: new Date(),
        metodoPago: input.metodoPago,
      });

      // Registrar actividad
      await db.createActividadCliente({
        clienteId: factura.clienteId,
        usuarioId: ctx.user.id,
        tipo: 'pago',
        descripcion: `Pago registrado: ${input.importe}€ - ${input.metodoPago}`,
      });

      return { success: true };
    }),

  generarFacturas: adminProcedure
    .input(z.object({
      mes: z.number().min(1).max(12),
      anio: z.number().min(2000),
    }))
    .mutation(async ({ input }) => {
      const resultado = await generarFacturasDelMes(input.mes, input.anio);
      return resultado;
    }),

  generarFacturaCliente: adminProcedure
    .input(z.object({
      clienteId: z.number(),
      mes: z.number().min(1).max(12),
      anio: z.number().min(2000),
    }))
    .mutation(async ({ input }) => {
      const resultado = await generarFacturaCliente(input.clienteId, input.mes, input.anio);
      if (!resultado.exitosa) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: resultado.error || 'Error generando factura' });
      }
      return resultado;
    }),

  obtenerProximoMes: protectedProcedure
    .query(() => {
      return obtenerProximoMesFacturacion();
    }),
});

// ============================================================================
// ROUTER DE TICKETS
// ============================================================================

const ticketsRouter = router({
  list: protectedProcedure
    .input(z.object({ 
      clienteId: z.number().optional(),
      abiertosOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      if (input?.clienteId) {
        return db.getTicketsCliente(input.clienteId);
      }
      if (input?.abiertosOnly) {
        return db.getTicketsAbiertos();
      }
      return db.getTicketsAbiertos(); // Por defecto mostrar abiertos
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await db.getTicketById(input.id);
      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket no encontrado' });
      }
      
      const comentarios = await db.getComentariosTicket(input.id);
      
      return { ...ticket, comentarios };
    }),

  create: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      asunto: z.string().min(1),
      descripcion: z.string().min(1),
      tipo: z.enum(['averia', 'consulta', 'instalacion', 'cambio_servicio', 'baja', 'otro']),
      prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).default('media'),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await db.createTicket(input);
      
      await db.createActividadCliente({
        clienteId: input.clienteId,
        usuarioId: ctx.user.id,
        tipo: 'ticket_creado',
        descripcion: `Ticket creado: ${input.asunto}`,
      });
      
      return { success: true };
    }),

  addComment: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      comentario: z.string().min(1),
      interno: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createComentarioTicket({
        ticketId: input.ticketId,
        usuarioId: ctx.user.id,
        comentario: input.comentario,
        interno: input.interno,
      });
      
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      estado: z.enum(['abierto', 'en_proceso', 'pendiente_cliente', 'resuelto', 'cerrado']),
      solucion: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.getTicketById(input.id);
      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket no encontrado' });
      }

      const updateData: any = { estado: input.estado };
      
      if (input.estado === 'cerrado' && ticket.fechaApertura) {
        updateData.fechaCierre = new Date();
        const tiempoResolucion = Math.floor(
          (new Date().getTime() - ticket.fechaApertura.getTime()) / (1000 * 60)
        );
        updateData.tiempoResolucion = tiempoResolucion;
      }
      
      if (input.solucion) {
        updateData.solucion = input.solucion;
      }

      await db.updateTicket(input.id, updateData);
      
      await db.createActividadCliente({
        clienteId: ticket.clienteId,
        usuarioId: ctx.user.id,
        tipo: 'ticket_actualizado',
        descripcion: `Ticket actualizado a estado: ${input.estado}`,
      });
      
      return { success: true };
    }),

  // Operaciones remotas PSO desde ticket
  reiniciarONT: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.getTicketById(input.ticketId);
      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket no encontrado' });
      }

      const cliente = await db.getClienteById(ticket.clienteId);
      if (!cliente || !cliente.numeroSerieONT) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cliente sin ONT asignada' });
      }

      const psoClient = getPSOClient();
      const result = await psoClient.reiniciarONT(cliente.numeroSerieONT, cliente.id, ctx.user.id);

      if (PSOClient.isSuccess(result)) {
        await db.createComentarioTicket({
          ticketId: input.ticketId,
          usuarioId: ctx.user.id,
          comentario: 'ONT reiniciada remotamente correctamente',
          interno: true,
        });
        return { success: true, message: 'ONT reiniciada correctamente' };
      } else {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: PSOClient.getErrorMessage(result.codigo) 
        });
      }
    }),
});

// ============================================================================
// ROUTER DE LEADS
// ============================================================================

const leadsRouter = router({
  list: protectedProcedure
    .input(z.object({
      estado: z.string().optional(),
      asignadoA: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getAllLeads(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const lead = await db.getLeadById(input.id);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead no encontrado' });
      }
      return lead;
    }),

  create: protectedProcedure
    .input(z.object({
      nombre: z.string().min(1),
      apellidos: z.string().optional(),
      email: z.string().email().optional(),
      telefono: z.string().optional(),
      direccion: z.string().optional(),
      localidad: z.string().optional(),
      fuente: z.string().optional(),
      planInteres: z.number().optional(),
      observaciones: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createLead({
        ...input,
        asignadoA: ctx.user.id,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        estado: z.enum(['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido']).optional(),
        interes: z.enum(['bajo', 'medio', 'alto']).optional(),
        observaciones: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateLead(input.id, input.data);
      return { success: true };
    }),

  convertToClient: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const lead = await db.getLeadById(input.id);
      if (!lead) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead no encontrado' });
      }

      // Este endpoint solo marca el lead como ganado
      // La conversión real se hace desde el formulario de crear cliente
      await db.updateLead(input.id, {
        estado: 'ganado',
        fechaConversion: new Date(),
      });

      return { success: true };
    }),
});

// ============================================================================
// ROUTER DE DASHBOARD Y KPIs
// ============================================================================

const dashboardRouter = router({
  getKPIs: protectedProcedure.query(async () => {
    return db.getKPIs();
  }),

  getClientesPorMes: protectedProcedure
    .input(z.object({ meses: z.number().default(12) }))
    .query(async ({ input }) => {
      return db.getClientesPorMes(input.meses);
    }),

  getIngresosMensuales: protectedProcedure
    .input(z.object({ meses: z.number().default(12) }))
    .query(async ({ input }) => {
      return db.getIngresosMensuales(input.meses);
    }),
});

// ============================================================================
// ROUTER PRINCIPAL
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  clientes: clientesRouter,
  planes: planesRouter,
  facturas: facturasRouter,
  invoiceDelivery: invoiceDeliveryRouter,
  tickets: ticketsRouter,
  leads: leadsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
