import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, User, MapPin, Wifi, FileText, Activity, Ban, Play, Trash2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

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

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const clienteId = parseInt(id);
  const [motivoSuspension, setMotivoSuspension] = useState("");
  const [motivoBaja, setMotivoBaja] = useState("");

  const utils = trpc.useUtils();
  const { data: cliente, isLoading } = trpc.clientes.getById.useQuery({ id: clienteId });
  const { data: actividad } = trpc.clientes.getActivity.useQuery({ id: clienteId });

  const suspendMutation = trpc.clientes.suspend.useMutation({
    onSuccess: () => {
      toast.success("Cliente suspendido correctamente");
      utils.clientes.getById.invalidate({ id: clienteId });
      setMotivoSuspension("");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const reactivateMutation = trpc.clientes.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Cliente reactivado correctamente");
      utils.clientes.getById.invalidate({ id: clienteId });
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deactivateMutation = trpc.clientes.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Cliente dado de baja correctamente");
      utils.clientes.getById.invalidate({ id: clienteId });
      setMotivoBaja("");
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

  if (!cliente) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Cliente no encontrado</h2>
          <Link href="/clientes">
            <Button className="mt-4">Volver a Clientes</Button>
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
            <Link href="/clientes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {cliente.nombre} {cliente.apellidos}
              </h1>
              <p className="text-muted-foreground mt-1">
                Cliente #{cliente.id}
              </p>
            </div>
            <Badge variant="outline" className={`${estadoColors[cliente.estado]} border ml-4`}>
              {estadoLabels[cliente.estado]}
            </Badge>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            {cliente.estado === "activo" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspender
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspender Cliente</AlertDialogTitle>
                    <AlertDialogDescription>
                      El servicio del cliente será suspendido temporalmente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motivo de suspensión</label>
                    <Textarea
                      value={motivoSuspension}
                      onChange={(e) => setMotivoSuspension(e.target.value)}
                      placeholder="Ej: Impago, solicitud del cliente..."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => suspendMutation.mutate({ id: clienteId, motivo: motivoSuspension })}
                      disabled={!motivoSuspension}
                    >
                      Suspender
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {cliente.estado === "suspendido" && (
              <Button onClick={() => reactivateMutation.mutate({ id: clienteId })}>
                <Play className="mr-2 h-4 w-4" />
                Reactivar
              </Button>
            )}

            {(cliente.estado === "activo" || cliente.estado === "suspendido") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Dar de Baja
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Dar de Baja Cliente</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará el cliente del sistema PSO y marcará el servicio como dado de baja.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motivo de baja</label>
                    <Textarea
                      value={motivoBaja}
                      onChange={(e) => setMotivoBaja(e.target.value)}
                      placeholder="Ej: Solicitud del cliente, cambio de operador..."
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deactivateMutation.mutate({ id: clienteId, motivo: motivoBaja })}
                      disabled={!motivoBaja}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmar Baja
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">
              <User className="mr-2 h-4 w-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="tecnico">
              <Wifi className="mr-2 h-4 w-4" />
              Datos Técnicos
            </TabsTrigger>
            <TabsTrigger value="facturas">
              <FileText className="mr-2 h-4 w-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="actividad">
              <Activity className="mr-2 h-4 w-4" />
              Actividad
            </TabsTrigger>
          </TabsList>

          {/* Información General */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos Personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-medium">{cliente.nombre} {cliente.apellidos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">DNI/NIF</p>
                    <p className="font-medium">{cliente.dni || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{cliente.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{cliente.telefono || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos Contractuales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan Contratado</p>
                    <p className="font-medium">{(cliente as any).plan?.nombre || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precio Mensual</p>
                    <p className="font-medium">€{cliente.precioMensual ? Number(cliente.precioMensual).toFixed(2) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Cuenta</p>
                    <p className="font-medium font-mono">{cliente.numeroCuenta || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Alta</p>
                    <p className="font-medium">{cliente.fechaAlta ? new Date(cliente.fechaAlta).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MapPin className="inline mr-2 h-5 w-5" />
                  Dirección de Instalación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{cliente.direccion}</p>
                <p className="text-muted-foreground">
                  {cliente.codigoPostal && `${cliente.codigoPostal}, `}
                  {cliente.localidad}
                  {cliente.provincia && `, ${cliente.provincia}`}
                </p>
              </CardContent>
            </Card>

            {cliente.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{cliente.observaciones}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Datos Técnicos */}
          <TabsContent value="tecnico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración GPON</CardTitle>
                <CardDescription>
                  Información técnica de la conexión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Serie ONT</p>
                    <p className="font-medium font-mono">{cliente.numeroSerieONT || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo ONT</p>
                    <p className="font-medium">{cliente.modeloONT || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">OLT</p>
                    <p className="font-medium">{cliente.olt || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PON</p>
                    <p className="font-medium">{cliente.pon || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facturas */}
          <TabsContent value="facturas">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturas</CardTitle>
                <CardDescription>
                  Facturas emitidas al cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Funcionalidad en desarrollo
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actividad */}
          <TabsContent value="actividad">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividad</CardTitle>
                <CardDescription>
                  Historial de cambios y eventos del cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actividad && actividad.length > 0 ? (
                  <div className="space-y-4">
                    {actividad.map((item) => (
                      <div key={item.id} className="border-l-2 border-primary pl-4 py-2">
                        <p className="font-medium">{item.descripcion}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay actividad registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
