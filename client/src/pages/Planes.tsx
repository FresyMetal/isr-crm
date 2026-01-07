import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Wifi, Smartphone, Tv, Phone } from "lucide-react";

const tipoIcons: Record<string, any> = {
  fibra: Wifi,
  movil: Smartphone,
  tv: Tv,
  telefonia_fija: Phone,
  combo: Wifi,
};

export default function Planes() {
  const { data: planes, isLoading } = trpc.planes.list.useQuery({ activosOnly: true });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes y Servicios</h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de planes disponibles para contratar
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Cargando planes...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {planes?.map((plan) => {
              const Icon = tipoIcons[plan.tipo] || Wifi;
              return (
                <Card key={plan.id} className={plan.destacado ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      {plan.destacado && (
                        <Badge variant="default">Destacado</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{plan.nombre}</CardTitle>
                    <CardDescription>{plan.descripcion}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.tipo === "fibra" && plan.velocidadBajada && (
                      <div>
                        <p className="text-sm text-muted-foreground">Velocidad</p>
                        <p className="font-medium">
                          {plan.velocidadBajada} Mbps / {plan.velocidadSubida} Mbps
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{plan.precioMensual}€</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      {plan.precioPromocion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Precio promocional durante {plan.mesesPromocion} meses
                        </p>
                      )}
                      {plan.precioInstalacion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Instalación: {plan.precioInstalacion}€
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
