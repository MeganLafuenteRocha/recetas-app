import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { AdministrarCatalogosUseCase } from '../../../application/use-cases/administrar-catalogos.usecase';
import { ElementoCatalogo, TipoCatalogo, UsoCatalogo } from '../../../domain/catalogos/catalogo.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { HojaComponent } from '../../ui/hoja.component';

const PESTANAS: { tipo: TipoCatalogo; nombre: string; singular: string }[] = [
  { tipo: 'tiposCocina', nombre: 'Cocinas', singular: 'cocina' },
  { tipo: 'categorias', nombre: 'Categorías', singular: 'categoría' },
  { tipo: 'tiposComida', nombre: 'Franjas', singular: 'franja' },
  { tipo: 'unidades', nombre: 'Unidades', singular: 'unidad' },
];

/** Pantalla 15 (solo admin): CRUD de catálogos con integridad referencial. */
@Component({
  selector: 'app-catalogos',
  imports: [HojaComponent, EncabezadoComponent, AvisoComponent],
  template: `
    <main class="pantalla">
      <app-encabezado titulo="Catálogos" volver="/ajustes" />

      <div class="segmentos" role="tablist" aria-label="Tipo de catálogo">
        @for (p of pestanas; track p.tipo) {
          <button type="button" role="tab" [attr.aria-selected]="pestana().tipo === p.tipo" [class.activo]="pestana().tipo === p.tipo" (click)="cambiarPestana(p.tipo)">{{ p.nombre }}</button>
        }
      </div>

      <app-aviso icono="lock" titulo="El código interno no se edita">Solo se puede borrar lo que nadie usa.</app-aviso>

      <div class="tarjeta lista">
        @for (e of elementos(); track e.elemento.codigo) {
          <div class="fila">
            <div class="textos">
              <strong>{{ e.elemento.nombre }}</strong>
              <span class="t-detalle" [class.libre]="e.uso.total === 0">{{ e.elemento.codigo }} · {{ e.uso.total ? e.uso.total + ' en uso' : 'sin uso' }}</span>
            </div>
            <button type="button" class="boton-icono sin-fondo" (click)="abrirEdicion(e.elemento)" [attr.aria-label]="'Renombrar ' + e.elemento.nombre"><span class="icono">edit</span></button>
            <button type="button" class="boton-icono sin-fondo borrar" [class.libre]="e.uso.total === 0" (click)="eliminar(e.elemento, e.uso)" [attr.aria-label]="'Eliminar ' + e.elemento.nombre">
              <span class="icono">delete</span>
            </button>
          </div>
        }
      </div>

      @if (bloqueo(); as b) {
        <app-aviso icono="block" tono="error" [titulo]="'No se puede eliminar «' + b.nombre + '»'">
          {{ b.uso.total }} lo usan: {{ b.uso.nombres.slice(0, 4).join(', ') }}{{ b.uso.total > 4 ? '…' : '' }}.
        </app-aviso>
      }

      <div class="pie-fijo">
        <button type="button" class="btn btn-primario btn-ancho" (click)="abrirNuevo()"><span class="icono">add</span> Nueva {{ pestana().singular }}</button>
      </div>
    </main>

    @if (hoja(); as h) {
      <app-hoja [titulo]="h.codigo ? 'Renombrar' : 'Nueva ' + pestana().singular" (cerrar)="hoja.set(null)">
        <label class="campo">
          <span>Nombre visible</span>
          <input class="caja" type="text" [value]="h.nombre" (input)="hoja.set({ codigo: h.codigo, nombre: $any($event.target).value })" />
        </label>
        @if (h.codigo) {
          <p class="t-detalle">Código interno (bloqueado): {{ h.codigo }}</p>
        } @else {
          <p class="t-detalle">El código interno se crea a partir del nombre y no podrá cambiarse.</p>
        }
        @if (error(); as e) { <app-aviso icono="error" tono="error" [titulo]="e" /> }
        <button type="button" class="btn btn-primario btn-ancho" [disabled]="guardando()" (click)="guardar()">Guardar</button>
      </app-hoja>
    }
  `,
  styles: `
    .tarjeta.lista { padding: 6px 12px 6px 20px; }
    .fila { display: flex; align-items: center; gap: 2px; padding: 10px 0; }
    .textos { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .textos strong { font-family: var(--fuente-titulo); font-size: 17px; }
    .t-detalle.libre { color: var(--color-ok); }
    .boton-icono { width: 36px; height: 36px; color: var(--color-texto-suave); }
    .boton-icono .icono { font-size: 20px; }
    .borrar { color: var(--color-texto-tenue); }
    .borrar.libre { color: var(--color-error); }
    /* Acción principal pegada sobre la barra de pestañas. */
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
