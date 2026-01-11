# Mejoras de Gestión de Planes y Clientes

## Resumen

Se han implementado mejoras significativas en la gestión de planes y datos de clientes, incluyendo CRUD completo de planes, contador de clientes por plan, asignación de planes a clientes y campo de número de cuenta.

## Cambios en Base de Datos

### Nuevos Campos en Tabla `clientes`

```sql
ALTER TABLE clientes ADD COLUMN precio_mensual DECIMAL(10,2);
ALTER TABLE clientes ADD COLUMN numero_cuenta VARCHAR(50);
```

**Campos añadidos:**
- `precioMensual`: Precio mensual personalizado del cliente (puede diferir del precio del plan base)
- `numeroCuenta`: Número de cuenta bancaria para domiciliaciones de pago

## Nuevas Funcionalidades

### 1. Servicio de Gestión de Planes (`server/planes-service.ts`)

Nuevo servicio con funciones mejoradas:

#### `getAllPlanesConContador()`
Obtiene todos los planes con contador de clientes asignados a cada uno.

```typescript
const planes = await getAllPlanesConContador();
// Retorna: [{ id, nombre, tipo, precioMensual, clientesCount, ... }, ...]
```

#### `getPlanConContador(id: number)`
Obtiene un plan específico con su contador de clientes.

```typescript
const plan = await getPlanConContador(1);
// Retorna: { id, nombre, clientesCount, ... }
```

#### `crearPlan(data: InsertPlan)`
Crea un nuevo plan con validaciones.

```typescript
const plan = await crearPlan({
  nombre: "Fibra 300 Mbps",
  tipo: "fibra",
  precioMensual: "49.99",
  velocidadBajada: 300,
  velocidadSubida: 30,
});
```

#### `actualizarPlan(id: number, data: Partial<InsertPlan>)`
Actualiza datos de un plan existente.

```typescript
const plan = await actualizarPlan(1, {
  precioMensual: "59.99",
  nombre: "Fibra 300 Mbps Plus"
});
```

#### `eliminarPlan(id: number)`
Elimina un plan (solo si no tiene clientes asignados).

```typescript
const resultado = await eliminarPlan(1);
// Lanza error si el plan tiene clientes
```

#### `getEstadisticasPlanes()`
Obtiene estadísticas completas de planes.

```typescript
const stats = await getEstadisticasPlanes();
// Retorna: {
//   totalPlanes: 5,
//   totalClientes: 150,
//   planesConClientes: 4,
//   planesSinClientes: 1,
//   ingresoMensualEstimado: 4500.00,
//   planes: [...]
// }
```

### 2. Router de Planes Mejorado

Nuevos procedimientos tRPC en `server/routers.ts`:

#### `planes.list`
Lista todos los planes con contador de clientes.

```typescript
const planes = await trpc.planes.list.useQuery();
```

#### `planes.estadisticas`
Obtiene estadísticas de planes.

```typescript
const stats = await trpc.planes.estadisticas.useQuery();
```

#### `planes.create`
Crea un nuevo plan (requiere rol admin).

```typescript
await trpc.planes.create.useMutation().mutateAsync({
  nombre: "Nuevo Plan",
  tipo: "fibra",
  precioMensual: "29.99"
});
```

#### `planes.update`
Actualiza un plan existente (requiere rol admin).

```typescript
await trpc.planes.update.useMutation().mutateAsync({
  id: 1,
  data: { precioMensual: "39.99" }
});
```

#### `planes.delete`
Elimina un plan (requiere rol admin, solo si no tiene clientes).

```typescript
await trpc.planes.delete.useMutation().mutateAsync({ id: 1 });
```

### 3. Página de Gestión de Planes (`client/src/pages/PlanesGestion.tsx`)

Nueva interfaz completa para gestionar planes:

**Características:**
- ✅ Tabla con todos los planes
- ✅ Contador de clientes por plan
- ✅ Cálculo automático de ingresos mensuales
- ✅ Estadísticas en tarjetas (Total Planes, Clientes, Ingreso, Planes Activos)
- ✅ Crear nuevo plan con diálogo modal
- ✅ Editar plan existente
- ✅ Eliminar plan con validaciones
- ✅ Protección: No permite eliminar planes con clientes
- ✅ Búsqueda y filtrado
- ✅ Notificaciones de éxito/error

