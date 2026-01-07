# Guía de Instalación y Despliegue - ISR CRM

## Descripción General

Esta guía te ayudará a descargar, instalar y ejecutar el CRM de ISR Comunicaciones en tu servidor local. El sistema está completamente funcional y listo para producción.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior): [https://nodejs.org/](https://nodejs.org/)
- **pnpm** (gestor de paquetes): `npm install -g pnpm`
- **Git** (opcional, para clonar repositorio): [https://git-scm.com/](https://git-scm.com/)
- **MySQL/MariaDB** (versión 5.7 o superior): [https://www.mysql.com/](https://www.mysql.com/)

### Verificar Instalación

```bash
# Verificar Node.js
node --version
# Debe mostrar v18.0.0 o superior

# Verificar pnpm
pnpm --version
# Debe mostrar 10.0.0 o superior

# Verificar MySQL
mysql --version
# Debe mostrar versión 5.7 o superior
```

## Paso 1: Descargar el Proyecto

### Opción A: Desde Manus (Recomendado)

1. Accede al panel de Manus
2. Busca el proyecto "isr-crm"
3. Haz clic en el botón "Descargar" o "Export"
4. Se descargará un archivo ZIP con todo el proyecto

### Opción B: Desde GitHub (Si está disponible)

```bash
git clone https://github.com/tu-usuario/isr-crm.git
cd isr-crm
```

### Opción C: Descarga Manual

1. Descarga el archivo ZIP del proyecto
2. Descomprime en tu carpeta de proyectos:
   ```bash
   unzip isr-crm.zip
   cd isr-crm
   ```

## Paso 2: Configurar Base de Datos

### 2.1 Crear Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar en MySQL:
CREATE DATABASE isr_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'isr_user'@'localhost' IDENTIFIED BY 'tu-contraseña-segura';
GRANT ALL PRIVILEGES ON isr_crm.* TO 'isr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Obtener Cadena de Conexión

La cadena de conexión tiene este formato:

```
mysql://usuario:contraseña@localhost:3306/nombre_base_datos
```

En nuestro caso:
```
mysql://isr_user:tu-contraseña-segura@localhost:3306/isr_crm
```

## Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env

En la raíz del proyecto, crea un archivo `.env`:

```bash
# Linux/Mac
touch .env

# Windows
type nul > .env
```

### 3.2 Configurar Variables

Abre el archivo `.env` y añade:

```env
# Base de Datos
DATABASE_URL="mysql://isr_user:tu-contraseña-segura@localhost:3306/isr_crm"

# Autenticación
JWT_SECRET="tu-clave-secreta-muy-larga-y-aleatoria"

# Manus OAuth (obtener de panel Manus)
VITE_APP_ID="tu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# Información del Propietario
OWNER_NAME="Tu Nombre"
OWNER_OPEN_ID="tu-open-id"

# PSO Anvimur (configurar después)
PSO_BASE_URL="http://192.168.1.100:8080"  # IP local de PSO
PSO_USERNAME="usuario-pso"
PSO_PASSWORD="contraseña-pso"

# Email (configurar después)
EMAIL_HOST="smtp.tu-proveedor.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@ejemplo.com"
EMAIL_PASSWORD="contraseña-app"
EMAIL_FROM="noreply@isrcomunicaciones.es"

# S3 (configurar después)
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_REGION="eu-west-1"
AWS_S3_BUCKET="tu-bucket"
```

### 3.3 Valores Importantes

**JWT_SECRET**: Genera una cadena aleatoria segura:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object {[char](Get-Random -Minimum 33 -Maximum 127)}) -join ''))
```

## Paso 4: Instalar Dependencias

```bash
# Navegar al directorio del proyecto
cd isr-crm

# Instalar dependencias
pnpm install

# Esto puede tardar 5-10 minutos
```

## Paso 5: Configurar Base de Datos

```bash
# Generar migraciones y aplicarlas
pnpm db:push

# Esto creará todas las tablas necesarias
```

## Paso 6: Ejecutar el Proyecto

### Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# El servidor estará disponible en:
# http://localhost:3000
```

### Producción

```bash
# Compilar proyecto
pnpm build

# Iniciar servidor de producción
pnpm start

# El servidor estará disponible en:
# http://localhost:3000
```

## Paso 7: Acceder al CRM

1. Abre tu navegador
2. Ve a `http://localhost:3000`
3. Inicia sesión con tu cuenta Manus
4. ¡Listo! El CRM está funcionando

## Configuración Adicional

### Integración PSO Anvimur

Para que la integración con PSO funcione:

1. Obtén la IP local de tu servidor PSO (ej: 192.168.1.100)
2. Configura las credenciales en `.env`:
   ```env
   PSO_BASE_URL="http://192.168.1.100:8080"
   PSO_USERNAME="tu-usuario"
   PSO_PASSWORD="tu-contraseña"
   ```
3. Reinicia el servidor

