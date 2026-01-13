import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar, User } from "lucide-react";

interface HistorialCambio {
  id: number;
  clienteId: number;
  planAnteriorId: number | null;
  planNuevoId: number;
  precioAnterior: string | null;
  precioNuevo: string;
  diasTranscurridos: number | null;
  diasRestantes: number | null;
  ajusteProrrateo: string | null;
  fechaCambio: Date;
  fechaAplicacion: Date;
  motivo: string | null;
  observaciones: string | null;
  realizadoPor: number | null;
  createdAt: Date;
  planAnterior?: { nombre: string } | null;
  planNuevo?: { nombre: string };
  usuario?: { name: string } | null;
}

interface HistorialCambiosPlanTableProps {
  cambios: HistorialCambio[];
}

export default function HistorialCambiosPlanTable({ cambios }: HistorialCambiosPlanTableProps) {
  if (!cambios || cambios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cambios de Plan</CardTitle>
          <CardDescription>
            Registro cronológico de todos los cambios de plan realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay cambios de plan registrados para este cliente
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAjusteIcon = (ajuste: number) => {
    if (ajuste > 0) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (ajuste < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getAjusteBadge = (ajuste: number) => {
    if (ajuste > 0) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          +€{ajuste.toFixed(2)}
        </Badge>
      );
    }
    if (ajuste < 0) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          €{ajuste.toFixed(2)}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        €0.00
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cambios de Plan</CardTitle>
        <CardDescription>
          Registro cronológico de todos los cambios de plan realizados ({cambios.length} cambio{cambios.length !== 1 ? "s" : ""})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cambios.map((cambio, index) => {
            const ajuste = Number(cambio.ajusteProrrateo);
            const esUpgrade = ajuste > 0;
            const esDowngrade = ajuste < 0;

            return (
              <div
                key={cambio.id}
                className={`border rounded-lg p-4 ${
                  index === 0 ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {/* Encabezado del cambio */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getAjusteIcon(ajuste)}
                    <div>
                      <p className="font-medium">
                        {cambio.planAnterior?.nombre || "Sin plan"} → {cambio.planNuevo?.nombre}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(cambio.fechaCambio)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getAjusteBadge(ajuste)}
                    {index === 0 && (
                      <Badge variant="default" className="ml-2">
                        Más reciente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Detalles del cambio */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Precio Anterior</p>
                    <p className="font-medium">
                      €{cambio.precioAnterior ? Number(cambio.precioAnterior).toFixed(2) : "0.00"}/mes
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Precio Nuevo</p>
                    <p className="font-medium">€{Number(cambio.precioNuevo).toFixed(2)}/mes</p>
                  </div>
                  {cambio.diasTranscurridos !== null && (
                    <div>
                      <p className="text-muted-foreground">Días Transcurridos</p>
                      <p className="font-medium">{cambio.diasTranscurridos} días</p>
                    </div>
                  )}
                  {cambio.diasRestantes !== null && (
                    <div>
                      <p className="text-muted-foreground">Días Restantes</p>
                      <p className="font-medium">{cambio.diasRestantes} días</p>
                    </div>
                  )}
                </div>

                {/* Tipo de cambio */}
                {(esUpgrade || esDowngrade) && (
                  <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
                    <p className="text-muted-foreground">
                      {esUpgrade && (
                        <>
                          <span className="font-medium text-orange-500">Upgrade:</span> Se cobró un
                          ajuste de €{ajuste.toFixed(2)} por los {cambio.diasRestantes} días
                          restantes del período.
                        </>
                      )}
                      {esDowngrade && (
                        <>
                          <span className="font-medium text-green-500">Downgrade:</span> Se aplicó
                          un crédito de €{Math.abs(ajuste).toFixed(2)} a favor del cliente por los{" "}
                          {cambio.diasRestantes} días restantes.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Motivo */}
                {cambio.motivo && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">Motivo:</p>
                    <p className="text-sm">{cambio.motivo}</p>
                  </div>
                )}

                {/* Observaciones */}
                {cambio.observaciones && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Observaciones:</p>
                    <p className="text-sm">{cambio.observaciones}</p>
                  </div>
                )}

                {/* Usuario que realizó el cambio */}
                {cambio.usuario && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Realizado por: {cambio.usuario.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
