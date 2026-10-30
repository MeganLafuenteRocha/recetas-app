# Sistema de diseño — Recetas

Fuente: `designMockups/mochup.pen`, tablero **«00 Sistema de diseño — Recetas»** y filas A–G
(exportadas en `designMockups/export/`). El código replica esas piezas en tres capas;
**las pantallas solo usan estas capas** (ningún color, radio, sombra o fuente suelta).

## 1. Tokens — `src/styles/_tokens.scss`

| Token | Uso |
|---|---|
| `--color-primario` / `-fuerte` / `-suave` | Guindo: acción principal y activo · presionado · fondo de activo y círculos de ícono |
| `--color-acento` / `-claro` / `-suave` | Dorado: sobretítulos y avisos · dorado sobre oscuro · fondo de aviso |
| `--color-fondo` | Crema, fondo de toda la app y de las hojas |
| `--color-superficie` | Blanco de las tarjetas |
| `--color-oscuro` | Tarjeta de resumen oscura (opciones del día, semana) |
| `--color-texto` / `-suave` / `-tenue` / `-invertido` | Texto principal · secundario · apagado · sobre guindo u oscuro |
| `--color-linea`, `--color-borde`, `--color-control-apagado` | Pistas de progreso · celdas vacías · interruptor apagado |
| `--color-ok` / `-suave`, `--color-error` / `-suave` | «Tienes todo», listo · errores y borrar |
| `--fuente-titulo`, `--fuente-texto` | Quicksand · Poppins |
| `--radio-tarjeta` 22 · `--radio-control` 16 · `--radio-foto` 16 · `--radio-hoja` 32 · `--radio-pill` | Formas |
| `--esp-pantalla` 20 · `--esp-seccion` 22 · `--esp-grupo` 12 | Espaciado |
| `--sombra-flotante`, `--sombra-boton`, `--sombra-suave` | Solo para lo que flota |

## 2. Primitivos (clases) — `src/styles/_componentes.scss` y `_tipografia.scss`

- **Escala de texto:** `.t-titular` 30 · `.t-pantalla` 26 · `.t-receta` 28 · `.t-seccion` 17 · `.t-tarjeta` 15 · `.t-texto` 13 · `.t-detalle` 11 suave · `.t-sobretitulo` 10 dorado en mayúsculas.
- **Pantalla:** `<main class="pantalla">` (margen 20, separación 22 entre secciones). `.pila` agrupa con 12. `.pie-fijo` deja la acción principal pegada abajo en pantallas sin pestañas.
- **Botones:** `.btn` + `.btn-primario` | `.btn-secundario` | `.btn-suave` | `.btn-acento` | `.btn-texto` | `.btn-peligro`, tamaños `.btn-chico`, `.btn-ancho`. Botón redondo: `.boton-icono` (+ `.primario`, `.suave`, `.translucido` sobre fotos, `.sin-fondo`).
- **Chips:** `.chips` (fila con scroll; `.envolver` para varias líneas) y `.chip` (+ `.activo`, `.suave`, `.acento`). **Pastilla** informativa: `.pastilla` (+ `.ok`, `.primario`, `.solida`). **Segmentos:** `.segmentos > button(.activo)`.
- **Tarjetas:** `.tarjeta` (blanca, radio 22, padding 16) + `.lista` (filas), `.oscura`, `.primaria`, `.acento`. `.foto-marco` para fotos con elementos encima.
- **Formularios:** `.campo > span + .caja` (input/select/textarea). `.buscador > .icono + input`.
- **Otros:** `.progreso > span` (+ `.primario`, `.acento`), `.punto`, `.rol-esencial|condimento|opcional` (define `--rol`), `.vacio-estado`, `.toque` (envoltura tocable sin estilo), `.solo-lector`.
- **Íconos:** `<span class="icono">nombre</span>` (Material Symbols Rounded; `.lleno` para la variante rellena).

## 3. Componentes Angular — `src/app/presentation/ui/`

| Componente | En Pencil | Notas |
|---|---|---|
| `app-encabezado` | C · Encabezado | `titulo`, `volver` (ruta), `principal` (título grande de pestaña); acciones proyectadas |
| `app-cabecera-seccion` | C · Cabecera de sección | `titulo`, `icono`; enlace proyectado a la derecha |
| `app-tarjeta-receta` | C · Tarjeta receta | `receta`, `resultado`, `sobretitulo`; se envuelve en `a.toque`/`button.toque` |
| `app-tarjeta-plato` | C · Tarjeta plato | `receta`, `resultado`, `elegida`; `[esquina]` proyecta un botón sobre la foto |
| `app-estado-receta` | línea «● Tienes todo» | Regla 2: reemplaza a cualquier % o píldora de afinidad |
| `app-fila-ingrediente` | C · Fila ingrediente | `emoji`, `nombre`, `detalle`; a la derecha lo proyectado; host `.marcado` / `.hecho` / `.apagado` |
| `app-fila-ajuste` | C · Fila de ajuste | `icono`, `etiqueta`, `valor` |
| `app-aviso` | C · Aviso | `icono`, `titulo`, `tono` (`acento` · `ok` · `error`); detalle proyectado, `[accion]` a la derecha |
| `app-interruptor` | C · Interruptor | `[(valor)]` |
| `app-hoja` | hojas 09, 11B, 17B | `titulo`; `[acciones]` junto al título |
| `app-foto` | fotos | `clave`, `radio`, `emoji` (lo que se ve si no hay foto) |
| `app-barra-pestanas` (layout) | C · Barra de pestañas | 4 destinos + botón central «Armar mi día» |

Emojis de ingredientes y franjas: `ui/emojis.ts` (`emojiIngrediente`, `emojiCategoria`, `emojiFranja`).
Textos de formato: `ui/iconos.ts` (`duracion`, `nombreDificultad`, `fechaLarga`…).

## Reglas

1. El nombre del plato es lo primero: nunca se corta, hasta 2 líneas.
2. La afinidad es un dato de apoyo: `app-estado-receta`, nunca una píldora con %.
3. Una sola acción principal por pantalla, en guindo y al alcance del pulgar.
4. Tarjetas blancas sobre fondo crema; sin bordes; sombra solo en lo que flota.
5. Toda receta muestra su foto; si falta, fondo crema con el emoji de la franja.
6. Espaciado: 20 de margen, 22 entre secciones, 12 entre elementos relacionados.
