// Version 2.0 - Sin autenticación
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import Home from "./pages/Home";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import NuevoCliente from "./pages/NuevoCliente";
import PlanesGestion from "./pages/PlanesGestion";
import Facturas from "./pages/Facturas";
import Tickets from "./pages/Tickets";
import TicketDetalle from "./pages/TicketDetalle";
import Leads from "./pages/Leads";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      {/* Dashboard principal */}
      <Route path={"/"} component={Dashboard} />
      
      {/* Gestión de clientes */}
      <Route path={"/clientes"} component={Clientes} />
      <Route path={"/clientes/nuevo"} component={NuevoCliente} />
      <Route path={"/clientes/:id"} component={ClienteDetalle} />
      
      {/* Planes y servicios */}
      <Route path={"/planes"} component={PlanesGestion} />
      
      {/* Facturación */}
      <Route path={"/facturas"} component={Facturas} />
      
      {/* Soporte técnico */}
      <Route path={"/tickets"} component={Tickets} />
      <Route path={"/tickets/:id"} component={TicketDetalle} />
      
      {/* Leads y marketing */}
      <Route path={"/leads"} component={Leads} />
      
      {/* Página de ejemplo (se puede eliminar) */}
      <Route path={"/ejemplo"} component={Home} />
      
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