**Acceso:** `/planes` (requiere autenticación)

### 4. Mejoras en Ficha de Cliente

Actualización de `client/src/pages/ClienteDetalle.tsx`:

**Nueva sección "Datos Contractuales"** que muestra:
- Plan Contratado (con nombre del plan)
- Precio Mensual (precio personalizado del cliente)
- Número de Cuenta (para domiciliaciones)
- Fecha de Alta (cuando se contrató)

```typescript
// En ClienteDetalle.tsx
{(cliente as any).plan?.nombre || "-"}  // Nombre del plan
{cliente.precioMensual}                  // Precio personalizado
{cliente.numeroCuenta}                   // Número de cuenta
```

### 5. Mejora en getClienteById

Función mejorada en `server/db.ts` que ahora retorna datos del plan:

```typescript
export async function getClienteById(id: number) {
  // Retorna cliente con datos del plan incluidos
  return {
    ...cliente,
    plan: { id, nombre, tipo, precioMensual, ... }
  };
}
```

## Tests

Se han creado 8 tests unitarios en `server/planes-service.test.ts`:

```bash
✓ debería crear un nuevo plan
✓ debería obtener plan con contador
✓ debería listar todos los planes con contador
✓ debería actualizar un plan
✓ debería obtener estadísticas de planes
✓ debería validar que no se puede eliminar plan sin datos
✓ debería validar campos requeridos
✓ debería retornar null para plan inexistente
```

Ejecutar tests:
```bash
pnpm test planes-service.test.ts
```

## Casos de Uso

### Crear un nuevo plan
1. Ir a "Planes" en el menú lateral
2. Hacer clic en "Nuevo Plan"
3. Completar datos (nombre, tipo, precio)
4. Hacer clic en "Crear Plan"

### Editar un plan
1. Ir a "Planes"
2. Hacer clic en el botón "Editar" (lápiz) en la fila del plan
3. Modificar datos
4. Hacer clic en "Guardar Cambios"

### Eliminar un plan
1. Ir a "Planes"
2. Hacer clic en el botón "Eliminar" (papelera) en la fila del plan
3. Si el plan no tiene clientes, confirmar eliminación
4. Si tiene clientes, se mostrará un error indicando cuántos clientes tiene

### Ver datos contractuales de cliente
1. Ir a "Clientes"
2. Hacer clic en un cliente
3. Ver la nueva sección "Datos Contractuales" con:
   - Plan contratado
   - Precio mensual personalizado
   - Número de cuenta
   - Fecha de alta

## Validaciones

- ✅ No se pueden crear planes sin nombre
- ✅ No se pueden crear planes sin tipo
- ✅ No se pueden crear planes sin precio
- ✅ No se pueden eliminar planes que tienen clientes asignados
- ✅ El contador de clientes se actualiza automáticamente
- ✅ Los ingresos mensuales se calculan correctamente

## Próximas Mejoras Sugeridas

1. **Edición de plan en cliente**: Permitir cambiar el plan de un cliente desde su ficha
2. **Historial de cambios de plan**: Registrar cuándo cambió de plan
3. **Planes con promoción**: Aplicar precios especiales por período limitado
4. **Planes con servicios adicionales**: Permitir combinar servicios (fibra + móvil + TV)
5. **Análisis de rentabilidad**: Mostrar margen de ganancia por plan

## Archivos Modificados

- `drizzle/schema.ts` - Añadidos campos `precioMensual` y `numeroCuenta`
- `server/db.ts` - Mejorada función `getClienteById`
- `server/routers.ts` - Actualizado router de planes
- `server/planes-service.ts` - Nuevo servicio de planes
- `server/planes-service.test.ts` - Tests unitarios
- `client/src/pages/PlanesGestion.tsx` - Nueva página de gestión
- `client/src/pages/ClienteDetalle.tsx` - Añadida sección de datos contractuales
- `todo.md` - Actualizado con tareas completadas

## Notas Técnicas

- Los precios se almacenan como DECIMAL(10,2) en la base de datos
- El contador de clientes se calcula en tiempo real desde la BD
- Las estadísticas incluyen cálculos de ingresos mensuales estimados
- Todas las operaciones requieren autenticación
- Las operaciones de admin (crear, editar, eliminar) requieren rol admin
