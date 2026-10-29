import { inject, Injectable } from '@angular/core';
import { CuentaExterna } from '../../domain/usuarios/sesion.port';
import { Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';

/**
 * Regla de negocio del ingreso: toda cuenta nueva nace "pendiente" y sin hogar;
 * solo la administradora la activa y la deja en un hogar.
 */
@Injectable({ providedIn: 'root' })
export class IniciarSesionUseCase {
  private readonly usuarios = inject(UsuarioRepository);

  async ejecutar(cuenta: CuentaExterna): Promise<Usuario> {
    const existente = await this.usuarios.obtener(cuenta.uid);
    if (existente) {
      return existente;
    }

    const nuevo: Usuario = {
      uid: cuenta.uid,
      nombre: cuenta.nombre,
      email: cuenta.email,
      foto: cuenta.foto,
      rol: 'usuario',
      estado: 'pendiente',
      hogarId: null,
      creadoEn: new Date(),
    };
    await this.usuarios.crearPendiente(nuevo);
    return nuevo;
  }
}
