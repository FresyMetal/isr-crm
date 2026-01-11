import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Edit2, Trash2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de gestión de planes con CRUD completo y contador de clientes
 */
export default function PlanesGestion() {
  const [abrirDialogoNuevo, setAbrirDialogoNuevo] = useState(false);
  const [abrirDialogoEditar, setAbrirDialogoEditar] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null);
  const [planAEliminar, setPlanAEliminar] = useState<any>(null);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("");
  const [precioMensual, setPrecioMensual] = useState("");

  // Queries
  const { data: planes, isLoading, refetch } = trpc.planes.list.useQuery();
  const { data: estadisticas } = trpc.planes.estadisticas.useQuery();

  // Mutations
  const crearMutation = trpc.planes.create.useMutation({
    onSuccess: () => {
      toast.success("Plan creado correctamente");
      setAbrirDialogoNuevo(false);
      limpiarFormulario();
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const actualizarMutation = trpc.planes.update.useMutation({
    onSuccess: () => {
      toast.success("Plan actualizado correctamente");
      setAbrirDialogoEditar(false);
      limpiarFormulario();
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const eliminarMutation = trpc.planes.delete.useMutation({
    onSuccess: () => {
      toast.success("Plan eliminado correctamente");
      setPlanAEliminar(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setTipo("");
    setPrecioMensual("");
    setPlanSeleccionado(null);
  };

  const handleCrear = async () => {
    if (!nombre || !tipo || !precioMensual) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    await crearMutation.mutateAsync({
      nombre,
      descripcion,
      tipo: tipo as any,
      precioMensual,
    });
  };

  const handleEditar = (plan: any) => {
    setPlanSeleccionado(plan);
    setNombre(plan.nombre);
    setDescripcion(plan.descripcion || "");
    setTipo(plan.tipo);
    setPrecioMensual(plan.precioMensual?.toString() || "");
    setAbrirDialogoEditar(true);
  };

  const handleActualizar = async () => {
    if (!nombre || !precioMensual) {
      toast.error("Completa los campos requeridos");
      return;
    }

    await actualizarMutation.mutateAsync({
      id: planSeleccionado.id,
      data: {
        nombre,
        descripcion,
        precioMensual,
      },
    });
  };

  const handleEliminar = async () => {
    if (!planAEliminar) return;

    await eliminarMutation.mutateAsync({
      id: planAEliminar.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Planes</h1>
          <p className="text-muted-foreground mt-2">
            Crea, edita y elimina planes de servicio
          </p>
        </div>

        <Dialog open={abrirDialogoNuevo} onOpenChange={setAbrirDialogoNuevo}>
          <DialogTrigger asChild>
            <Button onClick={() => limpiarFormulario()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Plan</DialogTitle>
              <DialogDescription>
                Completa los datos del nuevo plan de servicio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Plan *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Fibra 300 Mbps"
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Características del plan"
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Plan *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibra">Fibra Óptica</SelectItem>
                    <SelectItem value="movil">Móvil</SelectItem>
                    <SelectItem value="tv">TV</SelectItem>
                    <SelectItem value="telefonia_fija">Telefonía Fija</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="precio">Precio Mensual (€) *</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  value={precioMensual}
                  onChange={(e) => setPrecioMensual(e.target.value)}
                  placeholder="29.99"
                />
              </div>

              <Button
                onClick={handleCrear}
                disabled={crearMutation.isPending}
                className="w-full"
              >
                {crearMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Planes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalPlanes}</div>
              <p className="text-xs text-muted-foreground">Planes disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalClientes}</div>
              <p className="text-xs text-muted-foreground">En todos los planes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingreso Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{estadisticas.ingresoMensualEstimado?.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Estimado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.planesConClientes}</div>
              <p className="text-xs text-muted-foreground">Con clientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Planes */}
      <Card>
        <CardHeader>
          <CardTitle>Planes Disponibles</CardTitle>
          <CardDescription>
            {planes?.length || 0} planes configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : planes && planes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold">Precio</th>
                    <th className="text-center py-3 px-4 font-semibold">
                      <Users className="h-4 w-4 inline mr-1" />
                      Clientes
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      Ingreso
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planes.map((plan: any) => (
                    <tr key={plan.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{plan.nombre}</p>
                          <p className="text-xs text-muted-foreground">{plan.descripcion}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {plan.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">€{Number(plan.precioMensual).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-semibold">
                          {plan.clientesCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        €{((Number(plan.precioMensual) || 0) * (plan.clientesCount || 0)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditar(plan)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setPlanAEliminar(plan)}
                          disabled={(plan.clientesCount || 0) > 0}
                          title={(plan.clientesCount || 0) > 0 ? "No se puede eliminar: tiene clientes" : ""}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay planes creados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={abrirDialogoEditar} onOpenChange={setAbrirDialogoEditar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
            <DialogDescription>
              Modifica los datos del plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre-edit">Nombre del Plan</Label>
              <Input
                id="nombre-edit"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="descripcion-edit">Descripción</Label>
              <Input
                id="descripcion-edit"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div>
              <Label>Tipo de Plan</Label>
              <p className="text-sm text-muted-foreground mt-1">{tipo}</p>
            </div>

            <div>
              <Label htmlFor="precio-edit">Precio Mensual (€)</Label>
              <Input
                id="precio-edit"
                type="number"
                step="0.01"
                value={precioMensual}
                onChange={(e) => setPrecioMensual(e.target.value)}
              />
            </div>

            <Button
              onClick={handleActualizar}
              disabled={actualizarMutation.isPending}
              className="w-full"
            >
              {actualizarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Eliminación */}
      <AlertDialog open={!!planAEliminar} onOpenChange={(open) => !open && setPlanAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Plan</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el plan "{planAEliminar?.nombre}"?
              {(planAEliminar?.clientesCount || 0) > 0 && (
                <Alert className="mt-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    No se puede eliminar: este plan tiene {planAEliminar?.clientesCount} cliente(s) asignado(s).
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={(planAEliminar?.clientesCount || 0) > 0 || eliminarMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {eliminarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
