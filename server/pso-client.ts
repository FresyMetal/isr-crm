/**
 * Cliente de integración con PSO System v5 de Anvimur
 * API REST para gestión de red GPON y aprovisionamiento de servicios
 */

import axios, { AxiosInstance } from 'axios';
import { getDb } from './db';
import { logsPSO } from '../drizzle/schema';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface PSOConfig {
  baseURL: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface PSOResponse<T = any> {
  codigo: number;
  mensaje: string;
  datos?: T;
}

export interface ONTInfo {
  sn: string;
  mac?: string;
  modelo?: string;
  estado: string;
  perfilVelocidad?: string;
  perfilUsuario?: string;
  olt?: string;
  pon?: string;
  ipFija?: string;
  estadoConexion?: 'online' | 'offline';
  potenciaSenal?: number;
}

export interface AgregarONTParams {
  sn: string;
  perfilVelocidad: string;
  perfilUsuario: string;
  olt: string;
  pon: string;
  vlan?: string;
  descripcion?: string;
}

export interface ModificarONTParams {
  sn: string;
  perfilVelocidad?: string;
  perfilUsuario?: string;
  vlan?: string;
  ipFija?: string;
}

// ============================================================================
// CÓDIGOS DE RESPUESTA PSO
// ============================================================================

export const PSO_CODES = {
  // Éxito
  SUCCESS: 200,
  SUCCESS_CREATED: 201,
  SUCCESS_UPDATED: 202,
  
  // Errores de autenticación
  AUTH_FAILED: 401,
  FORBIDDEN: 403,
  
  // Errores de PSO
  OLT_BLOQUEADA: 601,
  TIMEOUT: 602,
  ONT_DUPLICADA: 603,
  ONT_NO_ENCONTRADA: 604,
  PERFIL_NO_EXISTE: 605,
  ERROR_CONEXION_OLT: 606,
  PARAMETROS_INVALIDOS: 607,
  ONT_YA_REGISTRADA: 608,
  ERROR_DESCONOCIDO: 699,
} as const;

// ============================================================================
// CLIENTE PSO
// ============================================================================

export class PSOClient {
  private client: AxiosInstance;
  private config: PSOConfig;

  constructor(config: PSOConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      auth: {
        username: this.config.username,
        password: this.config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Registra la operación en la base de datos para auditoría
   */
  private async logOperacion(
    operacion: string,
    clienteId: number | null,
    requestPayload: any,
    response: any,
    exitoso: boolean,
    usuarioId?: number
  ): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db.insert(logsPSO).values({
        clienteId,
        operacion,
        requestPayload: JSON.stringify(requestPayload),
        codigoRespuesta: response?.codigo || null,
        respuesta: JSON.stringify(response),
        exitoso,
        mensajeError: exitoso ? null : response?.mensaje || 'Error desconocido',
        intentos: 1,
        usuarioId: usuarioId || null,
      });
    } catch (error) {
      console.error('[PSO] Error al registrar log:', error);
    }
  }

  /**
   * Realiza una petición a la API de PSO
   */
  private async request<T = any>(
    operacion: string,
    params: Record<string, any>,
    clienteId?: number,
    usuarioId?: number
  ): Promise<PSOResponse<T>> {
    try {
      const payload = {
        operacion,
        ...params,
      };

      const response = await this.client.post<PSOResponse<T>>('/php/manejador.php', payload);
      
      const exitoso = response.data.codigo >= 200 && response.data.codigo < 300;
      
      await this.logOperacion(
        operacion,
        clienteId || null,
        payload,
        response.data,
        exitoso,
        usuarioId
      );

      return response.data;
    } catch (error: any) {
      const errorResponse = {
        codigo: PSO_CODES.ERROR_DESCONOCIDO,
        mensaje: error.message || 'Error de conexión con PSO',
      };

      await this.logOperacion(
        operacion,
        clienteId || null,
        params,
        errorResponse,
        false,
        usuarioId
      );

      throw new Error(`Error en operación PSO ${operacion}: ${error.message}`);
    }
  }

  // ============================================================================
  // OPERACIONES DE GESTIÓN DE ONTs
  // ============================================================================

  /**
   * Agregar una nueva ONT al sistema GPON
   */
  async agregarONT(params: AgregarONTParams, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('añadir_ont', params, clienteId, usuarioId);
  }

  /**
   * Eliminar una ONT del sistema por número de serie
   */
  async eliminarONT(sn: string, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('eliminar_ont_por_sn', { sn }, clienteId, usuarioId);
  }

  /**
   * Modificar configuración de una ONT existente
   */
  async modificarONT(params: ModificarONTParams, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('modificar_ont', params, clienteId, usuarioId);
  }

  /**
   * Obtener información completa de una ONT por número de serie
   */
  async obtenerInfoONT(sn: string, clienteId?: number): Promise<PSOResponse<ONTInfo>> {
    return this.request<ONTInfo>('obtener_informacion_ont_por_sn', { sn }, clienteId);
  }

  /**
   * Obtener todas las ONTs de una OLT específica
   */
  async obtenerONTsDeOLT(olt: string): Promise<PSOResponse<ONTInfo[]>> {
    return this.request<ONTInfo[]>('obtener_todas_onts_olt', { olt });
  }

  /**
   * Obtener estados de conexión de todas las ONTs de una OLT
   */
  async obtenerEstadosONTs(olt: string): Promise<PSOResponse<{ sn: string; estado: string }[]>> {
    return this.request('obtener_estados_onts_olt', { olt });
  }

  /**
   * Obtener ONTs sin registrar (disponibles para asignar)
   */
  async obtenerONTsSinRegistrar(olt: string): Promise<PSOResponse<{ sn: string; mac: string }[]>> {
    return this.request('obtener_onts_sin_registrar', { olt });
  }

  // ============================================================================
  // OPERACIONES REMOTAS SOBRE ONTs
  // ============================================================================

  /**
   * Reiniciar una ONT remotamente
   */
  async reiniciarONT(sn: string, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('reiniciar_ont', { sn }, clienteId, usuarioId);
  }

  /**
   * Reset de fábrica de una ONT
   */
  async resetFactoriaONT(sn: string, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('reset_factoria_ont', { sn }, clienteId, usuarioId);
  }

  /**
   * Obtener logs de una ONT
   */
  async obtenerLogsONT(sn: string, clienteId?: number): Promise<PSOResponse<string[]>> {
    return this.request<string[]>('obtener_logs_ont', { sn }, clienteId);
  }

  /**
   * Asignar IP fija a una ONT
   */
  async asignarIPFija(sn: string, ip: string, clienteId?: number, usuarioId?: number): Promise<PSOResponse> {
    return this.request('asignar_ip_fija', { sn, ip }, clienteId, usuarioId);
  }

  // ============================================================================
  // GESTIÓN DE PERFILES
  // ============================================================================

  /**
   * Obtener todos los perfiles de velocidad disponibles
   */
  async obtenerPerfilesVelocidad(): Promise<PSOResponse<{ nombre: string; bajada: number; subida: number }[]>> {
    return this.request('obtener_perfiles_velocidad', {});
  }

  /**
   * Obtener todos los perfiles de usuario disponibles
   */
  async obtenerPerfilesUsuario(): Promise<PSOResponse<{ nombre: string; descripcion: string }[]>> {
    return this.request('obtener_perfiles_usuario', {});
  }

  /**
   * Crear un nuevo perfil de velocidad
   */
  async crearPerfilVelocidad(
    nombre: string,
    bajada: number,
    subida: number,
    usuarioId?: number
  ): Promise<PSOResponse> {
    return this.request('crear_perfil_velocidad', { nombre, bajada, subida }, undefined, usuarioId);
  }

  // ============================================================================
  // INFORMACIÓN DE RED
  // ============================================================================

  /**
   * Obtener información de todas las OLTs
   */
  async obtenerOLTs(): Promise<PSOResponse<{ nombre: string; ip: string; estado: string }[]>> {
    return this.request('obtener_olts', {});
  }

  /**
   * Obtener información de nodos PON de una OLT
   */
  async obtenerNodosPON(olt: string): Promise<PSOResponse<{ pon: string; ontsActivas: number }[]>> {
    return this.request('obtener_nodos_pon', { olt });
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Verifica si una operación fue exitosa
   */
  static isSuccess(response: PSOResponse): boolean {
    return response.codigo >= 200 && response.codigo < 300;
  }

  /**
   * Obtiene un mensaje de error legible según el código de respuesta
   */
  static getErrorMessage(codigo: number): string {
    switch (codigo) {
      case PSO_CODES.AUTH_FAILED:
        return 'Error de autenticación con PSO';
      case PSO_CODES.FORBIDDEN:
        return 'Acceso denegado a PSO';
      case PSO_CODES.OLT_BLOQUEADA:
        return 'OLT bloqueada, intente más tarde';
      case PSO_CODES.TIMEOUT:
        return 'Timeout en conexión con OLT';
      case PSO_CODES.ONT_DUPLICADA:
        return 'ONT duplicada, ya existe en el sistema';
      case PSO_CODES.ONT_NO_ENCONTRADA:
        return 'ONT no encontrada';
      case PSO_CODES.PERFIL_NO_EXISTE:
        return 'Perfil especificado no existe';
      case PSO_CODES.ERROR_CONEXION_OLT:
        return 'Error de conexión con la OLT';
      case PSO_CODES.PARAMETROS_INVALIDOS:
        return 'Parámetros inválidos en la petición';
      case PSO_CODES.ONT_YA_REGISTRADA:
        return 'ONT ya está registrada en el sistema';
      default:
        return 'Error desconocido en PSO';
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

let psoClientInstance: PSOClient | null = null;

/**
 * Obtiene la instancia del cliente PSO (singleton)
 * Configuración desde variables de entorno
 */
export function getPSOClient(): PSOClient {
  if (!psoClientInstance) {
    const baseURL = process.env.PSO_BASE_URL;
    const username = process.env.PSO_USERNAME;
    const password = process.env.PSO_PASSWORD;

    if (!baseURL || !username || !password) {
      throw new Error(
        'Configuración de PSO incompleta. Verifique PSO_BASE_URL, PSO_USERNAME y PSO_PASSWORD'
      );
    }

    psoClientInstance = new PSOClient({
      baseURL,
      username,
      password,
      timeout: parseInt(process.env.PSO_TIMEOUT || '30000'),
    });
  }

  return psoClientInstance;
}

/**
 * Reinicia la instancia del cliente PSO (útil para testing)
 */
export function resetPSOClient(): void {
  psoClientInstance = null;
}
