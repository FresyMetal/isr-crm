import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ValidatedInput } from "@/components/ValidatedInput";

interface ClienteEditFormProps {
  cliente: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ClienteEditForm({ cliente, onCancel, onSuccess }: ClienteEditFormProps) {
  const { data: planes } = trpc.planes.list.useQuery({ activosOnly: true });
  
  const [formData, setFormData] = useState({
    // Datos básicos
    codigo: cliente.codigo || "",
    nombre: cliente.nombre || "",
    apellidos: cliente.apellidos || "",
    tipoCliente: cliente.tipoCliente || "Particular",
    tipoId: cliente.tipoId || "NIF",
    dni: cliente.dni || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    telefonoAlternativo: cliente.telefonoAlternativo || "",
    numero: cliente.numero || "",
    contacto: cliente.contacto || "",
    
    // Dirección
    direccion: cliente.direccion || "",
    domicilioFiscal: cliente.domicilioFiscal || "",
    calle1: cliente.calle1 || "",
    calle2: cliente.calle2 || "",
    codigoPostal: cliente.codigoPostal || "",
    localidad: cliente.localidad || "",
    provincia: cliente.provincia || "",
    latitud: cliente.latitud || "",
    longitud: cliente.longitud || "",
    extra1: cliente.extra1 || "",
    extra2: cliente.extra2 || "",
    
    // Datos comerciales
    medioPago: cliente.medioPago || "Caja",
    cobrador: cliente.cobrador || "",
    vendedor: cliente.vendedor || "",
    contrato: cliente.contrato || false,
    tipoContrato: cliente.tipoContrato || "",
    fechaVencimiento: cliente.fechaVencimiento ? new Date(cliente.fechaVencimiento).toISOString().split('T')[0] : "",
    
    // Datos financieros
    gratis: cliente.gratis || false,
    recuperacion: cliente.recuperacion || "",
    cbu: cliente.cbu || "",
    tarjetaCredito: cliente.tarjetaCredito || "",
    pagoAutomatico: cliente.pagoAutomatico || false,
    
    // Configuración
    envioFacturaAuto: cliente.envioFacturaAuto || false,
    envioReciboPagoAuto: cliente.envioReciboPagoAuto || false,
    bloquear: cliente.bloquear || false,
    preAviso: cliente.preAviso || false,
    terVenc: String(cliente.terVenc || 0),
    proxMes: cliente.proxMes || false,
    actividadComercial: cliente.actividadComercial || "",
    
    // Técnicos
    numeroSerieONT: cliente.numeroSerieONT || "",
    modeloONT: cliente.modeloONT || "",
    olt: cliente.olt || "",
    pon: cliente.pon || "",
    
    // Plan
    planId: String(cliente.planId || ""),
    numeroCuenta: cliente.numeroCuenta || "",
    observaciones: cliente.observaciones || "",
  });

  const updateMutation = trpc.clientes.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente actualizado correctamente");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.localidad || !formData.direccion) {
      toast.error("Por favor completa los campos obligatorios (Nombre, Localidad, Dirección)");
      return;
    }

