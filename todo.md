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
