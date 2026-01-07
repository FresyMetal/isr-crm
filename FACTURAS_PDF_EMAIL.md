# Sistema de Generación de Facturas en PDF y Envío por Email

## Descripción General

El sistema automatiza la generación de facturas en formato PDF profesional y su envío por correo electrónico a los clientes. Esto mejora significativamente la experiencia del cliente y reduce la carga administrativa.

## Características Principales

### 1. Generación de Facturas en PDF
- **Formato profesional**: Diseño limpio y corporativo
- **Información completa**: Datos de empresa, cliente, servicios y totales
- **Automático**: Se genera al crear o entregar una factura
- **Almacenamiento en S3**: Los PDFs se guardan en la nube para acceso permanente

### 2. Envío Automático de Emails
- **Personalizado**: Cada email incluye nombre del cliente
- **Adjunto**: PDF de la factura incluido directamente
- **Template profesional**: HTML responsivo y bien formateado
- **Información de contacto**: Datos para consultas y soporte

### 3. Reenvío Manual
- **Interfaz amigable**: Opción para reenviar facturas desde el CRM
- **Sin duplicados**: Verifica que la factura exista
- **Auditoría**: Registra todos los envíos

### 4. Integración Completa
- **Con facturación automática**: Se envían automáticamente al generarse
- **Con gestión de clientes**: Usa datos del cliente para emails
- **Con planes**: Incluye detalles de servicios en el PDF

## Arquitectura Técnica

### Archivos Principales

#### `server/pdf-service.ts`
Servicio de generación de PDFs:

```typescript
// Generar PDF para una factura
export async function generarPDFFactura(facturaId: number): Promise<FacturaPDFGenerada>

// Generar PDFs para múltiples facturas
export async function generarPDFsFacturas(facturaIds: number[]): Promise<FacturaPDFGenerada[]>
```

**Características:**
- Usa librería `pdf-lib` para crear PDFs
- Genera diseño profesional con colores corporativos
- Incluye tabla de conceptos con totales
- Almacena en S3 con clave única por cliente

#### `server/email-service.ts`
Servicio de envío de emails:

```typescript
// Enviar factura por email
export async function enviarFacturaEmail(facturaId: number, pdfUrl: string): Promise<EmailEnviado>

// Enviar múltiples facturas
export async function enviarFacturasEmail(facturaIds: number[], pdfUrls: Map<number, string>): Promise<EmailEnviado[]>

// Verificar configuración
export async function verificarConfiguracionEmail(): Promise<boolean>
```

**Características:**
- Usa `nodemailer` para SMTP
- Template HTML responsivo
- Adjunta PDF desde S3
- Manejo de errores robusto

#### `server/invoice-delivery-service.ts`
Servicio integrado de entrega:

```typescript
// Generar PDF y enviar email
export async function entregarFactura(facturaId: number): Promise<EntregaFactura>

// Entregar facturas de un mes
export async function entregarFacturasDelMes(mes: number, anio: number): Promise<{...}>

// Reenviar factura
export async function reenviarFactura(facturaId: number): Promise<EntregaFactura>
```

#### `server/invoice-delivery-router.ts`
Procedimientos tRPC:

```typescript
// Entregar una factura (admin)
invoiceDelivery.entregarFactura({ facturaId })

// Entregar facturas del mes (admin)
invoiceDelivery.entregarFacturasDelMes({ mes, anio })

// Reenviar factura (protegido)
invoiceDelivery.reenviarFactura({ facturaId })
```

#### `client/src/pages/EntregaFacturas.tsx`
Interfaz de usuario para gestionar entrega de facturas

### Flujo de Datos

```
1. Usuario selecciona mes/año en interfaz
   ↓
2. Se obtienen todas las facturas del período
   ↓
3. Para cada factura:
   - Se genera PDF con datos de cliente y servicios
   - PDF se sube a S3
   - Se obtiene URL del PDF
   - Se envía email con PDF adjunto
   ↓
4. Se registra resultado de cada entrega
   ↓
5. Se notifica al propietario con resumen
   ↓
6. Se retorna estadísticas al usuario
```

## Configuración

### Variables de Entorno

Para que el envío de emails funcione, configura en tu servidor:

