import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoStore } from '../../../application/stores/catalogo.store';
import { ImagenesStore } from '../../../application/stores/imagenes.store';
import { IngredientesStore } from '../../../application/stores/ingredientes.store';
import { RecetasStore } from '../../../application/stores/recetas.store';
import { GuardarRecetaUseCase } from '../../../application/use-cases/guardar-receta.usecase';
import { Ingrediente } from '../../../domain/ingredientes/ingrediente.model';
import { NutricionPorcion } from '../../../domain/nutricion/nutricion.model';
import {
  EspacioIngrediente,
  idParaReceta,
  PasoPreparacion,
  Receta,
  recetaNueva,
  ROLES,
  textoCantidad,
} from '../../../domain/recetas/receta.model';
import { BuscadorIngredienteComponent } from '../../ui/buscador-ingrediente.component';
import { FotoComponent } from '../../ui/foto.component';
import { NOMBRE_ROL_PLURAL } from '../../ui/iconos';
import { EditarIngredienteComponent } from './editar-ingrediente.component';

/** Lo que, si cambia, obliga a recalcular la nutrición. */
function huellaNutricional(r: Receta): string {
  return JSON.stringify([r.porciones, r.ingredientes, r.preparacion]);
}

const DIFICULTADES = [
  { valor: 1, nombre: 'Muy fácil' },
  { valor: 2, nombre: 'Fácil' },
  { valor: 3, nombre: 'Media' },
  { valor: 4, nombre: 'Difícil' },
  { valor: 5, nombre: 'Muy difícil' },
];

