import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { eq, sql } from "drizzle-orm";
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Usuario y contraseña requeridos" });
    }

    // Verificar contraseña (para demo, aceptamos "admin123" para cualquier usuario)
    if (password !== "admin123") {
      return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ message: "Base de datos no disponible" });
    }

    const now = new Date();
    const userName = username.charAt(0).toUpperCase() + username.slice(1);
    
    // Estrategia: Usar SQL raw con INSERT ... ON DUPLICATE KEY UPDATE
    // Esto es atómico y evita race conditions
    try {
      await db.execute(sql`
        INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
        VALUES (${username}, ${userName}, ${username}, 'local', 'admin', ${now})
        ON DUPLICATE KEY UPDATE
          lastSignedIn = VALUES(lastSignedIn)
      `);
    } catch (insertError: any) {
      console.error("Error en INSERT ON DUPLICATE KEY UPDATE:", insertError);
      return res.status(500).json({ message: "Error al crear/actualizar usuario" });
    }

    // Obtener el usuario (ahora garantizado que existe)
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.openId, username))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(500).json({ message: "Error al obtener usuario después de crear/actualizar" });
    }

    const user = userResult[0];

    // Generar token
    const token = generateToken(user.id, user.email || username);

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
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error al iniciar sesión: " + error.message });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post("/logout", (req: Request, res: Response) => {
  // En un sistema con tokens, el logout se maneja en el cliente
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
