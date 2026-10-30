import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { EncabezadoComponent } from '../../ui/encabezado.component';

/** Lo que guarda public/fotos/creditos.json por cada foto semilla (Wikimedia Commons). */
interface Credito {
  titulo: string;
  autor: string;
  licencia: string;
  licenciaUrl: string | null;
  origen: string;
}

/**
 * Créditos de las fotos semilla: las licencias CC BY y CC BY-SA piden nombrar al autor
 * y enlazar la licencia. El archivo es estático y lo guarda el Service Worker como el resto.
 */
@Component({
  selector: 'app-creditos',
  imports: [EncabezadoComponent],
  template: `
    <main class="pantalla">
      <app-encabezado titulo="Créditos de las fotos" volver="/ajustes" />
      <p class="t-detalle">
        Las fotos de las recetas que vienen con la app son de Wikimedia Commons, con licencias libres.
        Las fotos que tú agregas quedan en tu dispositivo.
      </p>

      @if (creditos.isLoading()) {
        <p class="t-detalle">Cargando…</p>
      } @else if (creditos.error()) {
        <div class="vacio-estado"><span class="icono">cloud_off</span><p>No se pudieron cargar los créditos.</p></div>
      } @else {
        <ul class="tarjeta lista" aria-label="Créditos">
          @for (c of filas(); track c.id) {
            <li class="credito">
              <strong>{{ c.receta }}</strong>
              <span class="t-detalle">
                Foto: <a class="enlace" [href]="c.origen" target="_blank" rel="noopener">{{ c.autor }}</a> ·
                @if (c.licenciaUrl) {
                  <a class="enlace" [href]="c.licenciaUrl" target="_blank" rel="noopener">{{ c.licencia }}</a>
                } @else {
                  {{ c.licencia }}
                }
              </span>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    ul { margin: 0; list-style: none; }
    .credito { display: flex; flex-direction: column; gap: 2px; padding: 12px 0; }
    .credito + .credito { border-top: 1px solid var(--color-linea); }
    .credito strong { font-size: 13px; font-weight: 600; }
    .credito .enlace { font-weight: 500; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditosPage {
  private readonly recetas = inject(RecetasStore);

  protected readonly creditos = resource({
    loader: async () => {
      const respuesta = await fetch('/fotos/creditos.json');
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return (await respuesta.json()) as Record<string, Credito>;
    },
  });

  protected readonly filas = computed(() =>
    Object.entries(this.creditos.value() ?? {})
      .map(([id, c]) => ({ id, ...c, receta: this.recetas.obtener(id)?.nombre ?? c.titulo }))
      .sort((a, b) => a.receta.localeCompare(b.receta, 'es')),
  );
}
