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
}
