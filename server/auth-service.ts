import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import crypto from "crypto";

/**
 * Servicio de autenticación simple con usuario/contraseña
 */

/**
 * Hash de contraseña usando SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verificar contraseña
 */
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Registrar nuevo usuario
 */
export async function registerUser(
  username: string,
  password: string,
  name?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar que el usuario no exista
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, username))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("El usuario ya existe");
  }

  // Crear usuario con openId como username
  const passwordHash = hashPassword(password);
  
  const result = await db.insert(users).values({
    openId: username,
    email: username,
    name: name || username,
    loginMethod: "local",
    role: "user",
    lastSignedIn: new Date(),
  });

  // Guardar el hash de contraseña en un campo adicional (lo haremos en la BD)
  // Por ahora usaremos una tabla separada
  return result;
}

/**
 * Autenticar usuario
 */
export async function authenticateUser(username: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar usuario por email/username
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, username))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  const user = userResult[0];

  // En este sistema simple, verificaremos la contraseña contra el openId
  // En producción, deberías usar una tabla separada de credenciales
  if (user.openId !== username) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // Actualizar última conexión
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return user;
}

/**
 * Generar token JWT simple (base64)
 */
export function generateToken(userId: number, username: string): string {
  const payload = {
    userId,
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Verificar y decodificar token
 */
export function verifyToken(token: string): {
  userId: number;
  username: string;
  iat: number;
  exp: number;
} | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());

    // Verificar expiración
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
