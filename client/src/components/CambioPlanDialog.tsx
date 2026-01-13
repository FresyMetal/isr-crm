import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CambioPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: number;
  planActualId?: number;
  onSuccess: () => void;
}

export default function CambioPlanDialog({
  open,
  onOpenChange,
  clienteId,
  planActualId,
  onSuccess,
}: CambioPlanDialogProps) {
  const [nuevoPlanId, setNuevoPlanId] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarProrrateo, setMostrarProrrateo] = useState(false);

  const utils = trpc.useUtils();
  const { data: planes } = trpc.planes.list.useQuery({ activosOnly: true });

  // Calcular prorrateo cuando se selecciona un plan
  const { data: prorrateo, isLoading: calculandoProrrateo } = trpc.clientes.calcularProrrateo.useQuery(
    {
      clienteId,
      nuevoPlanId: parseInt(nuevoPlanId),
    },
    {
      enabled: !!nuevoPlanId && parseInt(nuevoPlanId) !== planActualId,
    }
  );

  const cambiarPlanMutation = trpc.clientes.cambiarPlan.useMutation({
    onSuccess: (data) => {
      toast.success(data.mensaje || "Plan cambiado correctamente");
      utils.clientes.getById.invalidate({ id: clienteId });
      utils.clientes.getActivity.invalidate({ id: clienteId });
      utils.clientes.getHistorialCambiosPlan.invalidate({ clienteId });
      onSuccess();
      onOpenChange(false);
      // Resetear formulario
      setNuevoPlanId("");
      setMotivo("");
      setObservaciones("");
      setMostrarProrrateo(false);
    },
    onError: (error) => {
      toast.error(`Error al cambiar plan: ${error.message}`);
    },
  });

  useEffect(() => {
    if (prorrateo) {
      setMostrarProrrateo(true);
    }
  }, [prorrateo]);

  const handleCambiarPlan = () => {
    if (!nuevoPlanId) {
      toast.error("Selecciona un plan");
      return;
    }

    cambiarPlanMutation.mutate({
      clienteId,
      nuevoPlanId: parseInt(nuevoPlanId),
      motivo: motivo || undefined,
      observaciones: observaciones || undefined,
    });
  };

  const planesDisponibles = planes?.filter((p) => p.id !== planActualId) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Plan del Cliente</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo plan y revisa el cálculo de prorrateo antes de confirmar el cambio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Nuevo Plan *</Label>
            <Select value={nuevoPlanId} onValueChange={setNuevoPlanId}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {planesDisponibles.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.nombre} - €{Number(plan.precioMensual).toFixed(2)}/mes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vista previa del prorrateo */}
          {mostrarProrrateo && prorrateo && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plan Actual</p>
                  <p className="font-medium">
                    €{prorrateo.planActual?.precio.toFixed(2) || "0.00"}/mes
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Plan Nuevo</p>
                  <p className="font-medium">€{prorrateo.planNuevo.precio.toFixed(2)}/mes</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Días transcurridos del período:</span>
                  <span className="font-medium">{prorrateo.prorrateo.diasTranscurridos} días</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Días restantes del período:</span>
                  <span className="font-medium">{prorrateo.prorrateo.diasRestantes} días</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total días del período:</span>
                  <span className="font-medium">{prorrateo.prorrateo.diasTotalesMes} días</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-2">
                    {prorrateo.prorrateo.ajusteProrrateo > 0 ? (
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    ) : prorrateo.prorrateo.ajusteProrrateo < 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <Minus className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Ajuste de Prorrateo</p>
                      <p className="text-xs text-muted-foreground">
                        {prorrateo.prorrateo.ajusteProrrateo > 0
                          ? "Cargo adicional"
                          : prorrateo.prorrateo.ajusteProrrateo < 0
                          ? "Crédito a favor"
                          : "Sin ajuste"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        prorrateo.prorrateo.ajusteProrrateo > 0
                          ? "text-orange-500"
                          : prorrateo.prorrateo.ajusteProrrateo < 0
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {prorrateo.prorrateo.ajusteProrrateo > 0 ? "+" : ""}
                      €{Math.abs(prorrateo.prorrateo.ajusteProrrateo).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{prorrateo.prorrateo.descripcion}</p>
              </div>
            </div>
          )}

          {calculandoProrrateo && nuevoPlanId && (
            <div className="text-center py-4 text-muted-foreground">
              Calculando prorrateo...
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Cambio</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Solicitud del cliente, upgrade por mayor velocidad..."
              rows={2}
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre el cambio..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCambiarPlan}
            disabled={!nuevoPlanId || cambiarPlanMutation.isPending || calculandoProrrateo}
          >
            {cambiarPlanMutation.isPending ? "Cambiando..." : "Confirmar Cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
