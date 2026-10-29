# Recetas — Mi menú de cada día

PWA para una cocinera de casa: registra lo que hay en la **despensa**, sugiere **recetas bolivianas**
según lo disponible (afinidad) y arma el **menú del día** (desayuno + almuerzo) controlando calorías
y proteína frente a metas. Nutrición estimada por IA (Gemini) al guardar cada receta.

- **App publicada:** https://appfoodrecipes.web.app
- **Diseños:** `designMockups/mochup.pen` (Pencil) — cada pantalla se diseñó antes de programarse.
- Trabajo final del Módulo I — Diplomado en Full Stack Development & Advanced QA Automation 2026.

## Stack

| Pieza | Tecnología |
|---|---|
| Frontend | Angular 21 (standalone, signals, zoneless, control de flujo `@if/@for`) |
| Datos | Cloud Firestore con caché offline persistente |
| Autenticación | Firebase Auth (Google) + activación de cuentas por la administradora |
| IA | Firebase AI Logic (Gemini) — solo al guardar una receta |
| Hosting | Firebase Hosting (HTTPS + CDN) |
| PWA | `@angular/service-worker` — instalable en Android, funciona offline |
| Tests | Vitest |

## Arquitectura: DDD + hexagonal

```
src/app/
├── domain/          TS puro (sin Angular ni Firebase): modelos, reglas y PUERTOS
│   ├── recetas/  ingredientes/  despensa/  planificacion/ (afinidad, plan)
│   ├── listas/   grupos/  catalogos/  nutricion/  preferencias/  usuarios/
├── application/     casos de uso + stores con signals (estado en memoria)
├── infrastructure/  ADAPTADORES: firebase/ (Firestore, Auth, Gemini), local/ (fotos en IndexedDB),
│                    memoria/ (modo demo)
└── presentation/    páginas por módulo (features/*), layout y componentes ui/
```

Regla de dependencia: `presentation → application → domain ← infrastructure`.
Los puertos son clases abstractas en `domain/` y se conectan a sus adaptadores en `app.config.ts`.
Cambiar Firebase por otra cosa = tocar solo `infrastructure/` (el modo demo lo demuestra).

**Hogares:** cada cuenta pertenece a un hogar (`hogares/{id}`) que asigna la admin al activarla. Despensa,
metas, planes, listas y recetas/ingredientes propios viven dentro del hogar; recetas, ingredientes,
catálogos y grupos comunes son la semilla que solo edita la admin. Si una cuenta edita una receta común,
se guarda su copia en el hogar con el mismo id.

**Control de lecturas:** una sola carga al abrir. Las colecciones se leen de forma incremental
(`lectura-incremental.ts`): lo que ya está en la caché del dispositivo no se vuelve a pedir y al servidor
solo se le piden los documentos con `actualizadoEn` posterior a la última vez. Nada se borra de verdad
(se archiva o se marca `eliminada`), para que los otros dispositivos se enteren.

## Cómo ejecutarlo

Requisitos: Node.js LTS. Desde esta carpeta (`xCode/recetas`):

```bash
npm install          # solo la primera vez
npm start            # app real (Firebase) → http://localhost:4200
npm run demo         # MODO DEMO: datos del seed en memoria, sin login ni base real → http://localhost:4200
npm test             # tests unitarios (Vitest) — ver TESTS.md
npm run e2e          # E2E con Playwright contra el modo demo (levanta el servidor solo)
npm run test:reglas  # reglas de Firestore en el emulador (necesita Java y firebase-tools)
npm run build        # build de producción en dist/recetas/browser
```

> El modo demo no guarda nada: al recargar vuelve al estado inicial. Sirve para probar la interfaz.

## Despliegue (Firebase)

**Primera vez con hogares:** antes de desplegar esta versión hay que migrar los datos, porque una cuenta
sin hogar ya no entra a la app. Desde `seed/`:

```bash
node migrar-a-hogares.js            # simulación: muestra qué haría, no escribe nada
node migrar-a-hogares.js --aplicar  # crea el hogar, copia despensa/planes/listas y asigna las cuentas
node seed.js                        # sube SOLO las recetas e ingredientes nuevos (no pisa lo editado)
```

Después, el despliegue normal:

```bash
npm install -g firebase-tools     # una sola vez
firebase login                    # una sola vez
npm run build
firebase deploy --only firestore:rules,hosting
```

Antes de usar la nutrición por IA hay que habilitar **AI Logic → Gemini Developer API** en la consola
de Firebase (ver `Guia_Firebase_AI.md`).

## Seguridad

- La llave `serviceAccountKey.json` del seed **nunca** entra al repo (`.gitignore`).
- Reglas de Firestore: toda colección exige cuenta `activo`; lo común (recetas, ingredientes, catálogos,
  grupos) solo lo edita la admin, y lo de cada hogar solo lo leen y escriben sus miembros.
- CI (GitHub Actions): unitarios + build, reglas en el emulador y E2E en cada push y pull request.
- La clave de Gemini no está en la app: Firebase AI Logic la maneja del lado del servidor.
