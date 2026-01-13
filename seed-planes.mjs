/**
 * Script de seed para crear planes de fibra óptica de ejemplo
 * Usa el procedimiento tRPC directamente insertando en la base de datos
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

// Planes de ejemplo de fibra óptica
const planesEjemplo = [
  {
    nombre: 'Fibra 100 Mb',
    descripcion: 'Plan básico de fibra óptica con 100 Mb simétricos ideal para navegación y streaming',
    tipo: 'fibra',
    velocidadBajada: 100,
    velocidadSubida: 100,
    precioMensual: '29.99',
    precioInstalacion: '0.00',
    activo: true,
    destacado: false
  },
  {
    nombre: 'Fibra 300 Mb',
    descripcion: 'Plan intermedio con 300 Mb simétricos perfecto para familias y teletrabajo',
    tipo: 'fibra',
    velocidadBajada: 300,
    velocidadSubida: 300,
    precioMensual: '39.99',
    precioInstalacion: '0.00',
    activo: true,
    destacado: true
  },
  {
    nombre: 'Fibra 600 Mb',
    descripcion: 'Plan avanzado con 600 Mb simétricos para usuarios exigentes y gaming',
    tipo: 'fibra',
    velocidadBajada: 600,
    velocidadSubida: 600,
    precioMensual: '49.99',
    precioInstalacion: '0.00',
    activo: true,
    destacado: true
  },
  {
    nombre: 'Fibra 1 Gb',
    descripcion: 'Plan premium con 1 Gb simétrico para máximo rendimiento y múltiples dispositivos',
    tipo: 'fibra',
    velocidadBajada: 1000,
    velocidadSubida: 1000,
    precioMensual: '59.99',
    precioInstalacion: '49.99',
    activo: true,
    destacado: false
  },
  {
    nombre: 'Fibra Empresarial 500 Mb',
    descripcion: 'Plan empresarial con 500 Mb simétricos, IP fija y soporte prioritario',
    tipo: 'fibra',
    velocidadBajada: 500,
    velocidadSubida: 500,
    precioMensual: '79.99',
    precioInstalacion: '99.99',
    activo: true,
    destacado: false
  }
];

async function seed() {
  console.log('🌱 Iniciando seed de planes de fibra óptica...\n');

  let connection;
  
  try {
    // Conectar a la base de datos usando la URL del entorno
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno');
    }

    connection = await mysql.createConnection(databaseUrl);
    const db = drizzle(connection, { schema, mode: 'default' });

    // Verificar si ya existen planes
    const planesExistentes = await db.select().from(schema.planes);
    
    if (planesExistentes.length > 0) {
      console.log(`⚠️  Ya existen ${planesExistentes.length} planes en la base de datos.`);
      console.log('Los planes de ejemplo se añadirán de todas formas.\n');
    }

    // Insertar planes
    let insertados = 0;
    for (const plan of planesEjemplo) {
      try {
        await db.insert(schema.planes).values(plan);
        console.log(`✅ Plan creado: ${plan.nombre} - ${plan.precioMensual}€/mes - ${plan.velocidadBajada}/${plan.velocidadSubida} Mb`);
        insertados++;
      } catch (error) {
        console.error(`❌ Error al insertar plan ${plan.nombre}:`, error.message);
      }
    }

    console.log(`\n🎉 Seed completado: ${insertados} planes insertados correctamente.`);

    // Mostrar resumen
    const totalPlanes = await db.select().from(schema.planes);
    console.log(`📊 Total de planes en la base de datos: ${totalPlanes.length}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