```bash
# Configuración SMTP
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_PORT=587
EMAIL_SECURE=false  # true para puerto 465, false para 587
EMAIL_USER=tu-email@ejemplo.com
EMAIL_PASSWORD=tu-contraseña-app
EMAIL_FROM=noreply@isrcomunicaciones.es
```

### Proveedores Recomendados

**Gmail:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=contraseña-app-específica
```

**SendGrid:**
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.tu-api-key
```

**AWS SES:**
```
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=usuario-SMTP
EMAIL_PASSWORD=contraseña-SMTP
```

### Almacenamiento S3

Los PDFs se guardan automáticamente en S3 con la estructura:
```
facturas/{clienteId}/{numeroFactura}.pdf
```

La URL se retorna y se usa para adjuntar en el email.

## Modelo de Datos

### Tabla: facturas
```sql
- id: int (PK)
- clienteId: int (FK)
- numeroFactura: varchar (único)
- fechaEmision: timestamp
- fechaVencimiento: timestamp
- periodoDesde: timestamp
- periodoHasta: timestamp
- subtotal: decimal
- iva: decimal
- total: decimal
- estado: enum ['pendiente', 'pagada', 'vencida', 'anulada']
```

### Tabla: conceptos_factura
```sql
- id: int (PK)
- facturaId: int (FK)
- descripcion: varchar
- cantidad: int
- precioUnitario: decimal
- subtotal: decimal
```

## Uso

### Entrega Automática
Las facturas se entregan automáticamente cuando se generan (si están configuradas las variables de email).

### Entrega Manual
1. Acceder a "Entrega de Facturas" en el CRM
2. Seleccionar mes y año
3. Hacer clic en "Generar PDFs y Enviar"
4. Se mostrará progreso y resultado

### Reenvío de Factura
Desde la página de detalle de factura, hacer clic en "Reenviar por Email" para reenviar una factura existente.

## Validaciones

### Validaciones de Entrada
- Mes debe estar entre 1 y 12
- Año debe ser mayor a 2000
- Cliente debe tener email
- Factura debe existir

### Validaciones de Envío
- Se verifica que el email sea válido
- Se verifica que el PDF se generó correctamente
- Se evita enviar emails a clientes sin email

### Manejo de Errores
- Si falla la generación del PDF, se registra el error
- Si falla el envío de email, se continúa (al menos el PDF se generó)
- Se notifica al propietario de cualquier error

## Logs y Monitoreo

### Logs Disponibles
```
[PDF] Factura XXX generada exitosamente
[Email] Factura XXX enviada a cliente@email.com
[Delivery] Entregando X facturas para M/YYYY
[Delivery] Entrega completada: X PDFs, Y emails
```

### Métricas Importantes
- Número de PDFs generados
- Número de emails enviados
- Tasa de éxito
- Errores durante la entrega

## Testing

### Tests Unitarios
Se incluyen tests para validar:
- Generación de PDFs
- Envío de emails
- Entrega completa de facturas
- Manejo de errores
- Validaciones de entrada

Ejecutar tests:
```bash
pnpm test invoice-delivery.test.ts
```

### Verificación Manual
1. Crear una factura de prueba
2. Acceder a "Entrega de Facturas"
3. Generar y enviar
4. Verificar que se reciba el email

## Troubleshooting

### Los emails no se envían
1. Verificar variables de entorno configuradas
2. Verificar credenciales SMTP
3. Revisar logs del servidor
4. Verificar que el cliente tenga email

### Los PDFs no se generan
1. Verificar que S3 esté configurado
2. Verificar que la factura exista
3. Revisar logs de errores
4. Verificar permisos de S3

### Emails van a spam
1. Configurar SPF/DKIM en el dominio
2. Usar dominio propio en EMAIL_FROM
3. Usar proveedor de email confiable
4. Incluir enlace de unsubscribe

## Roadmap Futuro

- [ ] Plantillas de email personalizables
- [ ] Envío programado de emails
- [ ] Seguimiento de entregas (abierto, descargado)
- [ ] Recordatorios automáticos de pago
- [ ] Facturas en otros idiomas
- [ ] Facturas con código QR de pago
- [ ] Integración con sistemas de pago
- [ ] Historial de entregas

## Contacto y Soporte
Para reportar problemas o sugerencias sobre el sistema de PDF y email, contactar al equipo de desarrollo.
