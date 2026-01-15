/**
 * Script para crear usuario administrador por defecto
 * Ejecutar con: node --loader tsx server/create-admin.ts
 */

import { getDb } from "./db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth-utils.js";

async function createAdmin() {
  try {
    console.log("Creando usuario administrador...");

    const db = await getDb();
    if (!db) {
      console.error("Error: No se pudo conectar a la base de datos");
      process.exit(1);
    }

    // Verificar si ya existe un admin
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@isrcomunicaciones.es"))
      .limit(1);

    if (existingAdmin) {
      console.log("El usuario administrador ya existe");
      return;
    }

    // Crear hash de la contraseña
    const passwordHash = await hashPassword("admin123");

    // Insertar usuario administrador
    await db.insert(users).values({
      openId: `admin-${Date.now()}`,
      name: "Administrador",
      email: "admin@isrcomunicaciones.es",
      passwordHash,
      loginMethod: "local",
      role: "admin",
    });

    console.log("✓ Usuario administrador creado exitosamente");
    console.log("  Email: admin@isrcomunicaciones.es");
    console.log("  Contraseña: admin123");
    console.log("  ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login");
  } catch (error) {
    console.error("Error al crear usuario administrador:", error);
    process.exit(1);
  }
}

createAdmin();
