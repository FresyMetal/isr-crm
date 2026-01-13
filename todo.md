# ISR CRM - Lista de Tareas

## Infraestructura y Configuración
- [x] Definir esquema de base de datos completo
- [x] Configurar variables de entorno para PSO Anvimur
- [x] Implementar middleware de integración con API PSO

## Módulo de Gestión de Clientes
- [x] Tabla y modelo de clientes con datos personales
- [x] Tabla y modelo de datos contractuales
- [x] Tabla y modelo de datos técnicos (ONT, perfil velocidad)
- [x] CRUD completo de clientes
- [ ] Búsqueda y filtrado avanzado de clientes
- [ ] Historial de cambios y eventos del cliente
- [ ] Gestión de documentos del cliente

## Integración PSO Anvimur
- [x] Cliente HTTP para API REST de PSO
- [x] Función de alta de cliente (añadir_ont)
- [x] Función de baja de cliente (eliminar_ont_por_sn)
- [x] Función de modificación de cliente (modificar_ont)
- [x] Función de consulta de estado (obtener_informacion_ont_por_sn)
- [x] Función de listado de ONTs disponibles
- [ ] Sincronización automática de estados
- [ ] Sistema de reintentos y manejo de errores
- [x] Logs de operaciones PSO

## Catálogo de Planes y Servicios
- [x] Tabla de planes comerciales (fibra, móvil, TV, telefonía)
- [x] Tabla de perfiles técnicos PSO
- [x] Mapeo automático planes → perfiles PSO
- [x] CRUD de planes y servicios
- [ ] Gestión de precios y promociones
- [ ] Cambio de plan con actualización automática en PSO

## Sistema de Facturación
- [x] Tabla de facturas
- [x] Tabla de conceptos facturables
- [x] Tabla de pagos
- [ ] Generación automática de facturas mensuales
- [ ] Cálculo de importes según planes contratados
- [x] Registro de pagos y métodos de pago
- [ ] Control de morosidad
- [ ] Suspensión automática por impago
- [ ] Reactivación tras pago
- [ ] Exportación de facturas en PDF

## Módulo de Soporte Técnico
- [x] Tabla de tickets de soporte
- [x] Tabla de comentarios/seguimiento de tickets
- [x] Sistema de estados de tickets
- [x] Asignación de tickets a técnicos
- [ ] Priorización de tickets
- [x] Diagnóstico remoto: consulta estado ONT
- [x] Operación remota: reinicio de ONT
- [ ] Operación remota: reset de fábrica
- [ ] Consulta de logs desde PSO
- [ ] Base de conocimiento de soluciones
- [ ] Estadísticas de tiempo de resolución

## Dashboard y KPIs
- [ ] Dashboard principal con métricas clave
- [ ] KPI: Total de clientes activos
- [ ] KPI: Nuevos clientes del mes
- [ ] KPI: Tasa de churn (bajas)
- [ ] KPI: Ingresos mensuales
- [ ] KPI: Tickets abiertos/cerrados
- [ ] Métricas de calidad de servicio
- [ ] Estadísticas de disponibilidad de red
- [ ] Alertas de ONTs offline
- [ ] Gráficos de evolución temporal

## Gestión de Leads y Marketing
- [x] Tabla de leads/prospectos
- [ ] Tabla de oportunidades comerciales
- [x] Tabla de campañas de marketing
- [x] Seguimiento de conversiones
- [ ] Programa de referidos
- [ ] Gestión de fuentes de captación
- [ ] Embudo de ventas (funnel)

## Sistema de Reportes
- [ ] Reporte de ventas mensuales
- [ ] Reporte de captación de clientes
- [ ] Análisis de churn y motivos de baja
- [ ] Reporte de calidad de servicio
- [ ] Reporte de facturación y cobros
- [ ] Reporte de tickets de soporte
- [ ] Exportación de reportes a Excel/PDF

