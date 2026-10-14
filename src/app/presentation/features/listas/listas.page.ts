import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ListasStore } from '../../../application/stores/listas.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { ListaCompra, OrigenLista, progresoLista } from '../../../domain/listas/lista.model';
import { desdeISO, fechaISO, sumarDias } from '../../../domain/planificacion/plan.model';
import { HojaComponent } from '../../ui/hoja.component';

const ORIGEN: Record<OrigenLista, { nombre: string; icono: string }> = {
  manual: { nombre: 'Desde cero', icono: 'edit_note' },
  plan: { nombre: 'Del plan semanal', icono: 'calendar_view_week' },
  dia: { nombre: 'De un día', icono: 'today' },
};

/** Pantalla 12A: listas por fecha de compra y las tres formas de crear una. */
@Component({
  selector: 'app-listas',
  imports: [RouterLink, HojaComponent],
  template: `
    <main class="vista">
      <header class="cabecera">
        <a class="icono-btn" routerLink="/despensa" aria-label="Volver"><span class="icono">arrow_back</span></a>
        <h1>Listas de compras</h1>
      </header>

      <div class="nuevas">
        @for (o of origenes; track o.clave) {
          <button type="button" class="nueva" [class.principal]="o.clave === 'manual'" (click)="abrir(o.clave)">
            <span class="icono">{{ o.icono }}</span>
            <small>{{ o.corto }}</small>
          </button>
        }
      </div>

      @if (!listas.cargadas()) {
        <p class="texto-suave">Cargando…</p>
      } @else {
        <p class="etiqueta-seccion">Próximas</p>
        @for (l of listas.proximas(); track l.id) {
          <a class="tarjeta lista" [routerLink]="['/listas', l.id]">
            <div class="lista-cab">
              <div class="lista-tit">
                <strong>{{ l.nombre }}</strong>
                <small><span class="icono">event</span> Comprar: {{ cuando(l.fechaCompra) }}</small>
              </div>
              <span class="chip dorado origen"><span class="icono">{{ origen(l.origen).icono }}</span> {{ origen(l.origen).nombre }}</span>
            </div>
            <div class="progreso">
              <span class="barra"><span [style.width.%]="porcentaje(l)"></span></span>
              <small>{{ progreso(l).comprados }}/{{ progreso(l).total }}</small>
            </div>
          </a>
        } @empty {
          <div class="vacio-estado"><span class="icono">shopping_cart</span><p>No tienes listas pendientes.</p></div>
        }

        @if (listas.compradas().length > 0) {
          <p class="etiqueta-seccion">Compradas</p>
          @for (l of listas.compradas(); track l.id) {
            <a class="comprada" [routerLink]="['/listas', l.id]">
              <span class="icono">task_alt</span>
              <span class="datos"><strong>{{ l.nombre }}</strong><small>{{ cuando(l.fechaCompra) }} · {{ l.items.length }} ítems</small></span>
            </a>
          }
        }
      }
    </main>

    @if (creando(); as tipo) {
      <app-hoja [titulo]="titulo(tipo)" (cerrar)="creando.set(null)">
        @if (tipo === 'manual') {
          <label class="campo"><span>Nombre</span><input type="text" placeholder="ej. Feria del sábado" [value]="nombre()" (input)="nombre.set($any($event.target).value)" /></label>
        }
        @if (tipo === 'dia') {
          <label class="campo"><span>Día que vas a cocinar</span><input type="date" [value]="referencia()" (change)="referencia.set($any($event.target).value)" /></label>
        }
        @if (tipo === 'plan') {
          <div class="segmentado">
            <button type="button" [class.activo]="referencia() === hoy" (click)="referencia.set(hoy)">Esta semana</button>
            <button type="button" [class.activo]="referencia() === enSieteDias" (click)="referencia.set(enSieteDias)">La próxima</button>
          </div>
        }
        <label class="campo"><span>¿Cuándo vas a comprar?</span><input type="date" [value]="fechaCompra()" (change)="fechaCompra.set($any($event.target).value)" /></label>
        @if (tipo !== 'manual') {
          <p class="aviso"><span class="icono">info</span> Se agregan los ingredientes que faltan según tu despensa. Después puedes editarla.</p>
        }
        <button type="button" class="btn btn-primario ancho" [disabled]="guardando()" (click)="crear(tipo)">
          {{ guardando() ? 'Creando…' : 'Crear lista' }}
        </button>
      </app-hoja>
    }
  `,
  styles: `
    .nuevas { display: flex; gap: 8px; }
    .nueva { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 0; border-radius: 14px;
      border: 1px solid #e4e4e7; background: #fff; cursor: pointer; }
    .nueva .icono { color: var(--guindo-700); font-size: 22px; }
    .nueva small { font-size: 11px; font-weight: 500; color: var(--plomo-700); }
    .nueva.principal { background: var(--guindo-700); border-color: var(--guindo-700); }
    .nueva.principal .icono, .nueva.principal small { color: #fff; }
    .lista { display: flex; flex-direction: column; gap: 10px; text-decoration: none; }
    .lista-cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .lista-tit { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .lista-tit strong { font-family: 'Quicksand', sans-serif; font-size: 15px; color: var(--plomo-900); }
    .lista-tit small { display: flex; align-items: center; gap: 4px; color: var(--plomo-500); font-size: 11px; }
    .lista-tit small .icono { font-size: 13px; }
    .origen { padding: 3px 8px; font-size: 10px; cursor: default; }
    .origen .icono { font-size: 12px; }
    .progreso { display: flex; align-items: center; gap: 8px; }
    .progreso small { color: var(--plomo-500); font-size: 11px; }
    .barra { flex: 1; height: 6px; border-radius: 999px; background: var(--plomo-100); overflow: hidden; }
    .barra span { display: block; height: 100%; background: var(--ok); }
    .comprada { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 16px; background: var(--plomo-100); text-decoration: none; }
    .comprada > .icono { color: var(--ok); }
    .datos { display: flex; flex-direction: column; }
    .datos strong { font-size: 13px; font-weight: 500; color: var(--plomo-500); }
    .datos small { font-size: 11px; color: var(--plomo-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListasPage {
  protected readonly listas = inject(ListasStore);
  private readonly casos = inject(ListasComprasUseCase);
  private readonly router = inject(Router);

  protected readonly hoy = fechaISO(new Date());
  protected readonly enSieteDias = fechaISO(sumarDias(new Date(), 7));
  protected readonly origenes = [
    { clave: 'manual' as const, icono: 'edit_note', corto: 'Desde cero' },
    { clave: 'plan' as const, icono: 'calendar_view_week', corto: 'Del plan' },
    { clave: 'dia' as const, icono: 'today', corto: 'De un día' },
  ];

  protected readonly creando = signal<OrigenLista | null>(null);
  protected readonly nombre = signal('');
  protected readonly referencia = signal(this.hoy);
  protected readonly fechaCompra = signal(this.hoy);
  protected readonly guardando = signal(false);

  constructor() {
    void this.listas.cargar();
  }

  protected origen(o: OrigenLista) {
    return ORIGEN[o];
  }

  protected progreso(l: ListaCompra) {
    return progresoLista(l);
  }

  protected porcentaje(l: ListaCompra): number {
    const p = progresoLista(l);
    return p.total ? (p.comprados / p.total) * 100 : 0;
  }

  protected cuando(iso: string): string {
    if (!iso) return 'sin fecha';
    if (iso === this.hoy) return 'hoy';
    return desdeISO(iso).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  protected titulo(tipo: OrigenLista): string {
    return tipo === 'manual' ? 'Nueva lista' : tipo === 'plan' ? 'Lista del plan semanal' : 'Lista de un día';
  }

  protected abrir(tipo: OrigenLista): void {
    this.nombre.set('');
    this.referencia.set(this.hoy);
    this.fechaCompra.set(this.hoy);
    this.creando.set(tipo);
  }

  protected async crear(tipo: OrigenLista): Promise<void> {
    this.guardando.set(true);
    try {
      const lista =
        tipo === 'manual'
          ? await this.casos.crearManual(this.nombre(), this.fechaCompra())
          : tipo === 'plan'
            ? await this.casos.crearDesdeSemana(this.referencia(), this.fechaCompra())
            : await this.casos.crearDesdeDia(this.referencia(), this.fechaCompra());
      this.creando.set(null);
      await this.router.navigate(['/listas', lista.id]);
    } finally {
      this.guardando.set(false);
    }
  }
}
