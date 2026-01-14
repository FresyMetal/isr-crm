import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Sin autenticación - crear usuario anónimo
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const anonUser = await db.select().from(users).where(eq(users.email, "admin@isrcomunicaciones.es")).limit(1);
  
  let user: User;
  if (anonUser.length > 0) {
    user = anonUser[0];
  } else {
    // Si no existe el usuario admin, crear uno temporal
    user = {
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
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
