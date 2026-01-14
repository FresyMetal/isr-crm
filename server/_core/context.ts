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

  // Autenticación OAuth de Manus
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // No autenticado - continuar sin usuario
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
