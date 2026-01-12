#!/bin/bash

# Script de reparación de autenticación para ISR CRM
# Este script desactiva OAuth y activa login simple con usuario/contraseña

set -e

echo "=========================================="
echo "Reparación de Autenticación ISR CRM"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "/opt/isr-crm/package.json" ]; then
    log_error "No se encuentra el CRM en /opt/isr-crm"
    exit 1
fi

cd /opt/isr-crm

log_info "Deteniendo servicio..."
systemctl stop isr-crm.service

log_info "Corrigiendo App.tsx para desactivar OAuth..."
cat > client/src/App.tsx << 'EOF'
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import ClienteDetalle from "./pages/ClienteDetalle";
import PlanesGestion from "./pages/PlanesGestion";
import Facturas from "./pages/Facturas";
import Tickets from "./pages/Tickets";
import TicketDetalle from "./pages/TicketDetalle";
import Leads from "./pages/Leads";
import Facturacion from "./pages/Facturacion";
import EntregaFacturas from "./pages/EntregaFacturas";
import Login from "./pages/Login";
import { useEffect, useState } from "react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión
    fetch("/api/trpc/auth.me")
      .then(res => res.json())
      .then(data => {
        if (data.result?.data) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Login />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clientes" component={Clientes} />
            <Route path="/clientes/nuevo" component={NuevoCliente} />
            <Route path="/clientes/:id" component={ClienteDetalle} />
            <Route path="/planes" component={PlanesGestion} />
            <Route path="/facturas" component={Facturas} />
            <Route path="/facturacion" component={Facturacion} />
            <Route path="/facturas/entrega" component={EntregaFacturas} />
            <Route path="/tickets" component={Tickets} />
            <Route path="/tickets/:id" component={TicketDetalle} />
            <Route path="/leads" component={Leads} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
EOF

log_info "Recompilando aplicación..."
pnpm build

log_info "Iniciando servicio..."
systemctl start isr-crm.service

sleep 3

if systemctl is-active --quiet isr-crm.service; then
    log_info "✓ Servicio iniciado correctamente"
else
    log_error "✗ Error al iniciar el servicio"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}¡Reparación completada!${NC}"
echo "=========================================="
echo ""
echo "Accede a: http://192.168.0.57:3000"
echo "Usuario: admin"
echo "Contraseña: admin123"
echo ""
echo "Si sigue sin funcionar, ejecuta:"
echo "  journalctl -u isr-crm.service -n 50"
echo "=========================================="
