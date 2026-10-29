/** Datos que entrega el proveedor de identidad (Google) al iniciar sesión. */
export interface CuentaExterna {
  uid: string;
  nombre: string;
  email: string;
  foto: string | null;
}

/**
 * Puerto de sesión: el dominio no sabe que detrás está Firebase Auth.
 * Lo implementa infrastructure/firebase/auth.adapter.ts.
 */
export abstract class SesionPort {
  /** Abre el diálogo de Google y devuelve la cuenta autenticada. */
  abstract iniciarConGoogle(): Promise<CuentaExterna>;

  /** Cuenta ya autenticada de una visita anterior, o null. Espera a que Auth restaure la sesión. */
  abstract cuentaActual(): Promise<CuentaExterna | null>;

  abstract cerrarSesion(): Promise<void>;

  /**
   * Respuesta inmediata (sin esperar a la red): ¿este dispositivo tenía una sesión abierta?
   * Si no, la app pinta el login enseguida en vez de esperar a que Auth termine de arrancar.
   */
  abstract haySesionGuardada(): boolean;
}
