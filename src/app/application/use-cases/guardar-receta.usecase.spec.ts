import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EstimacionNutricional, EstimadorNutricional } from '../../domain/nutricion/estimador.port';
import { espacio, recetaDePrueba } from '../../domain/recetas/receta.fixtures';
import { Receta } from '../../domain/recetas/receta.model';
import { RecetaRepository } from '../../domain/recetas/receta.port';
import { RecetasStore } from '../stores/recetas.store';
import { GuardarRecetaUseCase } from './guardar-receta.usecase';

/** Puertos falsos: el caso de uso se prueba sin Firebase ni Gemini (hexagonal). */
class RepoFalso extends RecetaRepository {
  guardadas: Receta[] = [];
  async obtenerTodas() {
    return [];
  }
  async guardar(r: Receta) {
    this.guardadas.push(r);
  }
}

class EstimadorFalso extends EstimadorNutricional {
  respuesta: EstimacionNutricional | null = {
    porcion: { kcal: 400, proteinaG: 20, carbohidratosG: 50, grasaG: 10 },
    conOpcionales: { kcal: 450, proteinaG: 21, carbohidratosG: 55, grasaG: 12 },
  };
  llamadas = 0;
  async estimar() {
    this.llamadas++;
    return this.respuesta;
  }
}

describe('GuardarRecetaUseCase', () => {
  let repo: RepoFalso;
  let estimador: EstimadorFalso;
  let casoDeUso: GuardarRecetaUseCase;

  const valida = () =>
    recetaDePrueba({ id: '', nombre: 'Sopa de maní', ingredientes: [espacio('esencial', 'ing_mani')] });

  beforeEach(() => {
    repo = new RepoFalso();
    estimador = new EstimadorFalso();
    TestBed.configureTestingModule({
      providers: [
        { provide: RecetaRepository, useValue: repo },
        { provide: EstimadorNutricional, useValue: estimador },
      ],
    });
    casoDeUso = TestBed.inject(GuardarRecetaUseCase);
  });

  it('no guarda una receta inválida y explica por qué', async () => {
    const r = await casoDeUso.ejecutar(recetaDePrueba({ nombre: '' }), true);
    expect(r.receta).toBeNull();
    expect(r.errores).toContain('Ponle un nombre a la receta.');
    expect(repo.guardadas).toHaveLength(0);
    expect(estimador.llamadas).toBe(0);
  });

  it('genera el id, pide la nutrición UNA vez y actualiza la memoria', async () => {
    const r = await casoDeUso.ejecutar(valida(), true);
    expect(r.receta?.id).toBe('rec_sopa_de_mani');
    expect(r.receta?.nutricionPorcion?.kcal).toBe(400);
    expect(estimador.llamadas).toBe(1);
    expect(TestBed.inject(RecetasStore).obtener('rec_sopa_de_mani')).toBeTruthy();
  });

  it('si la IA no responde, guarda igual y marca la nutrición como pendiente', async () => {
    estimador.respuesta = null;
    const r = await casoDeUso.ejecutar(valida(), true);
    expect(r.nutricionPendiente).toBe(true);
    expect(r.receta?.nutricionPorcion).toBeNull();
    expect(repo.guardadas).toHaveLength(1);
  });

  it('sin recalcular, no llama a la IA', async () => {
    await casoDeUso.ejecutar(valida(), false);
    expect(estimador.llamadas).toBe(0);
  });

  it('dos recetas con el mismo nombre reciben ids distintos', async () => {
    const primera = await casoDeUso.ejecutar(valida(), false);
    const segunda = await casoDeUso.ejecutar(valida(), false);
    expect(primera.receta?.id).toBe('rec_sopa_de_mani');
    expect(segunda.receta?.id).toBe('rec_sopa_de_mani_2');
  });

  it('al editar conserva el id aunque cambie el nombre', async () => {
    const r = await casoDeUso.ejecutar({ ...valida(), id: 'rec_viejo', nombre: 'Nombre nuevo' }, false);
    expect(r.receta?.id).toBe('rec_viejo');
  });

  it('guarda la receta ya limpia (nombre sin espacios, total recalculado)', async () => {
    const r = await casoDeUso.ejecutar(
      { ...valida(), nombre: '  Sopa de maní  ', tiempo: { preparacionMin: 5, coccionMin: 10, totalMin: 0 } },
      false,
    );
    expect(repo.guardadas[0]).toMatchObject({ nombre: 'Sopa de maní', tiempo: { totalMin: 15 } });
    expect(r.receta?.nutricionCalculadaEn).toBeNull();
  });

  it('con IA guarda la fecha del cálculo', async () => {
    const r = await casoDeUso.ejecutar(valida(), true);
    expect(r.receta?.nutricionCalculadaEn).toBeInstanceOf(Date);
    expect(r.receta?.nutricionConOpcionales?.kcal).toBe(450);
  });
});