## Panel de Administración
- [ ] Gestión de usuarios del sistema
- [ ] Sistema de roles y permisos
- [x] Tabla de roles
- [ ] Tabla de permisos
- [ ] Asignación de roles a usuarios
- [ ] Logs de auditoría de acciones
- [ ] Configuración general del sistema

## Interfaz de Usuario
- [x] Diseño de sistema de colores y tipografía
- [x] Layout principal con navegación lateral
- [x] Página de inicio/dashboard
- [x] Página de listado de clientes
- [x] Página de detalle de cliente
- [x] Página de alta de cliente con integración PSO
- [x] Página de gestión de planes
- [x] Página de facturación
- [x] Página de tickets de soporte
- [x] Página de leads y oportunidades
- [ ] Página de reportes
- [ ] Página de administración de usuarios
- [x] Componentes reutilizables (tablas, formularios, modales)

## Testing y Calidad
- [ ] Tests unitarios de funciones PSO
- [ ] Tests de integración con API PSO
- [ ] Tests de procedimientos tRPC
- [ ] Validación de formularios
- [ ] Manejo de errores en UI

## Documentación
- [ ] Documentación de API PSO integrada
- [ ] Manual de usuario del CRM
- [ ] Guía de instalación y configuración
- [ ] Documentación técnica de arquitectura


## Facturación Automática (Nueva Funcionalidad)
- [x] Función de generación de facturas para cliente individual
- [x] Función de generación de facturas para todos los clientes activos
- [x] Cálculo automático de conceptos facturables basados en planes
- [x] Trabajo programado (cron) para generar facturas el 1º de cada mes
- [x] Notificación al propietario cuando se generen facturas
- [x] Procedimiento tRPC para generar facturas manualmente
- [x] Página de gestión de facturación automática
- [x] Tests unitarios de generación de facturas


## Facturas en PDF y Email (Nueva Funcionalidad)
- [x] Generar facturas en formato PDF profesional
- [x] Almacenar PDFs en S3
- [x] Configurar servicio de email
- [x] Enviar facturas por email automáticamente
- [x] Opción para reenviar facturas manualmente
- [x] Template de email profesional
- [x] Tests de generación de PDF
- [x] Tests de envío de email
- [x] Interfaz de usuario para entrega de facturas
- [x] Procedimientos tRPC para entrega


## Mejoras de Planes y Clientes (Nueva Solicitud)
- [x] Agregar campo número de cuenta en tabla clientes
- [x] Implementar CRUD completo de planes (crear, editar, eliminar)
- [x] Contador de clientes por plan
- [x] Asignación de plan a cliente desde ficha
- [x] Precio personalizado por cliente
- [x] Interfaz de gestión de planes mejorada
- [x] Validaciones de eliminación de planes
- [x] Tests de CRUD de planes (8 tests pasando)


## Correcciones Solicitadas (Urgente)
- [x] Verificar y corregir CRUD de planes (crear/editar no funciona) - Ruta /planes ahora usa PlanesGestion
- [x] Añadir campo editable de número de cuenta en ficha de cliente - Campo editable implementado
- [x] Cambiar autenticación de OAuth a usuario/contraseña simple - Endpoints de login creados
- [x] Crear página de login personalizado - Login.tsx creado
- [ ] Verificar que todos los formularios funcionan correctamente

## Ampliación de Campos de Cliente (Nueva Solicitud)
- [x] Añadir campos adicionales al esquema de clientes: código, domicilio fiscal, tipo cliente, tipo ID, número telefónico, envío factura auto, envío recibo/pago auto, calle1, calle2, extra1, extra2, lat/lng, medio pago, cobrador, vendedor, contrato, tipo contrato, fecha venc, gratis, recuperación, CBU, estados, bloquear, pre aviso, ter venc, prox mes, actividad comercial, tarjeta crédito, pago automático
- [x] Actualizar formulario de creación de clientes con todos los nuevos campos
- [x] Actualizar formulario de edición de clientes
- [x] Migrar base de datos con nuevos campos
- [x] Probar creación y edición de clientes con nuevos campos


