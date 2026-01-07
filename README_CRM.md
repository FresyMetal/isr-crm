# ISR CRM - Sistema de Gestión de Clientes

Sistema CRM integral para ISR Comunicaciones con integración completa a PSO Anvimur para gestión de red GPON.

## 📋 Características Principales

### ✅ Módulo de Gestión de Clientes
- **CRUD completo** de clientes con datos personales, contractuales y técnicos
- **Integración automática con PSO Anvimur** para alta, baja y modificación de servicios
- **Gestión de estados**: activo, suspendido, baja, pendiente instalación
- **Historial de actividad** completo de cada cliente
- **Búsqueda y filtrado** avanzado

### ✅ Integración PSO Anvimur
- **Cliente HTTP completo** para API REST de PSO System v5
- **Operaciones soportadas**:
  - Alta de ONT (añadir_ont)
  - Baja de ONT (eliminar_ont_por_sn)
  - Modificación de ONT (modificar_ont)
  - Consulta de información (obtener_informacion_ont_por_sn)
  - Reinicio remoto de ONT
  - Gestión de perfiles de velocidad y usuario
- **Sistema de logs** y auditoría de todas las operaciones PSO
- **Manejo robusto de errores** con reintentos automáticos

### ✅ Catálogo de Planes y Servicios
- Gestión de planes de **fibra, móvil, TV, telefonía fija y combos**
- **Mapeo automático** de planes comerciales a perfiles técnicos PSO
- Precios regulares y promocionales
- Planes destacados

### ✅ Sistema de Facturación
- Generación de facturas con conceptos detallados
- **Registro de pagos** con múltiples métodos
- Control de estados: pendiente, pagada, vencida
- Historial de facturación por cliente

### ✅ Módulo de Soporte Técnico
- **Sistema de tickets** con prioridades y estados
- Tipos de incidencia: avería, consulta, instalación, cambio de servicio, baja
- **Operaciones remotas desde tickets**:
  - Reinicio de ONT
  - Consulta de estado
  - Reset de fábrica
- Comentarios y seguimiento de tickets
- Estadísticas de tiempo de resolución

### ✅ Gestión de Leads y Marketing
- Pipeline comercial completo
- Estados: nuevo, contactado, calificado, propuesta, ganado, perdido
- Nivel de interés: bajo, medio, alto
- Conversión automática de lead a cliente
- Seguimiento de campañas

### ✅ Dashboard y KPIs
- **Métricas en tiempo real**:
  - Total de clientes y clientes activos
  - Tickets abiertos
  - Facturas vencidas
  - Leads nuevos
- **Gráficos de evolución**:
  - Nuevos clientes por mes
  - Ingresos mensuales
- Acciones rápidas para funciones comunes

## 🏗️ Arquitectura Técnica

### Backend
- **Node.js 22** + **Express 4**
- **tRPC 11** para comunicación type-safe cliente-servidor
- **MySQL/TiDB** con **Drizzle ORM**
- **Autenticación** con Manus OAuth
- **Sistema de roles**: admin, user, tecnico, comercial

### Frontend
- **React 19** + **TypeScript**
- **TailwindCSS 4** para estilos
- **shadcn/ui** para componentes
- **Wouter** para enrutamiento
- **TanStack Query** para gestión de estado

### Base de Datos
13 tablas principales:
- `users` - Usuarios del sistema
- `clientes` - Información de clientes
- `planes` - Catálogo de servicios
- `servicios_cliente` - Servicios contratados
- `facturas` - Facturación
- `conceptos_factura` - Líneas de factura
- `pagos` - Registro de pagos
- `tickets` - Tickets de soporte
- `comentarios_ticket` - Seguimiento de tickets
- `leads` - Prospectos comerciales
- `campanas` - Campañas de marketing
- `logs_pso` - Auditoría de operaciones PSO
- `actividad_cliente` - Historial de eventos

## 🚀 Configuración e Instalación

### Requisitos Previos
- Node.js 22+
- MySQL 8+ o TiDB
- Acceso a red local donde está PSO Anvimur

### Variables de Entorno Requeridas

Las siguientes variables ya están configuradas por el sistema:
```bash
# Base de datos (automático)
DATABASE_URL=mysql://...

# Autenticación (automático)
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
```

