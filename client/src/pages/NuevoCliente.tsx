import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function NuevoCliente() {
  const [, setLocation] = useLocation();
  const { data: planes } = trpc.planes.list.useQuery({ activosOnly: true });
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    telefonoAlternativo: "",
    direccion: "",
    codigoPostal: "",
    localidad: "",
    provincia: "",
    numeroSerieONT: "",
    modeloONT: "",
    olt: "",
    pon: "",
    planId: "",
    observaciones: "",
    activarEnPSO: false,
  });

  const createClienteMutation = trpc.clientes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Cliente creado correctamente");
      setLocation(`/clientes/${data.clienteId}`);
    },
    onError: (error) => {
      toast.error(`Error al crear cliente: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.localidad || !formData.direccion || !formData.planId) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    createClienteMutation.mutate({
      ...formData,
      planId: parseInt(formData.planId),
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
            <p className="text-muted-foreground mt-1">
              Completa los datos del cliente para darlo de alta en el sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Personales</CardTitle>
              <CardDescription>
                Información de contacto del cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => handleChange("apellidos", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI/NIF</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleChange("dni", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefonoAlternativo">Teléfono Alternativo</Label>
                  <Input
                    id="telefonoAlternativo"
                    value={formData.telefonoAlternativo}
                    onChange={(e) => handleChange("telefonoAlternativo", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirección de Instalación */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Instalación</CardTitle>
              <CardDescription>
                Ubicación donde se instalará el servicio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección Completa *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Calle, número, piso, puerta..."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={(e) => handleChange("codigoPostal", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localidad">Localidad *</Label>
                  <Input
                    id="localidad"
                    value={formData.localidad}
                    onChange={(e) => handleChange("localidad", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={formData.provincia}
                    onChange={(e) => handleChange("provincia", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Contratado */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Contratado</CardTitle>
              <CardDescription>
                Selecciona el plan de servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planId">Plan *</Label>
                <Select value={formData.planId} onValueChange={(value) => handleChange("planId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.nombre} - {plan.precioMensual}€/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Datos Técnicos GPON */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Técnicos GPON</CardTitle>
              <CardDescription>
                Información de la ONT y configuración de red
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroSerieONT">Número de Serie ONT</Label>
                  <Input
                    id="numeroSerieONT"
                    value={formData.numeroSerieONT}
                    onChange={(e) => handleChange("numeroSerieONT", e.target.value)}
                    placeholder="Ej: HWTC12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modeloONT">Modelo ONT</Label>
                  <Input
                    id="modeloONT"
                    value={formData.modeloONT}
                    onChange={(e) => handleChange("modeloONT", e.target.value)}
                    placeholder="Ej: Huawei HG8245H"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="olt">OLT</Label>
                  <Input
                    id="olt"
                    value={formData.olt}
                    onChange={(e) => handleChange("olt", e.target.value)}
                    placeholder="Ej: OLT-GILET-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pon">PON</Label>
                  <Input
                    id="pon"
                    value={formData.pon}
                    onChange={(e) => handleChange("pon", e.target.value)}
                    placeholder="Ej: 0/1/1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="activarEnPSO"
                  checked={formData.activarEnPSO}
                  onCheckedChange={(checked) => handleChange("activarEnPSO", checked)}
                />
                <Label htmlFor="activarEnPSO" className="cursor-pointer">
                  Activar automáticamente en PSO Anvimur
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Si activas esta opción, el cliente se dará de alta automáticamente en el sistema PSO.
                Asegúrate de haber completado los datos técnicos correctamente.
              </p>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
              <CardDescription>
                Notas adicionales sobre el cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                placeholder="Escribe aquí cualquier información adicional..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <Link href="/clientes">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={createClienteMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {createClienteMutation.isPending ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
