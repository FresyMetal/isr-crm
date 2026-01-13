/**
 * Utilidades para cálculo de prorrateo en cambios de plan
 */

/**
 * Calcula el prorrateo cuando un cliente cambia de plan
 * 
 * @param precioAnterior Precio mensual del plan anterior
 * @param precioNuevo Precio mensual del nuevo plan
 * @param fechaUltimaFactura Fecha de la última facturación (inicio del período)
 * @param fechaCambio Fecha en que se realiza el cambio
 * @returns Objeto con detalles del cálculo de prorrateo
 */
export function calcularProrrateo(
  precioAnterior: number,
  precioNuevo: number,
  fechaUltimaFactura: Date,
  fechaCambio: Date = new Date()
): {
  diasTranscurridos: number;
  diasRestantes: number;
  diasTotalesMes: number;
  importeConsumido: number;
  importeRestante: number;
  ajusteProrrateo: number;
  descripcion: string;
} {
  // Calcular días del mes actual
  const inicioMes = new Date(fechaUltimaFactura);
  const finMes = new Date(inicioMes);
  finMes.setMonth(finMes.getMonth() + 1);
  
  const diasTotalesMes = Math.ceil((finMes.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calcular días transcurridos y restantes
  const diasTranscurridos = Math.ceil((fechaCambio.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24));
  const diasRestantes = diasTotalesMes - diasTranscurridos;
  
  // Calcular importes proporcionales
  const precioDiarioAnterior = precioAnterior / diasTotalesMes;
  const precioDiarioNuevo = precioNuevo / diasTotalesMes;
  
  const importeConsumido = precioDiarioAnterior * diasTranscurridos;
  const importeRestante = precioDiarioAnterior * diasRestantes;
  
  // Calcular ajuste de prorrateo
  // Positivo = cliente debe pagar más (upgrade)
  // Negativo = cliente tiene crédito a favor (downgrade)
  const diferenciaDiaria = precioDiarioNuevo - precioDiarioAnterior;
  const ajusteProrrateo = diferenciaDiaria * diasRestantes;
  
  // Generar descripción
  let descripcion = "";
  if (ajusteProrrateo > 0) {
    descripcion = `Upgrade: Se cobrará un ajuste de €${ajusteProrrateo.toFixed(2)} por los ${diasRestantes} días restantes del período actual.`;
  } else if (ajusteProrrateo < 0) {
    descripcion = `Downgrade: Se aplicará un crédito de €${Math.abs(ajusteProrrateo).toFixed(2)} a favor del cliente por los ${diasRestantes} días restantes.`;
  } else {
    descripcion = `Cambio sin diferencia de precio. No hay ajuste de prorrateo.`;
  }
  
  return {
    diasTranscurridos,
    diasRestantes,
    diasTotalesMes,
    importeConsumido: parseFloat(importeConsumido.toFixed(2)),
    importeRestante: parseFloat(importeRestante.toFixed(2)),
    ajusteProrrateo: parseFloat(ajusteProrrateo.toFixed(2)),
    descripcion,
  };
}

/**
 * Calcula la próxima fecha de facturación basada en la última factura
 */
export function calcularProximaFacturacion(fechaUltimaFactura: Date): Date {
  const proximaFactura = new Date(fechaUltimaFactura);
  proximaFactura.setMonth(proximaFactura.getMonth() + 1);
  return proximaFactura;
}

/**
 * Valida si una fecha de cambio es válida (no puede ser anterior a la última facturación)
 */
export function validarFechaCambio(fechaUltimaFactura: Date, fechaCambio: Date): {
  valida: boolean;
  error?: string;
} {
  if (fechaCambio < fechaUltimaFactura) {
    return {
      valida: false,
      error: "La fecha de cambio no puede ser anterior a la última facturación",
    };
  }
  
  const proximaFactura = calcularProximaFacturacion(fechaUltimaFactura);
  if (fechaCambio >= proximaFactura) {
    return {
      valida: false,
      error: "La fecha de cambio debe estar dentro del período de facturación actual",
    };
  }
  
  return { valida: true };
}
