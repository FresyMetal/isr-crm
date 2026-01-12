#!/bin/bash

# Script de instalación automática del CRM ISR Comunicaciones desde GitHub
# Uso: bash install-github.sh

set -e

echo "=========================================="
echo "Instalación del CRM ISR Comunicaciones"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script debe ejecutarse como root (usa: sudo bash install-github.sh)"
    exit 1
fi

# Detectar el directorio de instalación
INSTALL_DIR="/opt/isr-crm"
GITHUB_REPO="https://github.com/FresyMetal/isr-crm.git"

log_info "Directorio de instalación: $INSTALL_DIR"
log_info "Repositorio: $GITHUB_REPO"

# Crear directorio si no existe
if [ ! -d "$INSTALL_DIR" ]; then
    log_info "Creando directorio de instalación..."
    mkdir -p "$INSTALL_DIR"
fi

# Verificar dependencias
log_info "Verificando dependencias del sistema..."

# Actualizar apt
apt-get update -qq

# Node.js
if ! command -v node &> /dev/null; then
    log_warning "Node.js no está instalado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    log_info "Node.js encontrado: $NODE_VERSION"
fi

# pnpm
if ! command -v pnpm &> /dev/null; then
    log_warning "pnpm no está instalado. Instalando..."
    npm install -g pnpm
else
    PNPM_VERSION=$(pnpm -v)
    log_info "pnpm encontrado: $PNPM_VERSION"
fi

# Git
if ! command -v git &> /dev/null; then
    log_warning "Git no está instalado. Instalando..."
    apt-get install -y git
else
    log_info "Git encontrado"
fi

# MySQL
if ! command -v mysql &> /dev/null; then
    log_warning "MySQL no está instalado. Instalando..."
    apt-get install -y mysql-server
else
    log_info "MySQL encontrado"
fi

# Clonar o actualizar repositorio
log_info "Descargando código desde GitHub..."

if [ -d "$INSTALL_DIR/.git" ]; then
    log_info "Repositorio Git encontrado. Actualizando..."
    cd "$INSTALL_DIR"
    git pull origin main || git pull origin master
else
    log_info "Clonando repositorio desde GitHub..."
    rm -rf "$INSTALL_DIR"
    git clone "$GITHUB_REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Instalar dependencias
log_info "Instalando dependencias de Node.js..."
cd "$INSTALL_DIR"
pnpm install --frozen-lockfile

# Configurar variables de entorno
log_info "Configurando variables de entorno..."

if [ ! -f "$INSTALL_DIR/.env" ]; then
    log_info "Creando archivo .env..."
    
    # Generar contraseña aleatoria para JWT
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > "$INSTALL_DIR/.env" << EOF
# Base de Datos MySQL
DATABASE_URL="mysql://root:@localhost:3306/isr_crm"

# JWT
JWT_SECRET="$JWT_SECRET"

# OAuth (Manus) - No se usa en este CRM
VITE_APP_ID="local"
OAUTH_SERVER_URL="http://localhost:3000"
VITE_OAUTH_PORTAL_URL="http://localhost:3000"

# Información del propietario
OWNER_NAME="ISR Comunicaciones"
OWNER_OPEN_ID="admin"

# PSO Anvimur (configura con tu IP local)
PSO_BASE_URL="http://192.168.1.100:8080"
PSO_USERNAME="usuario_pso"
PSO_PASSWORD="contraseña_pso"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-app"
SMTP_FROM="noreply@isrcomunicaciones.es"

# S3 (Almacenamiento de archivos)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_S3_BUCKET="isr-crm-files"

# Aplicación
PORT=3000
NODE_ENV="production"
VITE_APP_TITLE="ISR Comunicaciones"
VITE_APP_LOGO="/logo.svg"
EOF
    
    log_warning "Archivo .env creado. Por favor, edita los valores de PSO, Email y S3:"
    log_warning "nano $INSTALL_DIR/.env"
else
    log_info "Archivo .env ya existe. Saltando..."
fi

# Crear base de datos
log_info "Creando base de datos MySQL..."

mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS isr_crm;
USE isr_crm;
EOF

log_info "Base de datos creada"

# Ejecutar migraciones
log_info "Ejecutando migraciones de base de datos..."
cd "$INSTALL_DIR"
pnpm db:push

# Crear archivo de servicio systemd
log_info "Configurando servicio systemd..."

cat > "/etc/systemd/system/isr-crm.service" << EOF
[Unit]
Description=ISR CRM - Sistema de Gestión de Clientes
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/pnpm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
systemctl daemon-reload

# Compilar la aplicación
log_info "Compilando aplicación..."
cd "$INSTALL_DIR"
pnpm build

# Iniciar el servicio
log_info "Iniciando servicio ISR CRM..."
systemctl enable isr-crm.service
systemctl start isr-crm.service

# Esperar a que el servicio inicie
sleep 5

# Verificar que el servicio está corriendo
if systemctl is-active --quiet isr-crm.service; then
    log_info "✓ Servicio ISR CRM iniciado correctamente"
else
    log_error "✗ Error al iniciar el servicio. Verifica los logs:"
    log_error "journalctl -u isr-crm.service -n 50"
    exit 1
fi

# Mostrar información final
echo ""
echo "=========================================="
echo -e "${GREEN}¡Instalación completada!${NC}"
echo "=========================================="
echo ""
echo "Acceso al CRM:"
echo "  URL: http://77.225.201.3:3000"
echo "  Usuario: admin"
echo "  Contraseña: admin123"
echo ""
echo "Comandos útiles:"
echo "  Ver logs: journalctl -u isr-crm.service -f"
echo "  Reiniciar: systemctl restart isr-crm.service"
echo "  Detener: systemctl stop isr-crm.service"
echo "  Estado: systemctl status isr-crm.service"
echo ""
echo "Próximos pasos:"
echo "  1. Edita el archivo .env para configurar PSO, Email y S3"
echo "     nano $INSTALL_DIR/.env"
echo "  2. Reinicia el servicio:"
echo "     systemctl restart isr-crm.service"
echo "  3. Accede a http://77.225.201.3:3000 en tu navegador"
echo ""
echo "Documentación: $INSTALL_DIR/README_CRM.md"
echo "=========================================="
