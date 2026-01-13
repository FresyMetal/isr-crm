import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ClientesFiltersProps {
  onFilterChange: (filters: any) => void;
  resultCount?: number;
}

export default function ClientesFilters({ onFilterChange, resultCount }: ClientesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    tipoCliente: "",
    estado: "",
    planId: "",
    cobrador: "",
    vendedor: "",
    medioPago: "",
    localidad: "",
    provincia: "",
    bloquear: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  const { data: planes } = trpc.planes.list.useQuery({ activosOnly: true });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Convertir a formato esperado por el backend
    const backendFilters: any = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== "" && v !== "all") {
        if (k === "planId") {
          backendFilters[k] = parseInt(v);
        } else if (k === "bloquear") {
          backendFilters[k] = v === "true";
        } else {
          backendFilters[k] = v;
        }
      }
    });
    
    onFilterChange(backendFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      search: "",
      tipoCliente: "",
      estado: "",
      planId: "",
      cobrador: "",
      vendedor: "",
      medioPago: "",
      localidad: "",
      provincia: "",
      bloquear: "",
      fechaDesde: "",
      fechaHasta: "",
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        {/* Header con búsqueda rápida */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre, email, teléfono, DNI, dirección o código..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avanzados
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        {resultCount !== undefined && (
          <div className="text-sm text-muted-foreground mb-4">
            {resultCount} {resultCount === 1 ? "cliente encontrado" : "clientes encontrados"}
          </div>
        )}

        {/* Filtros avanzados colapsables */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Tipo de Cliente */}
            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select
                value={filters.tipoCliente}
                onValueChange={(value) => handleFilterChange("tipoCliente", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                  <SelectItem value="Autónomo">Autónomo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.estado}
                onValueChange={(value) => handleFilterChange("estado", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Suspendido">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bloqueado */}
            <div className="space-y-2">
              <Label>Bloqueado</Label>
              <Select
                value={filters.bloquear}
                onValueChange={(value) => handleFilterChange("bloquear", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <Label>Plan Contratado</Label>
              <Select
                value={filters.planId}
                onValueChange={(value) => handleFilterChange("planId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {planes?.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medio de Pago */}
            <div className="space-y-2">
              <Label>Medio de Pago</Label>
              <Select
                value={filters.medioPago}
                onValueChange={(value) => handleFilterChange("medioPago", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Caja">Caja</SelectItem>
                  <SelectItem value="Banco">Banco</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cobrador */}
            <div className="space-y-2">
              <Label>Cobrador</Label>
              <Input
                placeholder="Nombre del cobrador"
                value={filters.cobrador}
                onChange={(e) => handleFilterChange("cobrador", e.target.value)}
              />
            </div>

            {/* Vendedor */}
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input
                placeholder="Nombre del vendedor"
                value={filters.vendedor}
                onChange={(e) => handleFilterChange("vendedor", e.target.value)}
              />
            </div>

            {/* Localidad */}
            <div className="space-y-2">
              <Label>Localidad</Label>
              <Input
                placeholder="Localidad"
                value={filters.localidad}
                onChange={(e) => handleFilterChange("localidad", e.target.value)}
              />
            </div>

            {/* Provincia */}
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                placeholder="Provincia"
                value={filters.provincia}
                onChange={(e) => handleFilterChange("provincia", e.target.value)}
              />
            </div>

            {/* Fecha Desde */}
            <div className="space-y-2">
              <Label>Fecha Alta Desde</Label>
              <Input
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => handleFilterChange("fechaDesde", e.target.value)}
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <Label>Fecha Alta Hasta</Label>
              <Input
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => handleFilterChange("fechaHasta", e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
