import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de gestión de facturación automática
 * Permite generar facturas manualmente para clientes activos
 */
export default function Facturacion() {
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Obtener próximo mes para facturación
  const { data: proximoMes } = trpc.facturas.obtenerProximoMes.useQuery();

  // Mutación para generar facturas
  const generarFacturasMutation = trpc.facturas.generarFacturas.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      toast.success(`Facturación completada: ${data.exitosas} exitosas, ${data.fallidas} fallidas`);
      setGenerando(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setGenerando(false);
    },
  });

  const handleGenerarFacturas = async () => {
    if (mes < 1 || mes > 12) {
      toast.error("El mes debe estar entre 1 y 12");
      return;
    }

    if (anio < 2000) {
      toast.error("El año debe ser mayor a 2000");
      return;
    }

    setGenerando(true);
    await generarFacturasMutation.mutateAsync({ mes, anio });
  };

  const handleGenerarProximoMes = async () => {
    if (!proximoMes) return;

    setMes(proximoMes.mes);
    setAnio(proximoMes.anio);
    setGenerando(true);

    await generarFacturasMutation.mutateAsync({
      mes: proximoMes.mes,
      anio: proximoMes.anio,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación Automática</h1>
        <p className="text-muted-foreground mt-2">
          Genera facturas mensuales para todos los clientes activos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Generación Manual */}
        <Card>
          <CardHeader>
            <CardTitle>Generar Facturas Manual</CardTitle>
            <CardDescription>Selecciona mes y año para generar facturas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mes</Label>
              <Input
                id="mes"
                type="number"
                min="1"
                max="12"
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                disabled={generando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                type="number"
                min="2000"
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                disabled={generando}
              />
            </div>

            <Button
              onClick={handleGenerarFacturas}
              disabled={generando}
              className="w-full"
            >
              {generando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Facturas
            </Button>
          </CardContent>
        </Card>

        {/* Próximo Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Próximo Mes de Facturación</CardTitle>
            <CardDescription>Generar facturas para el próximo mes automáticamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximoMes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Próximo mes: <strong>{proximoMes.mes}/{proximoMes.anio}</strong>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGenerarProximoMes}
              disabled={generando || !proximoMes}
              className="w-full"
              variant="outline"
            >
              {generando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Próximo Mes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultado de la Facturación */}
      {resultado && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Facturación Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{resultado.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturas Exitosas</p>
                <p className="text-2xl font-bold text-green-600">{resultado.exitosas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturas Fallidas</p>
                <p className="text-2xl font-bold text-red-600">{resultado.fallidas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-2xl font-bold">{mes}/{anio}</p>
              </div>
            </div>

            {resultado.facturas && resultado.facturas.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Detalles de Facturas</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resultado.facturas.map((factura: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-white rounded border"
                    >
                      <span className="text-sm">
                        Cliente {factura.clienteId}: {factura.numeroFactura}
                      </span>
                      <span className={`text-sm font-semibold ${factura.exitosa ? 'text-green-600' : 'text-red-600'}`}>
                        {factura.exitosa ? '✓' : '✗'} {factura.total}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setResultado(null)}
              variant="outline"
              className="w-full"
            >
              Limpiar Resultado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Información sobre Facturación Automática */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Facturación Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Características:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Se genera automáticamente el 1º de cada mes a las 02:00 AM</li>
            <li>Solo se facturan clientes en estado "activo"</li>
            <li>Se calcula automáticamente basándose en los planes contratados</li>
            <li>Se crea un concepto por cada servicio activo del cliente</li>
            <li>El propietario recibe una notificación al completarse</li>
            <li>Las facturas se generan con estado "pendiente"</li>
            <li>Se evita duplicar facturas para el mismo mes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
