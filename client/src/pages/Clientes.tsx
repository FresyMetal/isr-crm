import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Search, User } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import ClientesFilters from "@/components/ClientesFilters";

const estadoLabels: Record<string, string> = {
  activo: "Activo",
  suspendido: "Suspendido",
  baja: "Baja",
  pendiente_instalacion: "Pendiente Instalación",
};

const estadoColors: Record<string, string> = {
  activo: "status-active",
  suspendido: "status-suspended",
  baja: "status-inactive",
  pendiente_instalacion: "status-pending",
};

export default function Clientes() {
  const [filters, setFilters] = useState({});
  const { data: clientes, isLoading } = trpc.clientes.list.useQuery(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestión de clientes y servicios contratados
            </p>
          </div>
          <Link href="/clientes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>

        {/* Filtros Avanzados */}
        <ClientesFilters 
          onFilterChange={setFilters} 
          resultCount={clientes?.length}
        />

        {/* Tabla de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {clientes?.length || 0} clientes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando clientes...
              </div>
            ) : !clientes || clientes.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay clientes</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Comienza agregando tu primer cliente
                </p>
                <Link href="/clientes/nuevo">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Localidad</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Alta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        <Link href={`/clientes/${cliente.id}`}>
                          <button className="hover:underline text-left">
                            {cliente.nombre} {cliente.apellidos}
                          </button>
                        </Link>
                      </TableCell>
                      <TableCell>{cliente.dni || "-"}</TableCell>
                      <TableCell>{cliente.localidad}</TableCell>
                      <TableCell>{cliente.telefono || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${estadoColors[cliente.estado]} border`}
                        >
                          {estadoLabels[cliente.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.fechaAlta
                          ? new Date(cliente.fechaAlta).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/clientes/${cliente.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver Detalle
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
