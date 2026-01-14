import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Usuario anónimo por defecto - sin autenticación
  const user: User = {
    id: 1,
    openId: "anon",
    name: "Administrador",
    email: "admin@isrcomunicaciones.es",
    loginMethod: null,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
