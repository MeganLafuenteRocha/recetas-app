import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { EstadoUsuario, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';
import { db } from './firebase.providers';

function aUsuario(uid: string, data: Record<string, unknown>): Usuario {
  return {
    uid,
    nombre: data['nombre'] as string,
    email: data['email'] as string,
    foto: (data['foto'] as string | null) ?? null,
    rol: data['rol'] as Usuario['rol'],
    estado: data['estado'] as Usuario['estado'],
    creadoEn: data['creadoEn'] instanceof Timestamp ? data['creadoEn'].toDate() : new Date(),
  };
}

@Injectable({ providedIn: 'root' })
export class FirestoreUsuariosRepo extends UsuarioRepository {
  async obtener(uid: string): Promise<Usuario | null> {
    const snap = await getDoc(doc(db, 'usuarios', uid));
    return snap.exists() ? aUsuario(uid, snap.data()) : null;
  }

  async crearPendiente(usuario: Usuario): Promise<void> {
    await setDoc(doc(db, 'usuarios', usuario.uid), {
      nombre: usuario.nombre,
      email: usuario.email,
      foto: usuario.foto,
      rol: usuario.rol,
      estado: usuario.estado,
      creadoEn: serverTimestamp(),
    });
  }

  async listarPorEstado(estado: EstadoUsuario): Promise<Usuario[]> {
    const q = query(collection(db, 'usuarios'), where('estado', '==', estado));
    const snap = await getDocs(q);
    return snap.docs.map((d) => aUsuario(d.id, d.data()));
  }

  async cambiarEstado(uid: string, estado: EstadoUsuario): Promise<void> {
    await updateDoc(doc(db, 'usuarios', uid), { estado });
  }
}
