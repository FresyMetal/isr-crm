import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  clientes,
  facturas as facturasTable,
  conceptosFactura,
  serviciosCliente,
  planes,
} from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";

/**
 * Servicio de facturación automática
 * Genera facturas mensuales para clientes activos
 */

export interface FacturaGenerada {
  clienteId: number;
  numeroFactura: string;
  total: number;
  conceptos: number;
  exitosa: boolean;
  error?: string;
}

/**
 * Genera una factura para un cliente específico
 * @param clienteId ID del cliente
 * @param mes Mes (1-12)
 * @param anio Año
 * @returns Información de la factura generada
 */
export async function generarFacturaCliente(
  clienteId: number,
  mes: number,
  anio: number
): Promise<FacturaGenerada> {
  const db = await getDb();
  if (!db) {
    return {
      clienteId,
      numeroFactura: "",
      total: 0,
      conceptos: 0,
      exitosa: false,
      error: "Base de datos no disponible",
    };
  }

  try {
    // Obtener cliente
    const cliente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, clienteId))
      .limit(1);

    if (!cliente || cliente.length === 0) {
      return {
        clienteId,
        numeroFactura: "",
        total: 0,
        conceptos: 0,
        exitosa: false,
        error: "Cliente no encontrado",
      };
    }

    // Verificar que el cliente esté activo
    if (cliente[0].estado !== "activo") {
      return {
        clienteId,
        numeroFactura: "",
        total: 0,
        conceptos: 0,
        exitosa: false,
        error: `Cliente en estado ${cliente[0].estado}, no se puede facturar`,
      };
    }

    // Obtener servicios activos del cliente
    const servicios = await db
      .select()
      .from(serviciosCliente)
      .where(
        and(
          eq(serviciosCliente.clienteId, clienteId),
          eq(serviciosCliente.activo, true)
        )
      );

    if (servicios.length === 0) {
      return {
        clienteId,
        numeroFactura: "",
        total: 0,
        conceptos: 0,
        exitosa: false,
        error: "Cliente sin servicios activos",
      };
    }

    // Calcular conceptos facturables
    let totalFactura = 0;
    const conceptos: Array<{
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      total: number;
    }> = [];

    for (const servicio of servicios) {
      // Obtener plan del servicio
      const planData = await db
        .select()
        .from(planes)
        .where(eq(planes.id, servicio.planId))
        .limit(1);

      if (planData && planData.length > 0) {
        const plan = planData[0];
        const precioMensual = Number(plan.precioMensual) || 0;

        conceptos.push({
          descripcion: `${plan.nombre} - Servicio mensual`,
          cantidad: 1,
          precioUnitario: precioMensual,
          total: precioMensual,
        });

        totalFactura += precioMensual;
      }
    }

    if (conceptos.length === 0) {
      return {
        clienteId,
        numeroFactura: "",
        total: 0,
        conceptos: 0,
        exitosa: false,
        error: "No hay conceptos facturables para este cliente",
      };
    }

    // Generar número de factura único
    const numeroFactura = generarNumeroFactura(clienteId, mes, anio);

    // Crear factura
    const fechaEmision = new Date(anio, mes - 1, 1);
    const fechaVencimiento = new Date(anio, mes, 15); // 15 días del mes siguiente
    const periodoDesde = new Date(anio, mes - 1, 1);
    const periodoHasta = new Date(anio, mes, 0); // Último día del mes

    const result = await db.insert(facturasTable).values({
      clienteId,
      numeroFactura,
      fechaEmision,
      fechaVencimiento,
      periodoDesde,
      periodoHasta,
      subtotal: String(totalFactura),
      iva: "0", // Sin IVA por defecto
      total: String(totalFactura),
      estado: "pendiente",
    });

    const facturaId = result[0]?.insertId || 0;

    // Crear conceptos de factura
    for (const concepto of conceptos) {
      await db.insert(conceptosFactura).values({
        facturaId,
        descripcion: concepto.descripcion,
        cantidad: concepto.cantidad,
        precioUnitario: String(concepto.precioUnitario),
        subtotal: String(concepto.total),
      });
    }

    return {
      clienteId,
      numeroFactura,
      total: Number(totalFactura),
      conceptos: conceptos.length,
      exitosa: true,
    };
  } catch (error) {
    console.error("[Billing] Error generando factura para cliente", clienteId, error);
    return {
      clienteId,
      numeroFactura: "",
      total: 0,
      conceptos: 0,
      exitosa: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Genera facturas para todos los clientes activos
 * @param mes Mes (1-12)
 * @param anio Año
 * @returns Resumen de facturas generadas
 */
export async function generarFacturasDelMes(
  mes: number,
  anio: number
): Promise<{
  total: number;
  exitosas: number;
  fallidas: number;
  facturas: FacturaGenerada[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      exitosas: 0,
      fallidas: 0,
      facturas: [],
    };
  }

  try {
    // Obtener todos los clientes activos
    const clientesActivos = await db
      .select()
      .from(clientes)
      .where(eq(clientes.estado, "activo"));

    console.log(`[Billing] Generando facturas para ${clientesActivos.length} clientes activos`);

    const facturas: FacturaGenerada[] = [];
    let exitosas = 0;
    let fallidas = 0;

    // Generar factura para cada cliente
    for (const cliente of clientesActivos) {
      // Verificar si ya existe factura para este mes
      const mesInicio = new Date(anio, mes - 1, 1);
      const mesFin = new Date(anio, mes, 0);
      
      const facturaExistente = await db
        .select()
        .from(facturasTable)
        .where(
          and(
            eq(facturasTable.clienteId, cliente.id),
            eq(facturasTable.estado, "pendiente")
          )
        )
        .limit(1);

      if (facturaExistente && facturaExistente.length > 0) {
        console.log(`[Billing] Factura ya existe para cliente ${cliente.id}`);
        continue;
      }

      const resultado = await generarFacturaCliente(cliente.id, mes, anio);
      facturas.push(resultado);

      if (resultado.exitosa) {
        exitosas++;
      } else {
        fallidas++;
      }
    }

    // Notificar al propietario
    const mensaje = `Se han generado ${exitosas} facturas para ${mes}/${anio}. ${fallidas > 0 ? `${fallidas} fallaron.` : ""}`;
    await notifyOwner({
      title: "Facturación Automática Completada",
      content: mensaje,
    });

    console.log(`[Billing] Facturación completada: ${exitosas} exitosas, ${fallidas} fallidas`);

    return {
      total: clientesActivos.length,
      exitosas,
      fallidas,
      facturas,
    };
  } catch (error) {
    console.error("[Billing] Error generando facturas del mes", error);
    return {
      total: 0,
      exitosas: 0,
      fallidas: 0,
      facturas: [],
    };
  }
}

/**
 * Genera un número de factura único
 * Formato: FAC-YYYYMM-XXXXX (donde XXXXX es el ID del cliente con padding)
 */
function generarNumeroFactura(clienteId: number, mes: number, anio: number): string {
  const mesStr = String(mes).padStart(2, "0");
  const clienteStr = String(clienteId).padStart(5, "0");
  return `FAC-${anio}${mesStr}-${clienteStr}`;
}

/**
 * Obtiene el próximo mes y año para facturación
 * Retorna el mes y año actual si es antes del día 15, sino el próximo mes
 */
export function obtenerProximoMesFacturacion(): { mes: number; anio: number } {
  const hoy = new Date();
  let mes = hoy.getMonth() + 1; // getMonth() retorna 0-11
  let anio = hoy.getFullYear();

  // Si estamos después del día 15, facturar para el próximo mes
  if (hoy.getDate() > 15) {
    mes++;
    if (mes > 12) {
      mes = 1;
      anio++;
    }
  }

  return { mes, anio };
}
