# Sistema de Facturación Automática - ISR CRM

## Descripción General

El sistema de facturación automática genera facturas mensuales de forma automática para todos los clientes activos del CRM. Esto automatiza completamente el proceso de facturación, eliminando la necesidad de generar facturas manualmente cada mes.

## Características Principales

### 1. Generación Automática Mensual
- Se ejecuta automáticamente el **1º de cada mes a las 02:00 AM**
- Genera facturas para todos los clientes en estado "activo"
- Evita duplicar facturas para el mismo mes
- Notifica al propietario cuando se completa

### 2. Cálculo Automático de Conceptos
- Obtiene todos los servicios activos del cliente
- Para cada servicio, busca el plan asociado
- Crea un concepto de factura por cada servicio
- Calcula el total basándose en los precios mensuales de los planes

### 3. Generación Manual
- Interfaz para generar facturas manualmente para cualquier mes
- Útil para facturación retroactiva o correcciones
- Solo disponible para administradores

### 4. Auditoría y Logs
- Registra todas las operaciones de facturación
- Logs detallados de éxitos y errores
- Notificaciones al propietario con resumen de resultados

## Arquitectura Técnica

### Archivos Principales

#### `server/billing-service.ts`
Servicio principal que contiene la lógica de facturación:

```typescript
// Generar factura para un cliente específico
export async function generarFacturaCliente(
  clienteId: number,
  mes: number,
  anio: number
): Promise<FacturaGenerada>

// Generar facturas para todos los clientes activos
export async function generarFacturasDelMes(
  mes: number,
  anio: number
): Promise<{...}>

// Obtener próximo mes para facturación
export function obtenerProximoMesFacturacion(): { mes: number; anio: number }
```

#### `server/billing-jobs.ts`
Trabajos programados para ejecución automática:

```typescript
// Ejecuta facturación automática mensual
export async function ejecutarFacturacionMensual(): Promise<void>

// Ejecuta facturación manual para un mes específico
export async function ejecutarFacturacionManual(mes: number, anio: number): Promise<void>
```

#### `server/routers.ts`
Procedimientos tRPC para la API:

```typescript
// Generar facturas para un mes (solo admin)
facturas.generarFacturas({ mes, anio })

// Generar factura para un cliente (solo admin)
facturas.generarFacturaCliente({ clienteId, mes, anio })

// Obtener próximo mes de facturación
facturas.obtenerProximoMes()
```

#### `client/src/pages/Facturacion.tsx`
Interfaz de usuario para gestionar la facturación automática

### Flujo de Datos

```
1. Se ejecuta trabajo programado (cron) o se llama procedimiento tRPC
   ↓
2. Se obtienen todos los clientes activos
   ↓
3. Para cada cliente:
   - Se obtienen sus servicios activos
   - Se obtiene el plan de cada servicio
   - Se calcula el total basándose en precios mensuales
   - Se crea la factura con estado "pendiente"
   - Se crean conceptos de factura por cada servicio
   ↓
4. Se notifica al propietario con resumen
   ↓
5. Se retorna resultado con estadísticas
```

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
- fechaPago: timestamp (nullable)
- metodoPago: varchar (nullable)
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

## Configuración

### Variables de Entorno
No se requieren variables de entorno adicionales. El sistema usa las credenciales de base de datos existentes.

### Cron Schedule
El trabajo se ejecuta automáticamente con la siguiente configuración:
- **Expresión Cron**: `0 2 1 * * *` (1º de cada mes a las 02:00 AM)
- **Zona horaria**: UTC

Para cambiar el horario, actualizar la configuración del scheduler en `server/_core/index.ts`

## Uso

### Generación Automática
El sistema genera facturas automáticamente cada mes. No se requiere intervención manual.

### Generación Manual
1. Acceder a la sección "Facturación" en el CRM
2. Seleccionar mes y año
3. Hacer clic en "Generar Facturas"
4. Se mostrará un resumen con el número de facturas generadas

### Generación del Próximo Mes
1. Acceder a la sección "Facturación"
2. Hacer clic en "Generar Próximo Mes"
3. El sistema calcula automáticamente el próximo mes de facturación

## Validaciones

### Validaciones de Entrada
- Mes debe estar entre 1 y 12
- Año debe ser mayor a 2000
- Cliente debe estar en estado "activo"
- Cliente debe tener servicios activos

### Validaciones de Duplicados
- Se verifica si ya existe factura para el cliente en ese mes
- Se evita crear facturas duplicadas

### Validaciones de Datos
- Se verifica que el cliente exista
- Se verifica que los planes existan
- Se verifica que los precios sean válidos

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Cliente no encontrado" | El cliente no existe | Verificar ID del cliente |
| "Cliente sin servicios activos" | El cliente no tiene servicios | Añadir servicios al cliente |
| "No hay conceptos facturables" | Los planes no tienen precio | Configurar precios en planes |
| "Base de datos no disponible" | Error de conexión BD | Verificar conexión a BD |

### Logs
Todos los errores se registran en los logs del servidor con el prefijo `[Billing]`

## Notificaciones

### Notificación al Propietario
Se envía una notificación cuando se completa la facturación con:
- Número de facturas generadas
- Número de facturas fallidas
- Período de facturación

### Formato de Notificación
```
Título: "Facturación Automática Completada"
Contenido: "Se han generado X facturas para M/YYYY. Y fallaron."
```

## Testing

### Tests Unitarios
Se incluyen tests para validar:
- Cálculo del próximo mes de facturación
- Generación de facturas para cliente individual
- Generación de facturas para todos los clientes
- Validaciones de entrada
- Estructura de resultados

Ejecutar tests:
```bash
pnpm test billing-service.test.ts
```

## Monitoreo

### Métricas Importantes
- Número de facturas generadas por mes
- Tasa de éxito de generación
- Tiempo de ejecución
- Errores durante la facturación

### Alertas Recomendadas
- Facturación fallida (0 facturas generadas)
- Tasa de error > 10%
- Ejecución tardía (después de 03:00 AM)

## Roadmap Futuro

- [ ] Generación de facturas en PDF automáticamente
- [ ] Envío de facturas por email a clientes
- [ ] Configuración de IVA por cliente
- [ ] Descuentos y promociones automáticas
- [ ] Facturación por períodos personalizados
- [ ] Integración con sistemas de pago
- [ ] Reportes de facturación avanzados

## Troubleshooting

### Las facturas no se generan automáticamente
1. Verificar que el scheduler esté activo
2. Revisar logs del servidor
3. Verificar que haya clientes activos
4. Verificar que los clientes tengan servicios activos

### Las facturas no tienen conceptos
1. Verificar que los servicios tengan planes asignados
2. Verificar que los planes tengan precios configurados
3. Revisar logs de errores

### No se reciben notificaciones
1. Verificar que el propietario esté configurado
2. Verificar que el servicio de notificaciones esté activo
3. Revisar logs de notificaciones

## Contacto y Soporte
Para reportar problemas o sugerencias sobre el sistema de facturación automática, contactar al equipo de desarrollo.