### Configuración de Email

Para que el envío de emails funcione:

1. Elige un proveedor SMTP (Gmail, SendGrid, AWS SES, etc.)
2. Obtén las credenciales
3. Configura en `.env`:
   ```env
   EMAIL_HOST="smtp.tu-proveedor.com"
   EMAIL_PORT=587
   EMAIL_USER="tu-email@ejemplo.com"
   EMAIL_PASSWORD="contraseña-app"
   EMAIL_FROM="noreply@isrcomunicaciones.es"
   ```

**Ejemplo Gmail:**
```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASSWORD="contraseña-app-específica"
```

### Almacenamiento S3

Para que los PDFs se guarden en S3:

1. Crea una cuenta AWS o usa otro proveedor S3
2. Crea un bucket S3
3. Obtén las credenciales de acceso
4. Configura en `.env`:
   ```env
   AWS_ACCESS_KEY_ID="tu-access-key"
   AWS_SECRET_ACCESS_KEY="tu-secret-key"
   AWS_REGION="eu-west-1"
   AWS_S3_BUCKET="tu-bucket"
   ```

## Despliegue en Servidor

### Opción 1: Servidor Linux con Systemd

1. **Copiar proyecto al servidor:**
   ```bash
   scp -r isr-crm usuario@servidor:/opt/
   ```

2. **Crear servicio systemd** (`/etc/systemd/system/isr-crm.service`):
   ```ini
   [Unit]
   Description=ISR CRM Service
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/isr-crm
   ExecStart=/usr/bin/pnpm start
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Iniciar servicio:**
   ```bash
   sudo systemctl enable isr-crm
   sudo systemctl start isr-crm
   sudo systemctl status isr-crm
   ```

### Opción 2: Docker

1. **Crear Dockerfile** en la raíz del proyecto:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN pnpm install
   RUN pnpm build
   EXPOSE 3000
   CMD ["pnpm", "start"]
   ```

2. **Construir imagen:**
   ```bash
   docker build -t isr-crm .
   ```

3. **Ejecutar contenedor:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     --name isr-crm \
     isr-crm
   ```

### Opción 3: PM2 (Gestor de Procesos)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start "pnpm start" --name "isr-crm"

# Guardar configuración
pm2 save

# Habilitar inicio automático
pm2 startup
```

## Troubleshooting

### Error: "Cannot find module 'mysql2'"

```bash
# Reinstalar dependencias
pnpm install
```

### Error: "Database connection failed"

1. Verifica que MySQL esté ejecutándose
2. Verifica la cadena de conexión en `.env`
3. Verifica credenciales de usuario

```bash
# Probar conexión
mysql -u isr_user -p -h localhost isr_crm
```

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en .env o usar otro puerto
# O liberar el puerto:
lsof -ti:3000 | xargs kill -9
```

### Error: "OAuth configuration missing"

1. Obtén APP_ID del panel Manus
2. Configura en `.env`
3. Reinicia servidor

## Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Compilar para producción
pnpm build

# Iniciar en producción
pnpm start

# Ejecutar tests
pnpm test

# Linter/Formatter
pnpm format

# Verificar tipos TypeScript
pnpm check

# Gestionar base de datos
pnpm db:push      # Aplicar migraciones
pnpm db:studio    # Abrir Drizzle Studio
```

## Estructura del Proyecto

```
isr-crm/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas del CRM
│   │   ├── components/    # Componentes reutilizables
│   │   ├── lib/           # Librerías y utilidades
│   │   └── App.tsx        # Aplicación principal
│   └── index.html
├── server/                # Backend Node.js
│   ├── routers.ts         # Procedimientos tRPC
│   ├── db.ts              # Funciones de BD
│   ├── pso-client.ts      # Cliente PSO
│   ├── billing-service.ts # Facturación automática
│   ├── pdf-service.ts     # Generación de PDFs
│   ├── email-service.ts   # Envío de emails
│   └── _core/             # Configuración interna
├── drizzle/               # Esquema de BD
│   └── schema.ts          # Definición de tablas
├── .env                   # Variables de entorno
├── package.json           # Dependencias
└── README.md              # Documentación
```

## Soporte y Documentación

- **README_CRM.md**: Documentación general del CRM
- **FACTURACION_AUTOMATICA.md**: Sistema de facturación automática
- **FACTURAS_PDF_EMAIL.md**: Sistema de PDF y email
- **Logs**: Revisa los logs del servidor para errores

## Próximos Pasos

1. **Crear datos de prueba**: Añade planes y clientes de prueba
2. **Configurar PSO**: Integra con tu servidor PSO local
3. **Configurar Email**: Prueba el envío de facturas
4. **Crear usuarios**: Añade usuarios con diferentes roles
5. **Personalizar**: Ajusta colores, logos y datos de empresa

## Contacto

Para soporte técnico o preguntas sobre la instalación, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026  
**Estado**: Producción
