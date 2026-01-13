import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Primero intentar autenticación OAuth de Manus
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Si falla OAuth, intentar autenticación local con token
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      
      try {
        // Decodificar token local
        const payload = JSON.parse(Buffer.from(token, "base64").toString());
        
        // Verificar expiración
        if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
          // Token válido, obtener usuario de la base de datos
          const db = await getDb();
          if (db && payload.userId) {
            const userResult = await db
              .select()
              .from(users)
              .where(eq(users.id, payload.userId))
              .limit(1);
            
            if (userResult.length > 0) {
              user = userResult[0];
            }
          }
        }
      } catch (tokenError) {
        // Token inválido, continuar sin usuario
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
