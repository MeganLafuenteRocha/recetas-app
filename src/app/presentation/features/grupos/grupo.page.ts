import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { GruposStore } from '../../../application/stores/grupos.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { SeleccionDiaStore } from '../../../application/stores/seleccion-dia.store';
import { SesionStore } from '../../../application/stores/sesion.store';
import { alternarReceta, Grupo, grupoNuevo, ICONOS_GRUPO, validarGrupo } from '../../../domain/grupos/grupo.model';
import { normalizarTexto } from '../../../domain/ingredientes/ingrediente.model';
import { FotoComponent } from '../../ui/foto.component';
import { HojaComponent } from '../../ui/hoja.component';
import { duracion } from '../../ui/iconos';

/** Pantalla 13: un grupo de recetas. La admin lo crea, edita y llena; todas lo usan. */
@Component({
  selector: 'app-grupo',
  imports: [RouterLink, FotoComponent, HojaComponent],
  templateUrl: './grupo.page.html',
  styleUrl: './grupo.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoPage {
  protected readonly sesion = inject(SesionStore);
  protected readonly catalogos = inject(CatalogoStore);
  private readonly grupos = inject(GruposStore);
  private readonly recetas = inject(RecetasStore);
  private readonly seleccion = inject(SeleccionDiaStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Vacío en /grupos/nuevo. */
  readonly id = input<string>();

  protected readonly iconos = ICONOS_GRUPO;
  protected readonly duracion = duracion;

  protected readonly grupo = computed(() => {
    const id = this.id();
    return id ? (this.grupos.obtener(id) ?? null) : null;
  });

  /** Formulario de nombre/descripcion/ícono (nuevo o editando). */
  protected readonly editando = linkedSignal(() => !this.id());
  protected readonly borrador = linkedSignal<Grupo>(() => this.grupo() ?? grupoNuevo(crypto.randomUUID(), ''));
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  protected readonly agregando = signal(false);
  protected readonly filtro = signal('');

  protected readonly recetasDelGrupo = computed(() =>
    (this.grupo()?.recetaIds ?? [])
      .map((id) => this.recetas.obtener(id))
      .filter((r) => !!r && r.activo)
      .map((r) => r!),
  );

  protected readonly candidatas = computed(() => {
    const q = normalizarTexto(this.filtro());
    return this.recetas.todas().filter((r) => !q || normalizarTexto(r.nombre).includes(q));
  });

  protected pares<T>(lista: T[]): T[][] {
    const filas: T[][] = [];
    for (let i = 0; i < lista.length; i += 2) filas.push(lista.slice(i, i + 2));
    return filas;
  }

  protected volver(): void {
    if (this.editando() && this.grupo()) {
      this.editando.set(false);
      return;
    }
    this.location.back();
  }

  protected cambiar(cambios: Partial<Grupo>): void {
    this.borrador.update((g) => ({ ...g, ...cambios }));
  }

  protected async guardar(): Promise<void> {
    const g = { ...this.borrador(), nombre: this.borrador().nombre.trim(), descripcion: this.borrador().descripcion.trim() };
    const error = validarGrupo(g);
    this.error.set(error);
    if (error) return;
    this.guardando.set(true);
    try {
      await this.grupos.guardar(g);
      if (!this.id()) await this.router.navigate(['/grupos', g.id], { replaceUrl: true });
      else this.editando.set(false);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(): Promise<void> {
    const g = this.grupo();
    if (!g) return;
    await this.grupos.eliminar(g.id);
    await this.router.navigateByUrl('/recetas', { replaceUrl: true });
  }

  protected async alternar(recetaId: string): Promise<void> {
    const g = this.grupo();
    if (g) await this.grupos.guardar(alternarReceta(g, recetaId));
  }

  protected usarParaElDia(): void {
    const g = this.grupo();
    if (!g) return;
    this.seleccion.usarGrupo(g.nombre, g.recetaIds);
    void this.router.navigateByUrl('/dia');
  }
}
