import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { AdministrarCatalogosUseCase } from '../../../application/use-cases/administrar-catalogos.usecase';
import { ElementoCatalogo, TipoCatalogo, UsoCatalogo } from '../../../domain/catalogos/catalogo.model';
import { HojaComponent } from '../../ui/hoja.component';

const PESTANAS: { tipo: TipoCatalogo; nombre: string; singular: string }[] = [
  { tipo: 'tiposCocina', nombre: 'Cocinas', singular: 'cocina' },
  { tipo: 'categorias', nombre: 'Categorías', singular: 'categoría' },
  { tipo: 'tiposComida', nombre: 'Franjas', singular: 'franja' },
  { tipo: 'unidades', nombre: 'Unid.', singular: 'unidad' },
];

/** Pantalla 15 (solo admin): CRUD de catálogos con integridad referencial. */
@Component({
  selector: 'app-catalogos',
  imports: [RouterLink, HojaComponent],
  template: `
    <main class="vista">
      <header class="cabecera">
        <a class="icono-btn" routerLink="/ajustes" aria-label="Volver"><span class="icono">arrow_back</span></a>
        <h1>Catálogos</h1>
      </header>

      <div class="segmentado">
        @for (p of pestanas; track p.tipo) {
          <button type="button" [class.activo]="pestana().tipo === p.tipo" (click)="cambiarPestana(p.tipo)">{{ p.nombre }}</button>
        }
      </div>

      <p class="aviso"><span class="icono">lock</span> El código interno no se edita. Solo se elimina lo que nadie usa.</p>

      <div class="lista-filas">
        @for (e of elementos(); track e.elemento.codigo) {
          <div class="fila">
            <div class="textos">
              <strong>{{ e.elemento.nombre }}</strong>
              <small><span class="icono">lock</span> {{ e.elemento.codigo }} · <span [class.libre]="e.uso.total === 0">{{ e.uso.total ? e.uso.total + ' en uso' : 'sin uso' }}</span></small>
            </div>
            <button type="button" class="icono-btn" (click)="abrirEdicion(e.elemento)" [attr.aria-label]="'Renombrar ' + e.elemento.nombre"><span class="icono">edit</span></button>
            <button type="button" class="icono-btn" [class.peligro]="e.uso.total === 0" (click)="eliminar(e.elemento, e.uso)" [attr.aria-label]="'Eliminar ' + e.elemento.nombre">
              <span class="icono">delete</span>
            </button>
          </div>
        }
      </div>

      @if (bloqueo(); as b) {
        <div class="aviso error bloqueo">
          <span class="icono">block</span>
          <div>
            <strong>No se puede eliminar «{{ b.nombre }}»</strong>
            <div>{{ b.uso.total }} lo usan: {{ b.uso.nombres.slice(0, 4).join(', ') }}{{ b.uso.total > 4 ? '…' : '' }}.</div>
          </div>
        </div>
      }

      <button type="button" class="btn btn-primario ancho" (click)="abrirNuevo()"><span class="icono">add</span> Nueva {{ pestana().singular }}</button>
    </main>

    @if (hoja(); as h) {
      <app-hoja [titulo]="h.codigo ? 'Renombrar' : 'Nueva ' + pestana().singular" (cerrar)="hoja.set(null)">
        <label class="campo">
          <span>Nombre visible</span>
          <input type="text" [value]="h.nombre" (input)="hoja.set({ codigo: h.codigo, nombre: $any($event.target).value })" />
        </label>
        @if (h.codigo) {
          <p class="texto-suave">Código interno (bloqueado): {{ h.codigo }}</p>
        } @else {
          <p class="texto-suave">El código interno se crea a partir del nombre y no podrá cambiarse.</p>
        }
        @if (error(); as e) { <p class="aviso error"><span class="icono">error</span> {{ e }}</p> }
        <button type="button" class="btn btn-primario ancho" [disabled]="guardando()" (click)="guardar()">Guardar</button>
      </app-hoja>
    }
  `,
  styles: `
    .fila { display: flex; align-items: center; gap: 4px; padding: 8px 0; }
    .textos { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .textos strong { font-size: 14px; font-weight: 500; color: var(--plomo-900); }
    .textos small { display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--plomo-500); }
    .textos small .icono { font-size: 11px; }
    .libre { color: var(--ok); }
    .icono-btn .icono { font-size: 19px; }
    .icono-btn:not(.peligro) .icono { color: var(--plomo-700); }
    .icono-btn.peligro .icono { color: var(--error); }
    .bloqueo strong { display: block; margin-bottom: 2px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogosPage {
  private readonly catalogos = inject(CatalogoStore);
  private readonly admin = inject(AdministrarCatalogosUseCase);

  protected readonly pestanas = PESTANAS;
  protected readonly pestana = signal(PESTANAS[0]!);
  protected readonly hoja = signal<{ codigo: string | null; nombre: string } | null>(null);
  protected readonly bloqueo = signal<{ nombre: string; uso: UsoCatalogo } | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly guardando = signal(false);

  protected readonly elementos = computed(() => {
    const tipo = this.pestana().tipo;
    return (this.catalogos.catalogos()[tipo] as ElementoCatalogo[]).map((elemento) => ({
      elemento,
      uso: this.admin.usos(tipo, elemento.codigo),
    }));
  });

  protected cambiarPestana(tipo: TipoCatalogo): void {
    this.pestana.set(PESTANAS.find((p) => p.tipo === tipo)!);
    this.bloqueo.set(null);
  }

  protected abrirNuevo(): void {
    this.error.set(null);
    this.hoja.set({ codigo: null, nombre: '' });
  }

  protected abrirEdicion(e: ElementoCatalogo): void {
    this.error.set(null);
    this.hoja.set({ codigo: e.codigo, nombre: e.nombre });
  }

  protected async guardar(): Promise<void> {
    const h = this.hoja();
    if (!h) return;
    this.guardando.set(true);
    try {
      const tipo = this.pestana().tipo;
      const error = h.codigo
        ? await this.admin.renombrar(tipo, h.codigo, h.nombre)
        : await this.admin.agregar(tipo, h.nombre);
      this.error.set(error);
      if (!error) this.hoja.set(null);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async eliminar(e: ElementoCatalogo, uso: UsoCatalogo): Promise<void> {
    if (uso.total > 0) {
      this.bloqueo.set({ nombre: e.nombre, uso });
      return;
    }
    this.bloqueo.set(null);
    await this.admin.eliminar(this.pestana().tipo, e.codigo);
  }
}
