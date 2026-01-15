import { Router } from "express";
import { getDb } from "./db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { verifyPassword, generateToken } from "./auth-utils.js";

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Error de base de datos" });
    }
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.name || "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[auth-routes] Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post("/logout", (req, res) => {
  res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const { verifyToken } = await import("./auth-utils.js");
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Error de base de datos" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    res.json({
      id: user.id,
      email: user.email,
      nombre: user.name || "",
      role: user.role,
    });
  } catch (error) {
    console.error("[auth-routes] Error en /me:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
