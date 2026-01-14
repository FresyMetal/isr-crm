import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleLogin = () => {
    // Redirigir al portal OAuth de Manus
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="bg-blue-600 text-white p-3 rounded-lg">
                <Wifi className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">ISR Comunicaciones</CardTitle>
            <CardDescription>CRM de Gestión de Clientes</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full"
                size="lg"
              >
                Iniciar Sesión con Manus
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Serás redirigido al portal seguro de autenticación</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          © 2024 ISR Comunicaciones. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