## Validaciones de Datos de Cliente (Nueva Solicitud)
- [x] Crear utilidades de validación para CBU/IBAN
- [x] Crear utilidades de validación para coordenadas GPS
- [x] Crear utilidades de validación para email y teléfono
- [x] Implementar validación de código único de cliente
  - [x] Crear función de verificación en db.ts
  - [x] Implementar validación en tiempo real en formulario de creación
  - [x] Implementar validación en tiempo real en formulario de edición
  - [x] Añadir validación en procedimiento tRPC create
  - [x] Añadir validación en procedimiento tRPC update
  - [x] Probar validación con códigos duplicados
- [x] Añadir validaciones en tiempo real en formulario de creación
- [x] Añadir validaciones en tiempo real en formulario de edición
- [x] Implementar validaciones en backend (tRPC)
- [x] Mostrar mensajes de error claros al usuario
- [x] Probar todas las validaciones


## Búsqueda Avanzada de Clientes (Nueva Solicitud)
- [x] Actualizar procedimiento tRPC getAll para soportar filtros múltiples
- [x] Crear componente de filtros avanzados con UI colapsable
- [x] Implementar filtros por:
  - [x] Texto libre (nombre, email, teléfono, dirección)
  - [x] Tipo de cliente (Particular, Empresa, Autónomo)
  - [x] Estado (Activo, Bloqueado)
  - [x] Plan contratado
  - [x] Cobrador
  - [x] Vendedor
  - [x] Medio de pago
  - [x] Rango de fechas de alta
  - [x] Localidad/Provincia
- [x] Implementar lógica de combinación de filtros (AND)
- [x] Añadir botón de limpiar filtros
- [x] Mostrar contador de resultados filtrados
- [x] Integrar filtros en página de clientes
- [x] Probar combinaciones de filtros

## Gestión de Planes - Mejoras (Nueva Solicitud)
- [x] Crear script de seed con planes de ejemplo de fibra óptica
- [x] Mejorar interfaz de gestión de planes con formularios de creación
- [x] Implementar edición de planes existentes
- [x] Añadir validaciones en formularios de planes
- [x] Probar creación y edición de planes

## Cambio de Plan de Cliente (Nueva Solicitud)
- [x] Crear función de cálculo de prorrateo en backend
- [x] Implementar procedimiento tRPC para cambio de plan
- [x] Añadir historial de cambios de plan en base de datos
- [x] Crear interfaz de cambio de plan en ficha de cliente
- [x] Mostrar vista previa del prorrateo antes de confirmar
- [x] Actualizar automáticamente precio mensual del cliente
- [x] Registrar cambio en historial del cliente
- [x] Probar cálculo de prorrateo con diferentes escenarios
- [x] Escribir tests unitarios para cambio de plan

## Historial de Cambios de Plan - Visualización (Nueva Solicitud)
- [x] Crear componente de tabla de historial de cambios
- [x] Añadir pestaña "Historial de Planes" en ficha del cliente
- [x] Mostrar cambios en orden cronológico inverso
- [x] Incluir información: fecha, plan anterior, plan nuevo, ajuste de prorrateo, motivo
- [x] Probar visualización con múltiples cambios

## Bug: Menú Lateral Desaparece en Página de Planes
- [x] Identificar causa del problema en PlanesGestion.tsx
- [x] Corregir layout para usar DashboardLayout correctamente
- [x] Probar que el menú lateral funcione en todas las páginas

## Bug: Error al Iniciar Sesión (Usuario Duplicado) - RESUELTO DEFINITIVAMENTE
- [x] Identificar causa del error de inserción duplicada
- [x] Corregir lógica para buscar por openId (campo único) en lugar de email
- [x] Eliminar usuario duplicado de la base de datos
- [x] Implementar INSERT ... ON DUPLICATE KEY UPDATE para manejar race conditions
- [x] Añadir manejo de errores con try-catch
- [x] Probar múltiples inicios de sesión consecutivos (4 pruebas exitosas)
