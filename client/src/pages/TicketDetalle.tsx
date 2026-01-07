import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, RotateCw } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

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

export default function TicketDetalle() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");

  const utils = trpc.useUtils();
  const { data: ticket, isLoading } = trpc.tickets.getById.useQuery({ id: ticketId });

  const addCommentMutation = trpc.tickets.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentario añadido");
      utils.tickets.getById.invalidate({ id: ticketId });
      setNuevoComentario("");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateStatusMutation = trpc.tickets.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      utils.tickets.getById.invalidate({ id: ticketId });
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const reiniciarONTMutation = trpc.tickets.reiniciarONT.useMutation({
    onSuccess: () => {
      toast.success("ONT reiniciada correctamente");
      utils.tickets.getById.invalidate({ id: ticketId });
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Cargando...</div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Ticket no encontrado</h2>
          <Link href="/tickets">
            <Button className="mt-4">Volver a Tickets</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{ticket.asunto}</h1>
              <p className="text-muted-foreground mt-1">
                Ticket {ticket.numeroTicket}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className={`priority-${ticket.prioridad} border`}>
              {prioridadLabels[ticket.prioridad]}
            </Badge>
            <Badge variant="outline">
              {estadoLabels[ticket.estado]}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
                <CardDescription>
                  Abierto el {new Date(ticket.fechaApertura).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{ticket.descripcion}</p>
              </CardContent>
            </Card>

            {/* Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle>Seguimiento</CardTitle>
                <CardDescription>
                  Historial de comentarios y acciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.comentarios && ticket.comentarios.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.comentarios.map((comentario) => (
                      <div key={comentario.id} className="border-l-2 border-primary pl-4 py-2">
                        <p className="text-sm">{comentario.comentario}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comentario.createdAt).toLocaleString()}
                          {comentario.interno && " • Comentario interno"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay comentarios todavía
                  </p>
                )}

                {/* Nuevo Comentario */}
                <div className="pt-4 border-t space-y-2">
                  <Textarea
                    placeholder="Añadir comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => addCommentMutation.mutate({
                      ticketId,
                      comentario: nuevoComentario,
                      interno: false,
                    })}
                    disabled={!nuevoComentario || addCommentMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Añadir Comentario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Lateral */}
          <div className="space-y-6">
            {/* Información del Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <Link href={`/clientes/${ticket.clienteId}`}>
                    <Button variant="link" className="p-0 h-auto">
                      Ver Cliente #{ticket.clienteId}
                    </Button>
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium capitalize">{ticket.tipo.replace('_', ' ')}</p>
                </div>
                {ticket.fechaCierre && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cerrado</p>
                    <p className="font-medium">
                      {new Date(ticket.fechaCierre).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cambiar Estado */}
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="pendiente_cliente">Pendiente Cliente</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => updateStatusMutation.mutate({
                    id: ticketId,
                    estado: nuevoEstado as any,
                  })}
                  disabled={!nuevoEstado || updateStatusMutation.isPending}
                  className="w-full"
                >
                  Actualizar Estado
                </Button>
              </CardContent>
            </Card>

            {/* Operaciones Remotas */}
            <Card>
              <CardHeader>
                <CardTitle>Operaciones Remotas</CardTitle>
                <CardDescription>
                  Acciones sobre la ONT del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => reiniciarONTMutation.mutate({ ticketId })}
                  disabled={reiniciarONTMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Reiniciar ONT
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
