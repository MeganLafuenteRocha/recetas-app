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
    return aCuenta(credencial.user);
  }

  cuentaActual(): Promise<CuentaExterna | null> {
    // Espera la PRIMERA emisión: Auth necesita un momento para restaurar la sesión guardada.
    return new Promise((resolve) => {
      const parar = onAuthStateChanged(auth, (user) => {
        parar();
        resolve(user ? aCuenta(user) : null);
      });
    });
  }

  cerrarSesion(): Promise<void> {
    return signOut(auth);
  }
}
