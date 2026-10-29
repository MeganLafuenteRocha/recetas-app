# Tests — Recetas

**208 tests en 15 archivos, todos pasan.** Herramienta: Vitest, con el builder `@angular/build:unit-test`.

```powershell
npm test                      # todos los tests, se queda mirando cambios
npx ng test --watch=false     # una sola corrida (CI / antes del deploy)
```

## Qué se prueba

La regla de la arquitectura hexagonal se nota en los tests. El **dominio** se prueba con funciones puras, sin Angular ni Firebase. Los **casos de uso** y los **stores** se prueban con **puertos falsos**: clases que heredan del puerto y anotan lo que se llamó.

| Capa | Archivo `*.spec.ts` | Qué cubre |
|---|---|---|
| Dominio | `recetas/receta.model` | Validación para guardar, ids únicos, limpieza antes de guardar y textos de cantidad |
| | `planificacion/afinidad.service` | Puntaje 85/15/+5, redondeo, alternativas, básicos, compra inteligente |
| | `planificacion/plan.model` | Fechas (cambios de mes y de año, bisiesto, semanas lunes a domingo), totales y metas |
| | `listas/lista.model` | Faltantes de varias recetas, suma de cantidades, sin duplicados, progreso |
| | `ingredientes/ingrediente.model` | Búsqueda sin tildes, alta rápida, ids únicos |
| | `catalogos/catalogo.model` | Códigos, duplicados e integridad referencial (no se borra lo que se usa) |
| | `nutricion/nutricion.model` | Filtro de respuestas de la IA (límites por campo, NaN, infinito y tipos) |
| | `preferencias`, `grupos`, `usuarios` | Metas, nombre del grupo, permisos (tabla rol × estado) |
| Aplicación | `guardar-receta.usecase` | Valida antes de guardar, IA una sola vez, guarda aunque la IA falle |
| | `administrar-catalogos.usecase` | Lo inválido nunca llega a Firestore; bloquea borrar lo que está en uso |
| | `listas-compras.usecase` | Lista manual, agregar a la próxima, texto libre y paso a la despensa |
| | `despensa.store` | Debounce: muchos toques = 1 sola escritura (con relojes falsos) |

## Buenas prácticas aplicadas

- **Valores límite:** se prueba justo en el borde y a un paso de cada lado. Ejemplos: nombre de 2 y 3 letras; porciones -1, 0 y 1; kcal 999, 1000, 1300 y 1301; 3000 kcal y 3000.1; debounce a 799 y 800 ms.
- **Clases de equivalencia:** se prueba un caso de cada tipo, no cien iguales. Por ejemplo: vacío, solo espacios, válido, con tildes, con símbolos.
- **Tablas `it.each`:** una sola prueba recorre muchos casos y cada fila sale como un test con nombre propio.
- **AAA (preparar, actuar, comprobar):** cada test prueba **una** regla y su nombre la dice en español.
- **Inmutabilidad:** se comprueba que las funciones no modifican el objeto original.
- **Sin red ni base real:** los puertos falsos cuentan las llamadas a escritura y a la IA, para comprobar que no se gastan lecturas ni llamadas de más.
- **Fixtures compartidos:** se usa `receta.fixtures.ts` (`recetaDePrueba`, `espacio`) para no repetir datos.

## Hallazgos (el código no se cambió)

Estos casos los cubre la pantalla, pero no el dominio:

1. **`validarReceta` acepta `porciones = NaN`**, porque `NaN < 1` es falso. El editor lo evita convirtiendo a mínimo 1.
2. **`validarReceta` no revisa tiempos negativos ni dificultad fuera de 1 a 5.** El editor también los limita.
3. **El texto libre repetido** ("Pan" dos veces) sí se agrega dos veces a una lista. Es a propósito: no hay ingrediente con qué comparar.

Si se quiere más seguridad, los puntos 1 y 2 se pueden agregar a `validarReceta` con su test.
