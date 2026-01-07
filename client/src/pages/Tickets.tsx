import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const estadoLabels: Record<string, string> = {
  abierto: "Abierto",
  en_proceso: "En Proceso",
  pendiente_cliente: "Pendiente Cliente",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const prioridadLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const prioridadColors: Record<string, string> = {
  baja: "priority-low",
  media: "priority-medium",
  alta: "priority-high",
  urgente: "priority-urgent",
};

export default function Tickets() {
  const { data: tickets, isLoading } = trpc.tickets.list.useQuery({ abiertosOnly: true });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de incidencias y solicitudes de clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Abiertos</CardTitle>
            <CardDescription>
              {tickets?.length || 0} tickets pendientes de atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando tickets...
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay tickets abiertos</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos los tickets han sido atendidos
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium font-mono">
                        {ticket.numeroTicket}
                      </TableCell>
                      <TableCell>Cliente #{ticket.clienteId}</TableCell>
                      <TableCell>{ticket.asunto}</TableCell>
                      <TableCell className="capitalize">{ticket.tipo.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${prioridadColors[ticket.prioridad]} border`}
                        >
                          {prioridadLabels[ticket.prioridad]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {estadoLabels[ticket.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.fechaApertura).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/tickets/${ticket.id}`}>
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
