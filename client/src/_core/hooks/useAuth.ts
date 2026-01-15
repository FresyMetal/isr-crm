import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export interface User {
  id: number;
  email: string;
  nombre: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para manejar autenticación
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setState({ user: null, loading: false, error: null });
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token inválido o expirado
        localStorage.removeItem("auth_token");
        setState({ user: null, loading: false, error: null });
        return;
      }

      const user = await response.json();
      setState({ user, loading: false, error: null });
    } catch (error) {
      console.error("Error checking auth:", error);
      setState({ user: null, loading: false, error: "Error de autenticación" });
    }
  }

  async function login(email: string, password: string) {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        setState(prev => ({ ...prev, loading: false, error: error.error || "Error de login" }));
        return false;
      }

      const data = await response.json();
      localStorage.setItem("auth_token", data.token);
      setState({ user: data.user, loading: false, error: null });
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      setState(prev => ({ ...prev, loading: false, error: "Error de conexión" }));
      return false;
    }
  }

  async function logout() {
    try {
      localStorage.removeItem("auth_token");
      setState({ user: null, loading: false, error: null });
      setLocation("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    checkAuth,
  };
}
