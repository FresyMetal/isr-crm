import nodemailer from "nodemailer";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { clientes, facturas as facturasTable } from "../drizzle/schema";

/**
 * Servicio de envío de emails para facturas
 * Envía facturas por correo electrónico a los clientes
 */

export interface EmailEnviado {
  clienteId: number;
  clienteEmail: string;
  numeroFactura: string;
  exitoso: boolean;
  error?: string;
}

// Configuración del transportador de email
// Usar variables de entorno para credenciales
let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializa el transporte de email
 * Usa configuración de variables de entorno
 */
function initializeTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Usar configuración por defecto para desarrollo
  // En producción, configurar variables de entorno:
  // EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "localhost",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true para 465, false para otros puertos
    auth: process.env.EMAIL_USER
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      : undefined,
  });

  return transporter;
}

/**
 * Envía una factura por email a un cliente
 * @param facturaId ID de la factura
 * @param pdfUrl URL del PDF de la factura
 * @returns Información del envío
 */
export async function enviarFacturaEmail(
  facturaId: number,
  pdfUrl: string
): Promise<EmailEnviado> {
  const db = await getDb();
  if (!db) {
    return {
      clienteId: 0,
      clienteEmail: "",
      numeroFactura: "",
      exitoso: false,
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
        clienteId: 0,
        clienteEmail: "",
        numeroFactura: "",
        exitoso: false,
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
        clienteId: facturaData.clienteId,
        clienteEmail: "",
        numeroFactura: facturaData.numeroFactura,
        exitoso: false,
        error: "Cliente no encontrado",
      };
    }

    const clienteData = cliente[0];

    // Verificar que el cliente tenga email
    if (!clienteData.email) {
      return {
        clienteId: facturaData.clienteId,
        clienteEmail: "",
        numeroFactura: facturaData.numeroFactura,
        exitoso: false,
        error: "Cliente sin email",
      };
    }

    // Inicializar transporte
    const mail = initializeTransporter();

    // Crear contenido del email
    const asunto = `Factura ${facturaData.numeroFactura} - ISR Comunicaciones`;
    const html = generarHTMLEmail(clienteData.nombre, facturaData.numeroFactura, facturaData.total);

    // Enviar email
    await mail.sendMail({
      from: process.env.EMAIL_FROM || "noreply@isrcomunicaciones.es",
      to: clienteData.email,
      subject: asunto,
      html,
      attachments: [
        {
          filename: `${facturaData.numeroFactura}.pdf`,
          path: pdfUrl,
        },
      ],
    });

    console.log(`[Email] Factura ${facturaData.numeroFactura} enviada a ${clienteData.email}`);

    return {
      clienteId: facturaData.clienteId,
      clienteEmail: clienteData.email,
      numeroFactura: facturaData.numeroFactura,
      exitoso: true,
    };
  } catch (error) {
    console.error("[Email] Error enviando factura", facturaId, error);
    return {
      clienteId: 0,
      clienteEmail: "",
      numeroFactura: "",
      exitoso: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Envía facturas por email a múltiples clientes
 * @param facturaIds Array de IDs de facturas
 * @param pdfUrls Map de facturaId -> pdfUrl
 * @returns Array de resultados
 */
export async function enviarFacturasEmail(
  facturaIds: number[],
  pdfUrls: Map<number, string>
): Promise<EmailEnviado[]> {
  const resultados: EmailEnviado[] = [];

  for (const facturaId of facturaIds) {
    const pdfUrl = pdfUrls.get(facturaId);
    if (!pdfUrl) {
      resultados.push({
        clienteId: 0,
        clienteEmail: "",
        numeroFactura: "",
        exitoso: false,
        error: "PDF URL no disponible",
      });
      continue;
    }

    const resultado = await enviarFacturaEmail(facturaId, pdfUrl);
    resultados.push(resultado);
  }

  return resultados;
}

/**
 * Genera el contenido HTML del email
 */
function generarHTMLEmail(nombreCliente: string, numeroFactura: string, total: string | number): string {
  const totalFormato = typeof total === "string" ? total : Number(total).toFixed(2);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      background-color: #3366cc;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 0 0 5px 5px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      color: #3366cc;
      font-size: 16px;
      border-bottom: 2px solid #3366cc;
      padding-bottom: 10px;
    }
    .invoice-details {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .detail-label {
      font-weight: bold;
      color: #555;
    }
    .detail-value {
      color: #333;
    }
    .total-amount {
      font-size: 18px;
      font-weight: bold;
      color: #3366cc;
    }
    .button {
      display: inline-block;
      background-color: #3366cc;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 10px;
    }
    .footer {
      background-color: #f0f0f0;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 5px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ISR COMUNICACIONES</h1>
      <p>Tu factura está lista</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Hola ${nombreCliente},</h2>
        <p>Te adjuntamos tu factura. Puedes descargarla desde este email o acceder a tu cuenta en nuestro portal.</p>
      </div>

      <div class="invoice-details">
        <div class="detail-row">
          <span class="detail-label">Número de Factura:</span>
          <span class="detail-value">${numeroFactura}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha de Emisión:</span>
          <span class="detail-value">${new Date().toLocaleDateString("es-ES")}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Importe Total:</span>
          <span class="detail-value total-amount">${totalFormato}€</span>
        </div>
      </div>

      <div class="section">
        <h2>Métodos de Pago</h2>
        <p>Puedes pagar tu factura de las siguientes formas:</p>
        <ul>
          <li>Transferencia bancaria</li>
          <li>Domiciliación bancaria</li>
          <li>Tarjeta de crédito/débito</li>
          <li>Portal online de ISR Comunicaciones</li>
        </ul>
      </div>

      <div class="section">
        <h2>¿Necesitas Ayuda?</h2>
        <p>Si tienes dudas sobre tu factura o necesitas más información, no dudes en contactarnos:</p>
        <ul>
          <li>Email: facturacion@isrcomunicaciones.es</li>
          <li>Teléfono: +34 960 123 456</li>
          <li>Portal: www.isrcomunicaciones.es</li>
        </ul>
      </div>

      <div class="footer">
        <p>Este es un email automático. Por favor, no respondas a este mensaje.</p>
        <p>ISR Comunicaciones © 2024. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Verifica la configuración de email
 */
export async function verificarConfiguracionEmail(): Promise<boolean> {
  try {
    const mail = initializeTransporter();
    await mail.verify();
    console.log("[Email] Configuración verificada correctamente");
    return true;
  } catch (error) {
    console.error("[Email] Error verificando configuración:", error);
    return false;
  }
}
