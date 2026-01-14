import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";

const router = Router();

/**
 * Generar token JWT simple (base64)
 */
function generateToken(userId: number, username: string): string {
  const payload = {
    userId,
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * POST /api/auth/login
 * Autenticar usuario con usuario/contraseña
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    console.log("[auth-routes] Login attempt:", { username: req.body.username });
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("[auth-routes] Missing credentials");
      return res.status(400).json({ message: "Usuario y contraseña requeridos" });
    }

    // Verificar contraseña (para demo, aceptamos "admin123" para cualquier usuario)
    if (password !== "admin123") {
      console.log("[auth-routes] Invalid password");
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    console.log("[auth-routes] Getting database connection...");
    const db = await getDb();
    if (!db) {
      console.log("[auth-routes] Database not available");
      return res.status(500).json({ message: "Base de datos no disponible" });
    }
    console.log("[auth-routes] Database connection OK");

    const now = new Date();
    const userName = username.charAt(0).toUpperCase() + username.slice(1);
    
    console.log("[auth-routes] Searching for existing user...");
    // SOLUCIÓN SIMPLE: Buscar primero, luego actualizar o crear
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, username))
      .limit(1);

    console.log("[auth-routes] Existing users found:", existingUsers.length);
    let user;
    
    if (existingUsers.length > 0) {
      // Usuario existe: actualizar lastSignedIn
      console.log("[auth-routes] Updating existing user...");
      await db
        .update(users)
        .set({ lastSignedIn: now })
        .where(eq(users.openId, username));
      
      user = existingUsers[0];
      console.log("[auth-routes] User updated successfully");
    } else {
      // Usuario no existe: crear nuevo
      console.log("[auth-routes] Creating new user...");
      const result = await db.insert(users).values({
        openId: username,
        name: userName,
        email: username,
        loginMethod: 'local',
        role: 'admin',
        lastSignedIn: now,
      });
      
      console.log("[auth-routes] User created, fetching...");
      // Obtener el usuario recién creado
      const newUsers = await db
        .select()
        .from(users)
        .where(eq(users.openId, username))
        .limit(1);
      
      user = newUsers[0];
      console.log("[auth-routes] New user fetched successfully");
    }

    if (!user) {
      console.log("[auth-routes] ERROR: User is null/undefined");
      return res.status(500).json({ message: "Error al obtener usuario" });
    }

    console.log("[auth-routes] Generating token for user:", user.id);
    // Generar token
    const token = generateToken(user.id, user.email || username);

    console.log("[auth-routes] Login successful, sending response");
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("[auth-routes] ERROR in login:", error);
    console.error("[auth-routes] Error stack:", error.stack);
    res.status(500).json({ message: "Error al iniciar sesión: " + error.message });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true, message: "Sesión cerrada" });
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario actual
 */
router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Token requerido" });
    }

    // Decodificar token
    const payload = JSON.parse(Buffer.from(token, "base64").toString());

    // Verificar expiración
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Token expirado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ message: "Base de datos no disponible" });
    }

    // Obtener usuario
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error: any) {
    console.error("Error en /me:", error);
    res.status(401).json({ message: "Token inválido" });
  }
});

export default router;
