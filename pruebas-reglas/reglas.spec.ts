import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * Lo que prometen las reglas (D4): cada hogar ve solo lo suyo y lo común solo lo edita la admin.
 * Corre contra el emulador de Firestore: `npm run test:reglas` (necesita Java).
 */
let entorno: RulesTestEnvironment;

const cuentas = {
  admin: { rol: 'admin', estado: 'activo', hogarId: 'hog_a' },
  ana: { rol: 'usuario', estado: 'activo', hogarId: 'hog_a' },
  beto: { rol: 'usuario', estado: 'activo', hogarId: 'hog_b' },
  pendiente: { rol: 'usuario', estado: 'pendiente', hogarId: null },
  sinHogar: { rol: 'usuario', estado: 'activo', hogarId: null },
} as const;

type Cuenta = keyof typeof cuentas;

const db = (uid: Cuenta) => entorno.authenticatedContext(uid).firestore();

beforeAll(async () => {
  entorno = await initializeTestEnvironment({
    projectId: 'demo-recetas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await entorno.cleanup();
});

beforeEach(async () => {
  await entorno.clearFirestore();
  // Datos de partida, escritos sin pasar por las reglas.
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const base = ctx.firestore();
    for (const [uid, datos] of Object.entries(cuentas)) {
      await setDoc(doc(base, 'usuarios', uid), { nombre: uid, email: `${uid}@x.com`, ...datos });
    }
    await setDoc(doc(base, 'recetas', 'rec_silpancho'), { nombre: 'Silpancho' });
    await setDoc(doc(base, 'hogares', 'hog_a'), { nombre: 'Hogar A' });
    await setDoc(doc(base, 'hogares', 'hog_b'), { nombre: 'Hogar B' });
    await setDoc(doc(base, 'hogares', 'hog_a', 'datos', 'despensa'), { ingredienteIds: ['ing_papa'] });
    await setDoc(doc(base, 'hogares', 'hog_b', 'datos', 'despensa'), { ingredienteIds: [] });
  });
});

describe('datos del hogar', () => {
  it('una cuenta activa lee y escribe la despensa de SU hogar', async () => {
    await assertSucceeds(getDoc(doc(db('ana'), 'hogares/hog_a/datos/despensa')));
    await assertSucceeds(setDoc(doc(db('ana'), 'hogares/hog_a/datos/despensa'), { ingredienteIds: [] }));
  });

  it('no puede leer ni escribir la despensa de OTRO hogar', async () => {
    await assertFails(getDoc(doc(db('beto'), 'hogares/hog_a/datos/despensa')));
    await assertFails(setDoc(doc(db('beto'), 'hogares/hog_a/planes/2026-10-29'), { elecciones: [] }));
  });

  it('la admin tampoco entra a los datos de otro hogar', async () => {
    await assertFails(getDoc(doc(db('admin'), 'hogares/hog_b/datos/despensa')));
  });

  it('una cuenta pendiente o sin hogar no ve nada', async () => {
    await assertFails(getDoc(doc(db('pendiente'), 'hogares/hog_a/datos/despensa')));
    await assertFails(getDoc(doc(db('sinHogar'), 'hogares/hog_a/datos/despensa')));
    await assertFails(getDoc(doc(db('pendiente'), 'recetas/rec_silpancho')));
  });

  it('una receta propia (copia) se guarda en el hogar', async () => {
    await assertSucceeds(setDoc(doc(db('ana'), 'hogares/hog_a/recetas/rec_silpancho'), { nombre: 'Silpancho de Ana' }));
  });
});

describe('semillas comunes', () => {
  it('toda cuenta activa lee el recetario común', async () => {
    await assertSucceeds(getDoc(doc(db('beto'), 'recetas/rec_silpancho')));
  });

  it('solo la admin edita lo común', async () => {
    await assertFails(setDoc(doc(db('ana'), 'recetas/rec_silpancho'), { nombre: 'Cambiado' }));
    await assertFails(setDoc(doc(db('ana'), 'ingredientes/ing_papa'), { nombre: 'Papa' }));
    await assertSucceeds(setDoc(doc(db('admin'), 'recetas/rec_silpancho'), { nombre: 'Silpancho' }));
  });
});

describe('cuentas y hogares', () => {
  it('una cuenta nueva no puede elegirse hogar ni rol', async () => {
    const nueva = entorno.authenticatedContext('nueva').firestore();
    await assertFails(setDoc(doc(nueva, 'usuarios/nueva'), { rol: 'usuario', estado: 'pendiente', hogarId: 'hog_a' }));
    await assertFails(setDoc(doc(nueva, 'usuarios/nueva'), { rol: 'admin', estado: 'pendiente', hogarId: null }));
    await assertSucceeds(setDoc(doc(nueva, 'usuarios/nueva'), { rol: 'usuario', estado: 'pendiente', hogarId: null }));
  });

  it('una cuenta no puede cambiarse de hogar a sí misma', async () => {
    await assertFails(setDoc(doc(db('beto'), 'usuarios/beto'), { ...cuentas.beto, hogarId: 'hog_a' }));
  });

  it('solo la admin crea hogares', async () => {
    await assertFails(setDoc(doc(db('ana'), 'hogares/hog_c'), { nombre: 'C' }));
    await assertSucceeds(setDoc(doc(db('admin'), 'hogares/hog_c'), { nombre: 'C' }));
  });
});
