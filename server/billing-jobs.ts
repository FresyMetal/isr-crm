import { generarFacturasDelMes, obtenerProximoMesFacturacion } from "./billing-service";

/**
 * Trabajos programados para facturación automática
 * Se ejecutan según el cron schedule definido
 */

/**
 * Ejecuta la generación de facturas del mes
 * Se ejecuta automáticamente el 1º de cada mes a las 02:00 AM
 */
export async function ejecutarFacturacionMensual(): Promise<void> {
  try {
    console.log("[Billing Jobs] Iniciando generación automática de facturas...");

    const { mes, anio } = obtenerProximoMesFacturacion();

    console.log(`[Billing Jobs] Generando facturas para ${mes}/${anio}`);

    const resultado = await generarFacturasDelMes(mes, anio);

    console.log(
      `[Billing Jobs] Facturación completada: ${resultado.exitosas} exitosas, ${resultado.fallidas} fallidas`
    );

    if (resultado.fallidas > 0) {
      console.warn(
        `[Billing Jobs] ${resultado.fallidas} facturas fallaron. Revisar logs para más detalles.`
      );
    }
  } catch (error) {
    console.error("[Billing Jobs] Error en facturación automática:", error);
    throw error;
  }
}

/**
 * Ejecuta la generación de facturas para un mes específico
 * Útil para facturación manual o retroactiva
 */
export async function ejecutarFacturacionManual(
  mes: number,
  anio: number
): Promise<void> {
  try {
    if (mes < 1 || mes > 12) {
      throw new Error("Mes inválido. Debe estar entre 1 y 12");
    }

    console.log(`[Billing Jobs] Generando facturas manualmente para ${mes}/${anio}`);

    const resultado = await generarFacturasDelMes(mes, anio);

    console.log(
      `[Billing Jobs] Facturación completada: ${resultado.exitosas} exitosas, ${resultado.fallidas} fallidas`
    );
  } catch (error) {
    console.error("[Billing Jobs] Error en facturación manual:", error);
    throw error;
  }
}
