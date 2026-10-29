/**
 * MODO DEMO: adaptadores en memoria con los datos del seed.
 * Implementan los MISMOS puertos que Firebase; solo se usan con `ng serve --configuration demo`.
 * Sirven para probar la interfaz sin cuenta de Google y sin tocar la base real.
 * Nada se guarda: al recargar la página vuelve al estado inicial.
 */
import { Injectable } from '@angular/core';
import { Catalogos } from '../../domain/catalogos/catalogo.model';
import { CatalogoRepository } from '../../domain/catalogos/catalogo.port';
import { Despensa } from '../../domain/despensa/despensa.model';
import { DespensaRepository } from '../../domain/despensa/despensa.port';
import { Grupo } from '../../domain/grupos/grupo.model';
import { GrupoRepository } from '../../domain/grupos/grupo.port';
import { Hogar } from '../../domain/hogares/hogar.model';
import { HogarRepository } from '../../domain/hogares/hogar.port';
import { Ingrediente } from '../../domain/ingredientes/ingrediente.model';
import { IngredienteRepository } from '../../domain/ingredientes/ingrediente.port';
import { ListaCompra } from '../../domain/listas/lista.model';
import { ListaRepository } from '../../domain/listas/lista.port';
import { EstimacionNutricional, EstimadorNutricional, RecetaParaEstimar } from '../../domain/nutricion/estimador.port';
import { ReferenciasNutricionales } from '../../domain/nutricion/nutricion.model';
import { desdeISO, fechaISO, PlanDia, semanaDe, sumarDias } from '../../domain/planificacion/plan.model';
import { PlanRepository } from '../../domain/planificacion/plan.port';
import { Preferencias, PREFERENCIAS_POR_DEFECTO } from '../../domain/preferencias/preferencias.model';
import { PreferenciasRepository } from '../../domain/preferencias/preferencias.port';
import { Receta } from '../../domain/recetas/receta.model';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { CuentaExterna, SesionPort } from '../../domain/usuarios/sesion.port';
import { EstadoUsuario, Usuario } from '../../domain/usuarios/usuario.model';
import { UsuarioRepository } from '../../domain/usuarios/usuario.port';
import catalogos from './datos/catalogos.json';
import ingredientes from './datos/ingredientes.json';
import recetas from './datos/recetas.json';
import referencias from './datos/referencias.json';

const copia = <T>(x: T): T => structuredClone(x);

/** Algunas recetas con nutrición para que se vean totales y metas. */
const NUTRICION_DEMO: Record<string, [number, number, number, number]> = {
  rec_silpancho: [620, 34, 68, 22],
  rec_sopa_mani: [320, 14, 30, 16],
  rec_api_con_pastel: [380, 8, 62, 11],
  rec_majadito: [540, 22, 70, 18],
  rec_licuado_platano_avena: [260, 8, 46, 5],
  rec_sopa_quinua: [240, 10, 34, 6],
};

function recetasDemo(): Receta[] {
  return (recetas as unknown as Receta[]).map((r) => {
    const n = NUTRICION_DEMO[r.id];
    return {
      ...r,
      ambito: 'comun',
      nutricionPorcion: n ? { kcal: n[0], proteinaG: n[1], carbohidratosG: n[2], grasaG: n[3] } : null,
      nutricionConOpcionales: n ? { kcal: n[0] + 30, proteinaG: n[1], carbohidratosG: n[2] + 4, grasaG: n[3] + 1 } : null,
      nutricionCalculadaEn: null,
    };
  });
}

const ADMIN_DEMO: Usuario = {
  uid: 'demo',
  nombre: 'Andrea Megan',
  email: 'demo@recetas.app',
  foto: null,
  rol: 'admin',
  estado: 'activo',
  hogarId: 'hog_demo',
  creadoEn: new Date(),
};