**Variables que debes configurar** (ya proporcionadas):
```bash
# PSO Anvimur - Configuradas
PSO_BASE_URL=http://tu-servidor-pso-local/api
PSO_USERNAME=tu_usuario
PSO_PASSWORD=tu_contraseña
PSO_TIMEOUT=30000
```

### Instalación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Aplicar migraciones de base de datos
pnpm db:push

# 3. Iniciar en desarrollo
pnpm dev

# 4. Iniciar en producción
pnpm build
pnpm start
```

### Acceso Inicial

1. Accede a la URL del CRM
2. Inicia sesión con tu cuenta de Manus
3. El primer usuario que inicie sesión será automáticamente **administrador**

## 📡 Integración con PSO Anvimur

### Configuración de Red

**IMPORTANTE**: El sistema PSO Anvimur debe ser accesible desde donde se despliegue el CRM.

- **En desarrollo local**: Asegúrate de que la URL PSO_BASE_URL apunte a tu servidor local
- **En producción**: Despliega el CRM en un servidor dentro de tu red local con acceso a PSO

### Flujo de Alta de Cliente

1. Usuario completa formulario de nuevo cliente
2. Selecciona plan comercial
3. Introduce datos técnicos (SN ONT, OLT, PON)
4. Marca opción "Activar en PSO"
5. **El sistema automáticamente**:
   - Crea el cliente en la base de datos
   - Llama a PSO para añadir la ONT
   - Mapea el plan comercial al perfil técnico PSO
   - Registra la operación en logs
   - Actualiza el estado del cliente

### Operaciones Disponibles

```typescript
// Ejemplos de uso del cliente PSO
import { getPSOClient } from './server/pso-client';

const pso = getPSOClient();

// Alta de ONT
await pso.agregarONT({
  sn: 'HWTC12345678',
  perfilVelocidad: '600M',
  perfilUsuario: 'residencial',
  olt: 'OLT-GILET-01',
  pon: '0/1/1',
  descripcion: 'Juan Pérez'
}, clienteId, usuarioId);

// Reinicio remoto
await pso.reiniciarONT('HWTC12345678', clienteId, usuarioId);

// Consulta de estado
const info = await pso.obtenerInfoONT('HWTC12345678', clienteId);
```

## 🔐 Sistema de Roles y Permisos

### Roles Disponibles

- **admin**: Acceso completo al sistema
- **user**: Usuario estándar con acceso a funciones básicas
- **tecnico**: Acceso a tickets y operaciones técnicas
- **comercial**: Acceso a leads y gestión comercial

### Asignación de Roles

Los roles se asignan automáticamente:
- El **propietario del proyecto** es automáticamente **admin**
- Nuevos usuarios son **user** por defecto
- Los administradores pueden cambiar roles desde la base de datos

## 📊 Uso del Sistema

### Dar de Alta un Cliente

1. **Dashboard** → **Nuevo Cliente**
2. Completa datos personales (nombre, DNI, email, teléfono)
3. Introduce dirección de instalación
4. Selecciona plan contratado
5. **Datos técnicos GPON**:
   - Número de serie ONT
   - Modelo ONT
   - OLT y PON donde se conectará
6. Marca "Activar en PSO" si deseas alta automática
7. Guardar

### Gestionar un Ticket

1. **Tickets** → Ver ticket
2. Añadir comentarios de seguimiento
3. Cambiar estado según progreso
4. **Operaciones remotas**:
   - Reiniciar ONT desde el ticket
   - Consultar estado de conexión
5. Cerrar ticket cuando esté resuelto

### Suspender un Cliente

1. **Clientes** → Seleccionar cliente
2. Botón **Suspender**
3. Introducir motivo (impago, solicitud cliente, etc.)
4. Confirmar
5. **El sistema automáticamente**:
   - Cambia estado en base de datos
   - Modifica perfil en PSO a "suspendido"
   - Registra la acción

### Reactivar un Cliente

1. **Clientes** → Cliente suspendido
2. Botón **Reactivar**
3. **El sistema automáticamente**:
   - Restaura estado activo
   - Restablece perfil original en PSO
   - Registra la reactivación

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests en modo watch
pnpm test --watch

# Tests con cobertura
pnpm test --coverage
```

### Tests Implementados

- ✅ Test de autenticación (logout)
- ✅ Test de integración PSO (skip en entornos sin acceso)

**Nota**: El test de PSO está marcado como `skip` porque requiere acceso a la red local donde está el servidor PSO.

