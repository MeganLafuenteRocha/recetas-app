import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ListasStore } from '../../../application/stores/listas.store';
import { ListasComprasUseCase } from '../../../application/use-cases/listas-compras.usecase';
import { ListaCompra, OrigenLista, progresoLista } from '../../../domain/listas/lista.model';
import { desdeISO, fechaISO, sumarDias } from '../../../domain/planificacion/plan.model';
import { AvisoComponent } from '../../ui/aviso.component';
import { EncabezadoComponent } from '../../ui/encabezado.component';
import { HojaComponent } from '../../ui/hoja.component';

const ORIGEN: Record<OrigenLista, { nombre: string; icono: string }> = {
  manual: { nombre: 'Desde cero', icono: 'edit_note' },
  plan: { nombre: 'Del plan semanal', icono: 'calendar_view_week' },
  dia: { nombre: 'De un día', icono: 'today' },
};

/** Pantalla 12A: listas por fecha de compra y las tres formas de crear una. */
@Component({
  selector: 'app-listas',
  imports: [RouterLink, HojaComponent, EncabezadoComponent, AvisoComponent],
  template: `
    <main class="pantalla">
      <app-encabezado titulo="Listas de compras" volver="/despensa" />

      <div class="nuevas">
        @for (o of origenes; track o.clave) {
          <button type="button" class="nueva" [class.principal]="o.clave === 'manual'" (click)="abrir(o.clave)">
            <span class="icono">{{ o.icono }}</span>
            <span>{{ o.corto }}</span>
          </button>
        }
      </div>

      @if (!listas.cargadas()) {
        <p class="t-detalle">Cargando…</p>
      } @else {
        <section class="pila">
          <h2 class="t-sobretitulo">Próximas</h2>
          @for (l of listas.proximas(); track l.id) {
            <a class="tarjeta toque tarjeta-lista" [routerLink]="['/listas', l.id]">
              <div class="lista-cab">
                <strong class="t-tarjeta">{{ l.nombre }}</strong>
                <span class="pastilla">{{ origen(l.origen).nombre }}</span>
              </div>
              <span class="t-detalle cuando"><span class="icono">event</span> Comprar: {{ cuando(l.fechaCompra) }}</span>
              <div class="avance">
                <div class="progreso"><span [style.width.%]="porcentaje(l)"></span></div>
                <strong>{{ progreso(l).comprados }}/{{ progreso(l).total }}</strong>
              </div>
            </a>
          } @empty {
            <div class="vacio-estado"><span class="icono">shopping_cart</span><p>No tienes listas pendientes.</p></div>
          }
        </section>

        @if (listas.compradas().length > 0) {
          <section class="pila">
            <h2 class="t-sobretitulo">Compradas</h2>
            @for (l of listas.compradas(); track l.id) {
              <a class="tarjeta toque comprada" [routerLink]="['/listas', l.id]">
                <span class="icono">task_alt</span>
                <span class="datos">
                  <strong>{{ l.nombre }}</strong>
                  <span class="t-detalle">{{ cuando(l.fechaCompra) }} · {{ l.items.length }} ítems</span>
                </span>
              </a>
            }
          </section>
        }
      }
    </main>

    @if (creando(); as tipo) {
      <app-hoja [titulo]="titulo(tipo)" (cerrar)="creando.set(null)">
        @if (tipo === 'manual') {
          <label class="campo"><span>Nombre</span><input class="caja" type="text" placeholder="ej. Feria del sábado" [value]="nombre()" (input)="nombre.set($any($event.target).value)" /></label>
        }
        @if (tipo === 'dia') {
          <label class="campo"><span>Día que vas a cocinar</span><input class="caja" type="date" [value]="referencia()" (change)="referencia.set($any($event.target).value)" /></label>
        }
        @if (tipo === 'plan') {
          <div class="segmentos">
            <button type="button" [class.activo]="referencia() === hoy" (click)="referencia.set(hoy)">Esta semana</button>
            <button type="button" [class.activo]="referencia() === enSieteDias" (click)="referencia.set(enSieteDias)">La próxima</button>
          </div>
        }
        <label class="campo"><span>¿Cuándo vas a comprar?</span><input class="caja" type="date" [value]="fechaCompra()" (change)="fechaCompra.set($any($event.target).value)" /></label>
        @if (tipo !== 'manual') {
          <app-aviso icono="info">Se agregan los ingredientes que faltan según tu despensa. Después puedes editarla.</app-aviso>
        }
        <button type="button" class="btn btn-primario btn-ancho" [disabled]="guardando()" (click)="crear(tipo)">
          {{ guardando() ? 'Creando…' : 'Crear lista' }}
        </button>
      </app-hoja>
    }
  `,
  styles: `
    .nuevas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .nueva {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      padding: 22px 6px; border: none; border-radius: var(--radio-tarjeta);
      background: var(--color-superficie); color: var(--color-texto);
      font-family: var(--fuente-texto); font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .nueva .icono { color: var(--color-primario); }
    .nueva.principal { background: var(--color-primario); color: var(--color-texto-invertido); }
    .nueva.principal .icono { color: var(--color-texto-invertido); }
    .tarjeta-lista { display: flex; padding: 20px; }
    .lista-cab { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .lista-cab strong { font-size: 17px; font-weight: 600; }
    .cuando { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .cuando .icono { font-size: 16px; }
    .avance { display: flex; align-items: center; gap: var(--esp-grupo); }
    .avance .progreso { flex: 1; }
    .avance strong { font-size: 13px; color: var(--color-texto-suave); }
    .comprada {
      display: flex; flex-direction: row; align-items: center; gap: 14px; padding: 18px 20px;
      background: color-mix(in srgb, var(--color-superficie) 55%, transparent);
    }
    .comprada > .icono { color: var(--color-ok); }
    .datos { display: flex; flex-direction: column; gap: 1px; }
    .datos strong { font-size: 15px; font-weight: 500; color: var(--color-texto-suave); }
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
