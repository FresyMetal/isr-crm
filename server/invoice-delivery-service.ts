import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { facturas as facturasTable } from "../drizzle/schema";
import { generarPDFFactura } from "./pdf-service";
import { enviarFacturaEmail } from "./email-service";
import { notifyOwner } from "./_core/notification";

/**
 * Servicio integrado de entrega de facturas
 * Genera PDF y envía por email automáticamente
 */

export interface EntregaFactura {
  facturaId: number;
  numeroFactura: string;
  pdfGenerado: boolean;
  emailEnviado: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Genera PDF y envía factura por email
 * @param facturaId ID de la factura
 * @returns Información de la entrega
 */
export async function entregarFactura(facturaId: number): Promise<EntregaFactura> {
  try {
    // Generar PDF
    console.log(`[Delivery] Generando PDF para factura ${facturaId}`);
    const pdfResultado = await generarPDFFactura(facturaId);

    if (!pdfResultado.exitosa) {
      return {
        facturaId,
        numeroFactura: pdfResultado.numeroFactura,
        pdfGenerado: false,
        emailEnviado: false,
        error: `Error generando PDF: ${pdfResultado.error}`,
      };
    }

    // Enviar email
    console.log(`[Delivery] Enviando email para factura ${facturaId}`);
    const emailResultado = await enviarFacturaEmail(facturaId, pdfResultado.pdfUrl);

    if (!emailResultado.exitoso) {
      console.warn(`[Delivery] Error enviando email: ${emailResultado.error}`);
      // No fallar si el email no se envía, al menos el PDF se generó
    }

    return {
      facturaId,
      numeroFactura: pdfResultado.numeroFactura,
      pdfGenerado: true,
      emailEnviado: emailResultado.exitoso,
      pdfUrl: pdfResultado.pdfUrl,
      error: emailResultado.exitoso ? undefined : emailResultado.error,
    };
  } catch (error) {
    console.error("[Delivery] Error entregando factura", facturaId, error);
    return {
      facturaId,
      numeroFactura: "",
      pdfGenerado: false,
      emailEnviado: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Entrega facturas para un mes específico
 * @param mes Mes (1-12)
 * @param anio Año
 * @returns Resumen de entregas
 */
export async function entregarFacturasDelMes(
  mes: number,
  anio: number
): Promise<{
  total: number;
  pdfGenerados: number;
  emailsEnviados: number;
  entregas: EntregaFactura[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      pdfGenerados: 0,
      emailsEnviados: 0,
      entregas: [],
    };
  }

  try {
    // Obtener facturas del mes (que no hayan sido entregadas)
    const facturas = await db
      .select()
      .from(facturasTable)
      .where(eq(facturasTable.estado, "pendiente"));

    // Filtrar por mes y año
    const facturasDelMes = facturas.filter((f) => {
      const fecha = new Date(f.fechaEmision);
      return fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
    });

    console.log(`[Delivery] Entregando ${facturasDelMes.length} facturas para ${mes}/${anio}`);

    const entregas: EntregaFactura[] = [];
    let pdfGenerados = 0;
    let emailsEnviados = 0;

    for (const factura of facturasDelMes) {
      const entrega = await entregarFactura(factura.id);
      entregas.push(entrega);

      if (entrega.pdfGenerado) pdfGenerados++;
      if (entrega.emailEnviado) emailsEnviados++;
    }

    // Notificar al propietario
    const mensaje = `Se han entregado ${emailsEnviados} facturas por email y ${pdfGenerados} PDFs generados para ${mes}/${anio}.`;
    await notifyOwner({
      title: "Entrega de Facturas Completada",
      content: mensaje,
    });

    console.log(`[Delivery] Entrega completada: ${pdfGenerados} PDFs, ${emailsEnviados} emails`);

    return {
      total: facturasDelMes.length,
      pdfGenerados,
      emailsEnviados,
      entregas,
    };
  } catch (error) {
    console.error("[Delivery] Error entregando facturas del mes", error);
    return {
      total: 0,
      pdfGenerados: 0,
      emailsEnviados: 0,
      entregas: [],
    };
  }
}

/**
 * Reenvía una factura por email
 * Útil para reenvíos manuales
 * @param facturaId ID de la factura
 * @returns Información del reenvío
 */
export async function reenviarFactura(facturaId: number): Promise<EntregaFactura> {
  const db = await getDb();
  if (!db) {
    return {
      facturaId,
      numeroFactura: "",
      pdfGenerado: false,
      emailEnviado: false,
      error: "Base de datos no disponible",
    };
  }

  try {
    // Obtener factura
    const factura = await db
      .select()
      .from(facturasTable)
      .where(eq(facturasTable.id, facturaId))
      .limit(1);

    if (!factura || factura.length === 0) {
      return {
        facturaId,
        numeroFactura: "",
        pdfGenerado: false,
        emailEnviado: false,
        error: "Factura no encontrada",
      };
    }

    const facturaData = factura[0];

    // Generar PDF si no existe
    console.log(`[Delivery] Reenviando factura ${facturaId}`);
    const pdfResultado = await generarPDFFactura(facturaId);

    if (!pdfResultado.exitosa) {
      return {
        facturaId,
        numeroFactura: facturaData.numeroFactura,
        pdfGenerado: false,
        emailEnviado: false,
        error: `Error generando PDF: ${pdfResultado.error}`,
      };
    }

    // Enviar email
    const emailResultado = await enviarFacturaEmail(facturaId, pdfResultado.pdfUrl);

    return {
      facturaId,
      numeroFactura: facturaData.numeroFactura,
      pdfGenerado: true,
      emailEnviado: emailResultado.exitoso,
      pdfUrl: pdfResultado.pdfUrl,
      error: emailResultado.exitoso ? undefined : emailResultado.error,
    };
  } catch (error) {
    console.error("[Delivery] Error reenviando factura", facturaId, error);
    return {
      facturaId,
      numeroFactura: "",
      pdfGenerado: false,
      emailEnviado: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
