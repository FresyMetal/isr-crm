import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { entregarFactura, entregarFacturasDelMes, reenviarFactura } from "./invoice-delivery-service";

/**
 * Router de entrega de facturas (PDF + Email)
 */

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acceso denegado: se requiere rol de administrador' });
  }
  return next({ ctx });
});

export const invoiceDeliveryRouter = router({
  // Entregar una factura (generar PDF y enviar email)
  entregarFactura: adminProcedure
    .input(z.object({ facturaId: z.number() }))
    .mutation(async ({ input }) => {
      const resultado = await entregarFactura(input.facturaId);
      if (!resultado.pdfGenerado) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: resultado.error || 'Error entregando factura',
        });
      }
      return resultado;
    }),

  // Entregar facturas de un mes completo
  entregarFacturasDelMes: adminProcedure
    .input(z.object({
      mes: z.number().min(1).max(12),
      anio: z.number().min(2000),
    }))
    .mutation(async ({ input }) => {
      const resultado = await entregarFacturasDelMes(input.mes, input.anio);
      return resultado;
    }),

  // Reenviar factura por email
  reenviarFactura: protectedProcedure
    .input(z.object({ facturaId: z.number() }))
    .mutation(async ({ input }) => {
      const resultado = await reenviarFactura(input.facturaId);
      if (!resultado.emailEnviado) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: resultado.error || 'Error reenviando factura',
        });
      }
      return resultado;
    }),
});
