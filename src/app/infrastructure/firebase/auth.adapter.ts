import { Injectable } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { CuentaExterna, SesionPort } from '../../domain/usuarios/sesion.port';
import { auth } from './firebase.providers';

/** Marca propia: Auth guarda la sesión en IndexedDB, que no se puede leer de forma síncrona. */
const MARCA_SESION = 'recetas.conSesion';

function marcar(conSesion: boolean): void {
  try {
    if (conSesion) localStorage.setItem(MARCA_SESION, '1');
    else localStorage.removeItem(MARCA_SESION);
  } catch {
    // Sin almacenamiento local: solo se pierde el atajo del login.
  }
}

function aCuenta(user: User): CuentaExterna {
  return {
    uid: user.uid,
    nombre: user.displayName ?? 'Sin nombre',
    email: user.email ?? '',
    foto: user.photoURL,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthAdapter extends SesionPort {
  async iniciarConGoogle(): Promise<CuentaExterna> {
    const credencial = await signInWithPopup(auth, new GoogleAuthProvider());
    marcar(true);
    return aCuenta(credencial.user);
  }

  cuentaActual(): Promise<CuentaExterna | null> {
    // Espera la PRIMERA emisión: Auth necesita un momento para restaurar la sesión guardada.
    return new Promise((resolve) => {
      const parar = onAuthStateChanged(auth, (user) => {
        parar();
        marcar(user !== null);
        resolve(user ? aCuenta(user) : null);
      });
    });
  }

  cerrarSesion(): Promise<void> {
    marcar(false);
    return signOut(auth);
  }

  haySesionGuardada(): boolean {
    try {
      return localStorage.getItem(MARCA_SESION) === '1';
    } catch {
      return true; // sin almacenamiento: se espera a Auth, como antes
    }
  }
}
