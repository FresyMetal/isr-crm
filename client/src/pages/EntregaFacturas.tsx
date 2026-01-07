import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail, FileText } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de gestión de entrega de facturas (PDF + Email)
 * Permite generar PDFs y enviar facturas por email
 */
export default function EntregaFacturas() {
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  // Mutación para entregar facturas del mes
  const entregarMutation = trpc.invoiceDelivery.entregarFacturasDelMes.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      toast.success(
        `Entrega completada: ${data.pdfGenerados} PDFs, ${data.emailsEnviados} emails`
      );
      setGenerando(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setGenerando(false);
    },
  });

  const handleEntregarFacturas = async () => {
    if (mes < 1 || mes > 12) {
      toast.error("El mes debe estar entre 1 y 12");
      return;
    }

    if (anio < 2000) {
      toast.error("El año debe ser mayor a 2000");
      return;
    }

    setGenerando(true);
    await entregarMutation.mutateAsync({ mes, anio });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entrega de Facturas</h1>
        <p className="text-muted-foreground mt-2">
          Genera PDFs y envía facturas por correo electrónico a tus clientes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Generar PDFs y Enviar Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generar y Enviar
            </CardTitle>
            <CardDescription>Selecciona mes y año para procesar facturas</CardDescription>
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
              onClick={handleEntregarFacturas}
              disabled={generando}
              className="w-full"
            >
              {generando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar PDFs y Enviar
            </Button>
          </CardContent>
        </Card>

        {/* Información */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Proceso Automático</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Qué ocurre:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Se generan PDFs profesionales de cada factura</li>
              <li>Los PDFs se guardan en almacenamiento en la nube (S3)</li>
              <li>Se envía un email a cada cliente con la factura adjunta</li>
              <li>Se registra el estado de cada entrega</li>
              <li>Recibes una notificación con el resumen</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Resultado de la Entrega */}
      {resultado && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Entrega Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Facturas</p>
                <p className="text-2xl font-bold">{resultado.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PDFs Generados</p>
                <p className="text-2xl font-bold text-green-600">{resultado.pdfGenerados}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold text-green-600">{resultado.emailsEnviados}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-2xl font-bold">{mes}/{anio}</p>
              </div>
            </div>

            {resultado.entregas && resultado.entregas.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Detalles de Entregas</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {resultado.entregas.map((entrega: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entrega.numeroFactura}</p>
                        <p className="text-xs text-muted-foreground">
                          {entrega.pdfGenerado && <span className="text-green-600">✓ PDF</span>}
                          {entrega.pdfGenerado && entrega.emailEnviado && <span className="mx-1">•</span>}
                          {entrega.emailEnviado && <span className="text-green-600">✓ Email</span>}
                          {!entrega.pdfGenerado && <span className="text-red-600">✗ Error</span>}
                        </p>
                      </div>
                      {entrega.error && (
                        <span className="text-xs text-red-600 ml-2">{entrega.error}</span>
                      )}
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

      {/* Características */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generación de PDFs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Se generan facturas en formato PDF profesional con:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Datos de la empresa y cliente</li>
              <li>Detalles de servicios y precios</li>
              <li>Cálculo automático de totales</li>
              <li>Información de contacto</li>
              <li>Diseño profesional y limpio</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envío de Emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Cada cliente recibe un email con:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Mensaje personalizado</li>
              <li>PDF de la factura adjunto</li>
              <li>Información de métodos de pago</li>
              <li>Datos de contacto de soporte</li>
              <li>Acceso a portal de cliente</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de Email */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Configuración de Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Para que el envío de emails funcione correctamente, configura las siguientes variables de entorno en tu servidor:
            </AlertDescription>
          </Alert>
          <div className="bg-white p-3 rounded font-mono text-xs space-y-1">
            <p>EMAIL_HOST=smtp.ejemplo.com</p>
            <p>EMAIL_PORT=587</p>
            <p>EMAIL_USER=tu-email@ejemplo.com</p>
            <p>EMAIL_PASSWORD=tu-contraseña</p>
            <p>EMAIL_FROM=noreply@isrcomunicaciones.es</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