## 📦 Despliegue en Producción

### Opción 1: Despliegue en Manus (Recomendado)

1. Crea un checkpoint desde el CRM
2. Haz clic en **Publish** en la interfaz de Manus
3. Tu CRM estará disponible en `https://tu-dominio.manus.space`

**⚠️ Limitación**: La integración PSO no funcionará en Manus Cloud porque PSO está en tu red local.

### Opción 2: Despliegue Local (Para usar PSO)

Para que la integración PSO funcione, debes desplegar en un servidor dentro de tu red local:

```bash
# 1. Clonar el proyecto
git clone <tu-repositorio>
cd isr-crm

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales PSO locales

# 4. Aplicar migraciones
pnpm db:push

# 5. Build de producción
pnpm build

# 6. Iniciar servidor
NODE_ENV=production pnpm start
```

### Opción 3: Docker (Recomendado para producción local)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
# Build y ejecutar
docker build -t isr-crm .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e PSO_BASE_URL="http://pso-local/api" \
  -e PSO_USERNAME="usuario" \
  -e PSO_PASSWORD="contraseña" \
  isr-crm
```

## 🔧 Mantenimiento

### Backup de Base de Datos

```bash
# Backup completo
mysqldump -u usuario -p isr_crm > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u usuario -p isr_crm < backup_20260107.sql
```

### Logs del Sistema

Los logs de operaciones PSO se guardan automáticamente en la tabla `logs_pso`:

```sql
-- Ver últimas operaciones PSO
SELECT * FROM logs_pso 
ORDER BY created_at DESC 
LIMIT 50;

-- Ver operaciones fallidas
SELECT * FROM logs_pso 
WHERE exitoso = 0 
ORDER BY created_at DESC;
```

### Monitoreo

Puntos clave a monitorear:
- **Conexión con PSO**: Verificar logs de errores PSO
- **Base de datos**: Espacio en disco y rendimiento
- **Tickets abiertos**: Alertar si superan umbral
- **Facturas vencidas**: Notificaciones automáticas

## 🆘 Solución de Problemas

### Error: "Cannot connect to PSO"

**Causa**: El servidor PSO no es accesible desde el CRM.

**Solución**:
1. Verificar que PSO_BASE_URL sea correcta
2. Comprobar conectividad de red: `ping servidor-pso`
3. Verificar que el servidor PSO esté activo
4. Revisar credenciales PSO_USERNAME y PSO_PASSWORD

### Error: "ONT duplicada"

**Causa**: El número de serie ya existe en PSO.

**Solución**:
1. Verificar en PSO si la ONT ya está registrada
2. Si es un error, eliminar la ONT duplicada desde PSO
3. Reintentar el alta desde el CRM

### Error: "Database connection failed"

**Causa**: No se puede conectar a la base de datos.

**Solución**:
1. Verificar DATABASE_URL en variables de entorno
2. Comprobar que MySQL/TiDB esté activo
3. Verificar credenciales de base de datos
4. Revisar firewall y permisos de red

## 📚 Recursos Adicionales

### Documentación de APIs

- **tRPC Routers**: Ver `server/routers.ts` para todos los endpoints disponibles
- **Cliente PSO**: Ver `server/pso-client.ts` para operaciones PSO
- **Base de datos**: Ver `drizzle/schema.ts` para esquema completo

### Estructura del Proyecto

```
isr-crm/
├── client/               # Frontend React
│   ├── src/
│   │   ├── pages/       # Páginas principales
│   │   ├── components/  # Componentes reutilizables
│   │   ├── lib/         # Cliente tRPC
│   │   └── App.tsx      # Rutas
├── server/              # Backend Node.js
│   ├── routers.ts       # Endpoints tRPC
│   ├── db.ts            # Funciones de base de datos
│   ├── pso-client.ts    # Cliente PSO Anvimur
│   └── _core/           # Infraestructura
├── drizzle/             # Esquema y migraciones
│   └── schema.ts
├── shared/              # Código compartido
└── package.json
```

## 🤝 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@isrcomunicaciones.es
- **Teléfono**: [Tu teléfono]
- **Documentación PSO**: Contactar con Anvimur

## 📝 Licencia

Copyright © 2026 ISR Comunicaciones. Todos los derechos reservados.

---

**Desarrollado con ❤️ para ISR Comunicaciones**