@Injectable({ providedIn: 'root' })
export class SesionMemoria extends SesionPort {
  private readonly cuenta: CuentaExterna = { uid: 'demo', nombre: ADMIN_DEMO.nombre, email: ADMIN_DEMO.email, foto: null };
  async iniciarConGoogle(): Promise<CuentaExterna> {
    return this.cuenta;
  }
  async cuentaActual(): Promise<CuentaExterna | null> {
    return this.cuenta;
  }
  async cerrarSesion(): Promise<void> {}
  haySesionGuardada(): boolean {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class UsuariosMemoria extends UsuarioRepository {
  private usuarios: Usuario[] = [
    ADMIN_DEMO,
    { ...ADMIN_DEMO, uid: 'u1', nombre: 'María Rocha', email: 'maria.rocha@gmail.com', rol: 'usuario', estado: 'pendiente', hogarId: null, creadoEn: new Date(Date.now() - 2 * 3600_000) },
    { ...ADMIN_DEMO, uid: 'u2', nombre: 'Jorge Vega', email: 'jorgevega88@gmail.com', rol: 'usuario', estado: 'pendiente', hogarId: null, creadoEn: new Date(Date.now() - 86_400_000) },
  ];
  async obtener(uid: string) {
    return this.usuarios.find((u) => u.uid === uid) ?? null;
  }
  async crearPendiente(u: Usuario) {
    this.usuarios.push(u);
  }
  async listarPorEstado(estado: EstadoUsuario) {
    return this.usuarios.filter((u) => u.estado === estado);
  }
  async cambiarEstado(uid: string, estado: EstadoUsuario) {
    this.usuarios = this.usuarios.map((u) => (u.uid === uid ? { ...u, estado } : u));
  }
  async activarEnHogar(uid: string, hogarId: string) {
    this.usuarios = this.usuarios.map((u) => (u.uid === uid ? { ...u, estado: 'activo' as const, hogarId } : u));
  }
}

@Injectable({ providedIn: 'root' })
export class HogaresMemoria extends HogarRepository {
  private hogares: Hogar[] = [{ id: 'hog_demo', nombre: 'Hogar de demostración', creadoEn: new Date() }];
  async obtenerTodos() {
    return copia(this.hogares);
  }
  async crear(h: Hogar) {
    this.hogares.push(h);
  }
}

@Injectable({ providedIn: 'root' })
export class CatalogosMemoria extends CatalogoRepository {
  private datos = copia(catalogos) as Catalogos;
  async obtenerCatalogos() {
    return copia(this.datos);
  }
  async obtenerReferencias() {
    return copia(referencias) as ReferenciasNutricionales;
  }
  async guardarCatalogos(c: Catalogos) {
    this.datos = copia(c);
  }
}

@Injectable({ providedIn: 'root' })
export class IngredientesMemoria extends IngredienteRepository {
  async obtenerComunes() {
    return (copia(ingredientes) as Omit<Ingrediente, 'ambito'>[]).map((i) => ({ ...i, ambito: 'comun' as const }));
  }
  async obtenerPropios() {
    return [];
  }
  async guardarLote() {}
}

@Injectable({ providedIn: 'root' })
export class RecetasMemoria extends RecetaRepository {
  async obtenerComunes() {
    return recetasDemo();
  }
  async obtenerPropias() {
    return [];
  }
  async guardar() {}
}

@Injectable({ providedIn: 'root' })
export class DespensaMemoria extends DespensaRepository {
  async obtener(): Promise<Despensa> {
    const ids = ['ing_papa', 'ing_cebolla', 'ing_tomate', 'ing_arroz', 'ing_huevo', 'ing_filete_res', 'ing_pollo', 'ing_leche', 'ing_arveja', 'ing_mani_molido', 'ing_fideo', 'ing_platano', 'ing_avena', 'ing_zanahoria', 'ing_ajo', 'ing_comino'];
    return { ingredienteIds: ids, actualizadaEn: null };
  }
  async guardar() {}
}

@Injectable({ providedIn: 'root' })
export class PlanesMemoria extends PlanRepository {
  private planes = new Map<string, PlanDia>();
  constructor() {
    super();
    const hoy = new Date();
    const [lunes] = semanaDe(hoy);
    const menus: [string, string, string][] = [
      ['rec_licuado_platano_avena', 'rec_sopa_fideo', 'rec_falso_conejo'],
      ['rec_api_con_pastel', 'rec_chupe_verduras', 'rec_majadito'],
      ['rec_sandwich_huevo', 'rec_lawa_choclo', 'rec_aji_fideo'],
    ];
    menus.forEach((m, i) => {
      const fecha = fechaISO(sumarDias(desdeISO(lunes!), i));
      this.planes.set(fecha, {
        fecha,
        elecciones: [
          { franja: 'desayuno', recetaId: m[0] },
          { franja: 'sopa', recetaId: m[1] },
          { franja: 'seco', recetaId: m[2] },
        ],
        creadoEn: null,
      });
    });
    const hoyIso = fechaISO(hoy);
    this.planes.set(hoyIso, {
      fecha: hoyIso,
      elecciones: [
        { franja: 'desayuno', recetaId: 'rec_api_con_pastel' },
        { franja: 'sopa', recetaId: 'rec_sopa_mani' },
        { franja: 'seco', recetaId: 'rec_silpancho' },
      ],
      creadoEn: null,
    });
  }
  async obtenerDia(fecha: string) {
    return this.planes.get(fecha) ?? null;
  }
  async obtenerRango(desde: string, hasta: string) {
    return [...this.planes.values()].filter((p) => p.fecha >= desde && p.fecha <= hasta);
  }
  async guardarDia(plan: PlanDia) {
    this.planes.set(plan.fecha, plan);
  }
}

@Injectable({ providedIn: 'root' })
export class PreferenciasMemoria extends PreferenciasRepository {
  private p: Preferencias = PREFERENCIAS_POR_DEFECTO;
  async obtener() {
    return this.p;
  }
  async guardar(p: Preferencias) {
    this.p = p;
  }
}

@Injectable({ providedIn: 'root' })
export class GruposMemoria extends GrupoRepository {
  private grupos: Grupo[] = [
    { id: 'g1', nombre: 'Para visitas', descripcion: 'Platos para cuando vienen invitados.', icono: 'groups', recetaIds: ['rec_pique_macho', 'rec_sopa_mani', 'rec_picante_pollo', 'rec_arroz_con_leche'] },
    { id: 'g2', nombre: 'Comidas rápidas', descripcion: 'Listas en menos de una hora.', icono: 'timer', recetaIds: ['rec_sandwich_huevo', 'rec_licuado_platano_avena', 'rec_majadito'] },
  ];
  async obtenerTodos() {
    return copia(this.grupos);
  }
  async guardar(g: Grupo) {
    this.grupos = [...this.grupos.filter((x) => x.id !== g.id), g];
  }
  async eliminar(id: string) {
    this.grupos = this.grupos.filter((g) => g.id !== id);
  }
}

@Injectable({ providedIn: 'root' })
export class ListasMemoria extends ListaRepository {
  private listas: ListaCompra[] = [
    {
      id: 'l1',
      nombre: 'Compra del sábado',
      fechaCompra: fechaISO(sumarDias(new Date(), 3)),
      origen: 'plan',
      creadaEn: new Date(),
      items: [
        { id: 'a', ingredienteId: 'ing_zanahoria', textoLibre: null, cantidad: 3, unidad: 'u', comprado: false, motivo: 'Chairo, Sopa de quinua' },
        { id: 'b', ingredienteId: 'ing_locoto', textoLibre: null, cantidad: 2, unidad: 'u', comprado: false, motivo: 'Silpancho' },
        { id: 'c', ingredienteId: 'ing_haba_verde', textoLibre: null, cantidad: 500, unidad: 'g', comprado: true, motivo: null },
        { id: 'd', ingredienteId: null, textoLibre: 'Detergente', cantidad: null, unidad: null, comprado: false, motivo: null },
      ],
    },
  ];
  async obtenerTodas() {
    return copia(this.listas);
  }
  async guardar(l: ListaCompra) {
    this.listas = [...this.listas.filter((x) => x.id !== l.id), l];
  }
  async eliminar(id: string) {
    this.listas = this.listas.filter((l) => l.id !== id);
  }
}

/** Sin IA en el demo: una estimación fija y razonable, con una pausa para ver el "Calculando…". */
@Injectable({ providedIn: 'root' })
export class EstimadorMemoria extends EstimadorNutricional {
  async estimar(r: RecetaParaEstimar): Promise<EstimacionNutricional | null> {
    await new Promise((ok) => setTimeout(ok, 800));
    const base = 120 + r.ingredientes.length * 45;
    const porcion = { kcal: base, proteinaG: Math.round(base / 25), carbohidratosG: Math.round(base / 9), grasaG: Math.round(base / 40) };
    return { porcion, conOpcionales: { ...porcion, kcal: base + 25 } };
  }
}
