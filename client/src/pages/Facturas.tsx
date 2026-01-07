import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { FileText } from "lucide-react";

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const estadoColors: Record<string, string> = {
  pendiente: "status-pending",
  pagada: "status-active",
  vencida: "status-inactive",
  cancelada: "bg-gray-100",
};

export default function Facturas() {
  const { data: facturas, isLoading } = trpc.facturas.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de facturación y pagos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Facturas Pendientes</CardTitle>
            <CardDescription>
              {facturas?.length || 0} facturas encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando facturas...
              </div>
            ) : !facturas || facturas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay facturas</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Las facturas aparecerán aquí cuando se generen
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturas.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell className="font-medium font-mono">
                        {factura.numeroFactura}
                      </TableCell>
                      <TableCell>Cliente #{factura.clienteId}</TableCell>
                      <TableCell>
                        {new Date(factura.fechaEmision).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(factura.fechaVencimiento).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {factura.total}€
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${estadoColors[factura.estado]} border`}
                        >
                          {estadoLabels[factura.estado]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
