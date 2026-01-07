import { describe, expect, it } from "vitest";
import { getPSOClient } from "./pso-client";

/**
 * Test de integración con PSO Anvimur
 * NOTA: Este test solo funcionará en entornos con acceso a la red local donde está PSO
 * En entornos de desarrollo en la nube, este test fallará por diseño
 */
describe("PSO Integration", () => {
  it.skip("should successfully connect to PSO API with provided credentials", async () => {
    const psoClient = getPSOClient();
    
    // Intentar obtener la lista de OLTs como test de conectividad
    const response = await psoClient.obtenerOLTs();
    
    // Verificar que la respuesta es exitosa
    expect(response).toBeDefined();
    expect(response.codigo).toBeDefined();
    
    // Si el código es 200-299, la conexión es exitosa
    // Si es 401 o 403, las credenciales son incorrectas
    if (response.codigo === 401 || response.codigo === 403) {
      throw new Error("Credenciales PSO incorrectas: acceso denegado");
    }
    
    // Verificar que la respuesta es exitosa (código 2xx)
    expect(response.codigo).toBeGreaterThanOrEqual(200);
    expect(response.codigo).toBeLessThan(300);
  }, 30000); // Timeout de 30 segundos para la conexión
});
