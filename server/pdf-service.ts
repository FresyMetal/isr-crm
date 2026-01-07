import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { facturas as facturasTable, clientes, conceptosFactura } from "../drizzle/schema";
import { storagePut } from "./storage";

/**
 * Servicio de generación de facturas en PDF
 * Crea PDFs profesionales de facturas y los almacena en S3
 */

export interface FacturaPDFGenerada {
  facturaId: number;
  numeroFactura: string;
  pdfUrl: string;
  pdfKey: string;
  exitosa: boolean;
  error?: string;
}

/**
 * Genera un PDF de factura para una factura específica
 * @param facturaId ID de la factura
 * @returns Información del PDF generado
 */
export async function generarPDFFactura(facturaId: number): Promise<FacturaPDFGenerada> {
  const db = await getDb();
  if (!db) {
    return {
      facturaId,
      numeroFactura: "",
      pdfUrl: "",
      pdfKey: "",
      exitosa: false,
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
        pdfUrl: "",
        pdfKey: "",
        exitosa: false,
        error: "Factura no encontrada",
      };
    }

    const facturaData = factura[0];

    // Obtener cliente
    const cliente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, facturaData.clienteId))
      .limit(1);

    if (!cliente || cliente.length === 0) {
      return {
        facturaId,
        numeroFactura: facturaData.numeroFactura,
        pdfUrl: "",
        pdfKey: "",
        exitosa: false,
        error: "Cliente no encontrado",
      };
    }

    // Obtener conceptos de factura
    const conceptos = await db
      .select()
      .from(conceptosFactura)
      .where(eq(conceptosFactura.facturaId, facturaId));

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Colores
    const primaryColor = rgb(0.2, 0.4, 0.8); // Azul
    const textColor = rgb(0, 0, 0);
    const lightGray = rgb(0.95, 0.95, 0.95);

    // Encabezado
    page.drawText("ISR COMUNICACIONES", {
      x: 50,
      y: height - 50,
      size: 24,
      color: primaryColor,
    });

    page.drawText("FACTURA", {
      x: width - 150,
      y: height - 50,
      size: 18,
      color: textColor,
    });

    page.drawText(facturaData.numeroFactura, {
      x: width - 150,
      y: height - 75,
      size: 14,
      color: primaryColor,
    });

    // Información de la empresa
    page.drawText("Calle Principal, 123", {
      x: 50,
      y: height - 100,
      size: 10,
      color: textColor,
    });

    page.drawText("46001 Valencia, España", {
      x: 50,
      y: height - 115,
      size: 10,
      color: textColor,
    });

    page.drawText("Tel: +34 960 123 456", {
      x: 50,
      y: height - 130,
      size: 10,
      color: textColor,
    });

    // Datos de la factura
    page.drawText("Fecha de Emisión:", {
      x: 50,
      y: height - 160,
      size: 10,
      color: textColor,
    });

    page.drawText(formatDate(facturaData.fechaEmision), {
      x: 150,
      y: height - 160,
      size: 10,
      color: textColor,
    });

    page.drawText("Fecha de Vencimiento:", {
      x: 50,
      y: height - 180,
      size: 10,
      color: textColor,
    });

    page.drawText(formatDate(facturaData.fechaVencimiento), {
      x: 150,
      y: height - 180,
      size: 10,
      color: textColor,
    });

    // Datos del cliente
    page.drawText("CLIENTE:", {
      x: 50,
      y: height - 220,
      size: 11,
      color: primaryColor,
    });

    const clienteData = cliente[0];
    page.drawText(`${clienteData.nombre} ${clienteData.apellidos || ""}`, {
      x: 50,
      y: height - 240,
      size: 10,
      color: textColor,
    });

    page.drawText(clienteData.direccion, {
      x: 50,
      y: height - 255,
      size: 10,
      color: textColor,
    });

    page.drawText(`${clienteData.codigoPostal} ${clienteData.localidad}`, {
      x: 50,
      y: height - 270,
      size: 10,
      color: textColor,
    });

    if (clienteData.email) {
      page.drawText(`Email: ${clienteData.email}`, {
        x: 50,
        y: height - 285,
        size: 10,
        color: textColor,
      });
    }

    // Tabla de conceptos
    const tableTop = height - 320;
    const tableHeight = 20;
    const col1 = 50;
    const col2 = 350;
    const col3 = 450;
    const col4 = 520;

    // Encabezado de tabla
    page.drawRectangle({
      x: col1,
      y: tableTop - tableHeight,
      width: width - 100,
      height: tableHeight,
      color: primaryColor,
    });

    page.drawText("Descripción", {
      x: col1 + 5,
      y: tableTop - 15,
      size: 10,
      color: rgb(1, 1, 1),
    });

    page.drawText("Cantidad", {
      x: col2 + 5,
      y: tableTop - 15,
      size: 10,
      color: rgb(1, 1, 1),
    });

    page.drawText("Precio", {
      x: col3 + 5,
      y: tableTop - 15,
      size: 10,
      color: rgb(1, 1, 1),
    });

    page.drawText("Total", {
      x: col4 + 5,
      y: tableTop - 15,
      size: 10,
      color: rgb(1, 1, 1),
    });

    // Filas de conceptos
    let currentY = tableTop - tableHeight - 5;
    let rowIndex = 0;

    for (const concepto of conceptos) {
      // Fondo alternado
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: col1,
          y: currentY - tableHeight,
          width: width - 100,
          height: tableHeight,
          color: lightGray,
        });
      }

      page.drawText(concepto.descripcion, {
        x: col1 + 5,
        y: currentY - 12,
        size: 9,
        color: textColor,
      });

      page.drawText(concepto.cantidad.toString(), {
        x: col2 + 5,
        y: currentY - 12,
        size: 9,
        color: textColor,
      });

      page.drawText(`${Number(concepto.precioUnitario).toFixed(2)}€`, {
        x: col3 + 5,
        y: currentY - 12,
        size: 9,
        color: textColor,
      });

      page.drawText(`${Number(concepto.subtotal).toFixed(2)}€`, {
        x: col4 + 5,
        y: currentY - 12,
        size: 9,
        color: textColor,
      });

      currentY -= tableHeight;
      rowIndex++;
    }

    // Totales
    const totalsY = currentY - 30;

    page.drawText("Subtotal:", {
      x: col3,
      y: totalsY,
      size: 10,
      color: textColor,
    });

    page.drawText(`${Number(facturaData.subtotal).toFixed(2)}€`, {
      x: col4,
      y: totalsY,
      size: 10,
      color: textColor,
    });

    page.drawText("IVA (0%):", {
      x: col3,
      y: totalsY - 20,
      size: 10,
      color: textColor,
    });

    page.drawText(`${Number(facturaData.iva).toFixed(2)}€`, {
      x: col4,
      y: totalsY - 20,
      size: 10,
      color: textColor,
    });

    // Total en recuadro
    page.drawRectangle({
      x: col3 - 5,
      y: totalsY - 50,
      width: 150,
      height: 25,
      color: primaryColor,
    });

    page.drawText("TOTAL:", {
      x: col3,
      y: totalsY - 35,
      size: 12,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${Number(facturaData.total).toFixed(2)}€`, {
      x: col4,
      y: totalsY - 35,
      size: 12,
      color: rgb(1, 1, 1),
    });

    // Pie de página
    page.drawText("Gracias por su confianza. Para consultas, contacte con nuestro departamento de facturación.", {
      x: 50,
      y: 50,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText("ISR Comunicaciones - Todos los derechos reservados", {
      x: 50,
      y: 35,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Guardar PDF en buffer
    const pdfBytes = await pdfDoc.save();

    // Subir a S3
    const pdfKey = `facturas/${facturaData.clienteId}/${facturaData.numeroFactura}.pdf`;
    const { url } = await storagePut(pdfKey, Buffer.from(pdfBytes), "application/pdf");

    console.log(`[PDF] Factura ${facturaData.numeroFactura} generada exitosamente`);

    return {
      facturaId,
      numeroFactura: facturaData.numeroFactura,
      pdfUrl: url,
      pdfKey,
      exitosa: true,
    };
  } catch (error) {
    console.error("[PDF] Error generando PDF para factura", facturaId, error);
    return {
      facturaId,
      numeroFactura: "",
      pdfUrl: "",
      pdfKey: "",
      exitosa: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Genera PDFs para múltiples facturas
 * @param facturaIds Array de IDs de facturas
 * @returns Array de resultados
 */
export async function generarPDFsFacturas(facturaIds: number[]): Promise<FacturaPDFGenerada[]> {
  const resultados: FacturaPDFGenerada[] = [];

  for (const facturaId of facturaIds) {
    const resultado = await generarPDFFactura(facturaId);
    resultados.push(resultado);
  }

  return resultados;
}

/**
 * Formatea una fecha para mostrar en el PDF
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