    updateMutation.mutate({
      id: cliente.id,
      data: {
        ...formData,
        planId: formData.planId ? parseInt(formData.planId) : undefined,
        terVenc: parseInt(formData.terVenc) || 0,
      },
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos Personales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>
            Información básica del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código Cliente</Label>
              <ValidatedInput
                id="codigo"
                value={formData.codigo}
                onChange={(value) => handleChange("codigo", value)}
                placeholder="Ej: 000003"
                validate={async (value: string) => {
                  if (!value) return { isValid: true };
                  try {
                    const response = await fetch(`/api/trpc/clientes.checkCodigoExists?input=${encodeURIComponent(JSON.stringify({ codigo: value, excludeId: cliente.id }))}`, {
                      credentials: 'include'
                    });
                    const data = await response.json();
                    const exists = data.result?.data?.exists;
                    return exists 
                      ? { isValid: false, message: "Este código ya está en uso" }
                      : { isValid: true };
                  } catch (err) {
                    console.error("Error validating codigo:", err);
                    return { isValid: true };
                  }
                }}
                debounceMs={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre/Empresa *</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoCliente">Tipo Cliente</Label>
              <Select value={formData.tipoCliente} onValueChange={(value) => handleChange("tipoCliente", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                  <SelectItem value="Autónomo">Autónomo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoId">Tipo ID</Label>
              <Select value={formData.tipoId} onValueChange={(value) => handleChange("tipoId", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIF">NIF</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="NIE">NIE</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI/NIF/CIF</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                placeholder="999999999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="contacto">Persona de Contacto</Label>
            <Input
              id="contacto"
              value={formData.contacto}
              onChange={(e) => handleChange("contacto", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dirección */}
      <Card>
        <CardHeader>
          <CardTitle>Dirección e Instalación</CardTitle>
          <CardDescription>
            Ubicación del cliente y punto de instalación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domicilioFiscal">Domicilio Fiscal</Label>
            <Input
              id="domicilioFiscal"
              value={formData.domicilioFiscal}
              onChange={(e) => handleChange("domicilioFiscal", e.target.value)}
              placeholder="Dirección fiscal si es diferente a la de instalación"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calle1">Calle 1</Label>
              <Input
                id="calle1"
                value={formData.calle1}
                onChange={(e) => handleChange("calle1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calle2">Calle 2</Label>
              <Input
                id="calle2"
                value={formData.calle2}
                onChange={(e) => handleChange("calle2", e.target.value)}
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extra1">Extra 1</Label>
              <Input
                id="extra1"
                value={formData.extra1}
                onChange={(e) => handleChange("extra1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra2">Extra 2</Label>
              <Input
                id="extra2"
                value={formData.extra2}
                onChange={(e) => handleChange("extra2", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitud">Latitud</Label>
              <Input
                id="latitud"
                value={formData.latitud}
                onChange={(e) => handleChange("latitud", e.target.value)}
                placeholder="39.682071"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitud">Longitud</Label>
              <Input
                id="longitud"
                value={formData.longitud}
                onChange={(e) => handleChange("longitud", e.target.value)}
                placeholder="-0.338390"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos Comerciales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Comerciales y Contractuales</CardTitle>
          <CardDescription>
            Información de contrato y gestión comercial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medioPago">Medio de Pago</Label>
              <Select value={formData.medioPago} onValueChange={(value) => handleChange("medioPago", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caja">Caja</SelectItem>
                  <SelectItem value="Banco">Banco</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Domiciliación">Domiciliación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cobrador">Cobrador</Label>
              <Input
                id="cobrador"
                value={formData.cobrador}
                onChange={(e) => handleChange("cobrador", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor">Vendedor</Label>
              <Input
                id="vendedor"
                value={formData.vendedor}
                onChange={(e) => handleChange("vendedor", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contrato"
                checked={formData.contrato}
                onCheckedChange={(checked) => handleChange("contrato", checked)}
              />
              <Label htmlFor="contrato" className="cursor-pointer">Contrato Firmado</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoContrato">Tipo Contrato</Label>
              <Input
                id="tipoContrato"
                value={formData.tipoContrato}
                onChange={(e) => handleChange("tipoContrato", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => handleChange("fechaVencimiento", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actividadComercial">Actividad Comercial</Label>
            <Textarea
              id="actividadComercial"
              value={formData.actividadComercial}
              onChange={(e) => handleChange("actividadComercial", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos Financieros */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Financieros y Facturación</CardTitle>
          <CardDescription>
            Información de pago y facturación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cbu">CBU / IBAN</Label>
              <Input
                id="cbu"
                value={formData.cbu}
                onChange={(e) => handleChange("cbu", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarjetaCredito">Tarjeta de Crédito</Label>
              <Input
                id="tarjetaCredito"
                value={formData.tarjetaCredito}
                onChange={(e) => handleChange("tarjetaCredito", e.target.value)}
                placeholder="Últimos 4 dígitos"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroCuenta">Número de Cuenta</Label>
              <Input
                id="numeroCuenta"
                value={formData.numeroCuenta}
                onChange={(e) => handleChange("numeroCuenta", e.target.value)}
                placeholder="ES9121000418450200051332"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recuperacion">Recuperación</Label>
              <Input
                id="recuperacion"
                value={formData.recuperacion}
                onChange={(e) => handleChange("recuperacion", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terVenc">Tercer Vencimiento (días)</Label>
              <Input
                id="terVenc"
                type="number"
                value={formData.terVenc}
                onChange={(e) => handleChange("terVenc", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gratis"
                checked={formData.gratis}
                onCheckedChange={(checked) => handleChange("gratis", checked)}
              />
              <Label htmlFor="gratis" className="cursor-pointer">Gratis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pagoAutomatico"
                checked={formData.pagoAutomatico}
                onCheckedChange={(checked) => handleChange("pagoAutomatico", checked)}
              />
              <Label htmlFor="pagoAutomatico" className="cursor-pointer">Pago Automático</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="envioFacturaAuto"
                checked={formData.envioFacturaAuto}
                onCheckedChange={(checked) => handleChange("envioFacturaAuto", checked)}
              />
              <Label htmlFor="envioFacturaAuto" className="cursor-pointer">Envío Factura Auto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="envioReciboPagoAuto"
                checked={formData.envioReciboPagoAuto}
                onCheckedChange={(checked) => handleChange("envioReciboPagoAuto", checked)}
              />
              <Label htmlFor="envioReciboPagoAuto" className="cursor-pointer">Envío Recibo Auto</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control y Gestión */}
      <Card>
        <CardHeader>
          <CardTitle>Control y Gestión</CardTitle>
          <CardDescription>
            Opciones de control del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bloquear"
                checked={formData.bloquear}
                onCheckedChange={(checked) => handleChange("bloquear", checked)}
              />
              <Label htmlFor="bloquear" className="cursor-pointer">Bloquear</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preAviso"
                checked={formData.preAviso}
                onCheckedChange={(checked) => handleChange("preAviso", checked)}
              />
              <Label htmlFor="preAviso" className="cursor-pointer">Pre Aviso</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="proxMes"
                checked={formData.proxMes}
                onCheckedChange={(checked) => handleChange("proxMes", checked)}
              />
              <Label htmlFor="proxMes" className="cursor-pointer">Próximo Mes</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan y Datos Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Plan y Datos Técnicos</CardTitle>
          <CardDescription>
            Plan contratado y configuración técnica GPON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planId">Plan Contratado</Label>
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
            id="observaciones"
            value={formData.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={4}
            placeholder="Escribe cualquier información adicional relevante..."
          />
        </CardContent>
      </Card>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
