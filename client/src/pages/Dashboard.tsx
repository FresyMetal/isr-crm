import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, UserCheck, AlertCircle, FileText, TrendingUp, Phone } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.getKPIs.useQuery();
  const { data: clientesPorMes } = trpc.dashboard.getClientesPorMes.useQuery({ meses: 6 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido al CRM de ISR Comunicaciones
          </p>
        </div>

        {/* KPIs Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpisLoading ? "..." : kpis?.totalClientes || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Base de clientes total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {kpisLoading ? "..." : kpis?.clientesActivos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Servicios en funcionamiento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {kpisLoading ? "..." : kpis?.ticketsAbiertos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Nuevos</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {kpisLoading ? "..." : kpis?.leadsNuevos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Oportunidades pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/clientes/nuevo">
                <Button className="w-full" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </Link>
              <Link href="/tickets">
                <Button className="w-full" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Ver Tickets
                </Button>
              </Link>
              <Link href="/facturas">
                <Button className="w-full" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Facturas Pendientes
                </Button>
              </Link>
              <Link href="/leads">
                <Button className="w-full" variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Gestionar Leads
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Evolución de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Clientes</CardTitle>
            <CardDescription>
              Nuevos clientes en los últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientesPorMes && clientesPorMes.length > 0 ? (
              <div className="space-y-2">
                {clientesPorMes.map((item) => (
                  <div key={item.mes} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.mes}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.total} clientes
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos disponibles
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        {kpis && kpis.facturasVencidas > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Atención Requerida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Hay <strong>{kpis.facturasVencidas}</strong> facturas vencidas que requieren seguimiento.
              </p>
              <Link href="/facturas">
                <Button variant="destructive" className="mt-4">
                  Ver Facturas Vencidas
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