/** Pantalla 11 (simplificada): alta y edición de recetas. */
@Component({
  selector: 'app-receta-editor',
  imports: [BuscadorIngredienteComponent, EditarIngredienteComponent, FotoComponent],
  templateUrl: './receta-editor.page.html',
  styleUrl: './receta-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecetaEditorPage {
  protected readonly catalogos = inject(CatalogoStore);
  protected readonly ingredientes = inject(IngredientesStore);
  private readonly recetas = inject(RecetasStore);
  private readonly imagenes = inject(ImagenesStore);
  private readonly guardarReceta = inject(GuardarRecetaUseCase);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Vacío en /recetas/nueva; con valor en /recetas/:id/editar. */
  readonly id = input<string>();

  private readonly original = computed(() => {
    const id = this.id();
    return id ? (this.recetas.obtener(id) ?? null) : null;
  });

  protected readonly borrador = linkedSignal<Receta>(() => {
    const o = this.original();
    if (o) return structuredClone(o);
    const franja = this.catalogos.tiposComida()[0]?.codigo ?? 'seco';
    return recetaNueva(franja, this.catalogos.tiposCocina()[0]?.codigo ?? 'boliviana');
  });

  protected readonly esNueva = computed(() => !this.original());
  protected readonly dificultades = DIFICULTADES;

  /** Índice del espacio abierto en la hoja 11B. */
  protected readonly editando = signal<number | null>(null);
  protected readonly fotoNueva = signal<{ archivo: File; url: string } | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errores = signal<string[]>([]);

  /** Por defecto se recalcula si no hay nutrición o si cambió algo que la afecta. */
  private readonly recalcularSugerido = computed(() => {
    const o = this.original();
    return !o || !o.nutricionPorcion || huellaNutricional(o) !== huellaNutricional(this.borrador());
  });
  /** Decisión explícita de la usuaria (casilla o corrección a mano); null = usar la sugerencia. */
  private readonly recalcularElegido = signal<boolean | null>(null);
  protected readonly recalcular = computed(() => this.recalcularElegido() ?? this.recalcularSugerido());

  protected alternarRecalcular(): void {
    this.recalcularElegido.set(!this.recalcular());
  }

  protected readonly grupos = computed(() =>
    ROLES.map((rol) => ({
      rol,
      nombre: NOMBRE_ROL_PLURAL[rol],
      filas: this.borrador()
        .ingredientes.map((espacio, indice) => ({ espacio, indice }))
        .filter((f) => f.espacio.rol === rol),
    })),
  );

  protected readonly idsUsados = computed(
    () => new Set(this.borrador().ingredientes.flatMap((e) => e.opciones.map((o) => o.ingredienteId))),
  );

  protected readonly espacioEditando = computed(() => {
    const i = this.editando();
    return i === null ? null : (this.borrador().ingredientes[i] ?? null);
  });

  protected readonly pasos = computed(() => this.borrador().preparacion.pasos ?? []);

  // ---------- Datos básicos ----------
  protected cambiar<K extends keyof Receta>(campo: K, valor: Receta[K]): void {
    this.borrador.update((r) => ({ ...r, [campo]: valor }));
  }

  protected cambiarNumero(campo: 'porciones' | 'dificultad', valor: string): void {
    const n = Math.max(1, Math.round(Number(valor) || 1));
    this.cambiar(campo, n);
  }

  protected cambiarTiempo(campo: 'preparacionMin' | 'coccionMin', valor: string): void {
    const n = Math.max(0, Math.round(Number(valor) || 0));
    this.borrador.update((r) => {
      const tiempo = { ...r.tiempo, [campo]: n };
      return { ...r, tiempo: { ...tiempo, totalMin: tiempo.preparacionMin + tiempo.coccionMin } };
    });
  }

  // ---------- Foto ----------
  protected elegirFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    const previa = this.fotoNueva();
    if (previa) URL.revokeObjectURL(previa.url);
    this.fotoNueva.set({ archivo, url: URL.createObjectURL(archivo) });
  }

  // ---------- Ingredientes ----------
  protected textoCantidad = textoCantidad;

  protected agregarIngrediente(ing: Ingrediente): void {
    const rol = ing.categoria === 'condimentos' ? 'condimento' : 'esencial';
    const espacio: EspacioIngrediente = {
      orden: this.borrador().ingredientes.length + 1,
      rol,
      opciones: [{ ingredienteId: ing.id, cantidad: null, unidad: null, nota: null }],
    };
    this.borrador.update((r) => ({ ...r, ingredientes: [...r.ingredientes, espacio] }));
    // Los esenciales casi siempre llevan cantidad: se abre la hoja para ponerla.
    if (rol === 'esencial') this.editando.set(this.borrador().ingredientes.length - 1);
  }

  protected actualizarEspacio(indice: number, espacio: EspacioIngrediente): void {
    this.borrador.update((r) => ({
      ...r,
      ingredientes: r.ingredientes.map((e, i) => (i === indice ? espacio : e)),
    }));
  }

  protected quitarEspacio(indice: number): void {
    this.editando.set(null);
    this.borrador.update((r) => ({ ...r, ingredientes: r.ingredientes.filter((_, i) => i !== indice) }));
  }

  protected alternativas(espacio: EspacioIngrediente): string {
    return espacio.opciones
      .slice(1)
      .map((o) => this.ingredientes.nombre(o.ingredienteId).toLowerCase())
      .join(', o ');
  }

  // ---------- Pasos ----------
  private cambiarPasos(fn: (pasos: PasoPreparacion[]) => PasoPreparacion[]): void {
    this.borrador.update((r) => ({
      ...r,
      preparacion: { ...r.preparacion, pasos: fn(r.preparacion.pasos ?? []).map((p, i) => ({ ...p, numero: i + 1 })) },
    }));
  }

  protected agregarPaso(): void {
    this.cambiarPasos((p) => [...p, { numero: p.length + 1, instruccion: '', importante: null }]);
  }

  protected editarPaso(indice: number, cambios: Partial<PasoPreparacion>): void {
    this.cambiarPasos((p) => p.map((paso, i) => (i === indice ? { ...paso, ...cambios } : paso)));
  }

  protected alternarImportante(indice: number): void {
    const paso = this.pasos()[indice];
    this.editarPaso(indice, { importante: paso?.importante === null ? '' : null });
  }

  protected quitarPaso(indice: number): void {
    this.cambiarPasos((p) => p.filter((_, i) => i !== indice));
  }

  protected moverPaso(indice: number, delta: -1 | 1): void {
    this.cambiarPasos((p) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= p.length) return p;
      const copia = [...p];
      [copia[indice], copia[destino]] = [copia[destino]!, copia[indice]!];
      return copia;
    });
  }

  // ---------- Nutrición ----------
  protected cambiarNutricion(campo: keyof NutricionPorcion, valor: string): void {
    const base = this.borrador().nutricionPorcion ?? { kcal: 0, proteinaG: 0, carbohidratosG: 0, grasaG: 0 };
    const n = Math.max(0, Number(valor) || 0);
    this.recalcularElegido.set(false); // lo corregido a mano manda sobre la IA
    this.cambiar('nutricionPorcion', { ...base, [campo]: n });
  }

  // ---------- Guardar ----------
  protected async guardar(): Promise<void> {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.errores.set([]);
    try {
      let receta = this.borrador();
      if (!receta.id && receta.nombre.trim()) {
        receta = { ...receta, id: idParaReceta(receta.nombre, new Set(this.recetas.porId().keys())) };
      }
      const foto = this.fotoNueva();
      if (foto && receta.id) {
        receta = { ...receta, imagen: await this.imagenes.guardar(receta.id, foto.archivo) };
      }
      const resultado = await this.guardarReceta.ejecutar(receta, this.recalcular());
      if (resultado.errores.length > 0) {
        this.errores.set(resultado.errores);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      await this.router.navigate(['/recetas', resultado.receta!.id], { replaceUrl: true });
    } finally {
      this.guardando.set(false);
    }
  }

  protected cancelar(): void {
    this.location.back();
  }
}
