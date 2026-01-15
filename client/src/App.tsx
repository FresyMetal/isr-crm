import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import NuevoCliente from "./pages/NuevoCliente";
import PlanesGestion from "./pages/PlanesGestion";
import Facturas from "./pages/Facturas";
import Tickets from "./pages/Tickets";
import TicketDetalle from "./pages/TicketDetalle";
import Leads from "./pages/Leads";
import Dashboard from "./pages/Dashboard";

/**
 * Componente para proteger rutas que requieren autenticación
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Login (ruta pública) */}
      <Route path={"/login"} component={Login} />
      
      {/* Dashboard principal (protegido) */}
      <Route path={"/"}>
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      {/* Gestión de clientes (protegido) */}
      <Route path={"/clientes"}>
        <ProtectedRoute component={Clientes} />
      </Route>
      <Route path={"/clientes/nuevo"}>
        <ProtectedRoute component={NuevoCliente} />
      </Route>
      <Route path={"/clientes/:id"}>
        <ProtectedRoute component={ClienteDetalle} />
      </Route>
      
      {/* Planes y servicios (protegido) */}
      <Route path={"/planes"}>
        <ProtectedRoute component={PlanesGestion} />
      </Route>
      
      {/* Facturación (protegido) */}
      <Route path={"/facturas"}>
        <ProtectedRoute component={Facturas} />
      </Route>
      
      {/* Soporte técnico (protegido) */}
      <Route path={"/tickets"}>
        <ProtectedRoute component={Tickets} />
      </Route>
      <Route path={"/tickets/:id"}>
        <ProtectedRoute component={TicketDetalle} />
      </Route>
      
      {/* Leads y marketing (protegido) */}
      <Route path={"/leads"}>
        <ProtectedRoute component={Leads} />
      </Route>
      
      {/* Página de ejemplo (protegido) */}
      <Route path={"/ejemplo"}>
        <ProtectedRoute component={Home} />
      </Route>
      
      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
