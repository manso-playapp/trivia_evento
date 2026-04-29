# Changelog

Registro de cambios del proyecto. Este archivo es la fuente de verdad para la
version visible en admin.

## [0.7.0] - 2026-04-29

### Fix: respuestas concurrentes sin conflictos de revision

- Se agrego tabla `submitted_answers` en Supabase con clave primaria
  `(game_id, table_id, round_number)`. Ver `supabase/migrations/002_submitted_answers.sql`.
- El endpoint `/api/game/command` para `submit_answer` ahora hace un upsert
  atomico en `submitted_answers` en lugar de actualizar el snapshot de `game_sessions`.
  Esto elimina la cascada de conflictos de revision entre mesas concurrentes.
- `readOrSeedServerGameState` lee `submitted_answers` en paralelo y mergea las
  respuestas en el estado antes de pasarlo a los reducers del dominio (lockRound,
  applyScores siguen funcionando igual).
- Se agrego `clearSubmittedAnswersForGame` que se dispara al hacer `reset_game`
  para evitar que respuestas de una partida anterior aparezcan en la siguiente.

### Fix: optimistic update en submit_answer (modo server)

- En modo `server`, `submitAnswer` aplica el reducer localmente antes de hacer
  el POST. El boton de respuesta se ve seleccionado de inmediato sin esperar
  el round-trip al servidor.
- Si el POST falla, se hace `pullRemoteState()` para revertir al estado real.

### Fix: canal Realtime separado para respuestas

- En modo `server`, el servicio de cliente abre un canal Realtime en
  `submitted_answers` ademas del canal de `game_sessions`.
- Cada respuesta entrante se mergea en el estado local sin tocar el resto del
  snapshot. Las otras vistas (screen, operator) ven las respuestas en tiempo real.
- El canal de `game_sessions` preserva las respuestas del cache local cuando
  llega un update del operador (el snapshot del servidor no las incluye durante
  `round_active`).

## [0.6.33] - 2026-04-18
- Se forzo refresh de logo por nombre de archivo versionado: branding ahora usa `public/branding/company-logo-v3.png`.
- Esto evita cache stale de `next/image` cuando se reemplaza el logo con el mismo nombre.

## [0.6.32] - 2026-04-18
- En `/screen` se removio la palabra `TRIVIA` del header visual, dejando solo el logo.

## [0.6.31] - 2026-04-18
- Se actualizo el logo activo global para usar `public/branding/company-logo.png` (foto nueva subida).
- El branding en todas las vistas vuelve a leer el archivo principal de logo sin alias intermedio.

## [0.6.30] - 2026-04-18
- Fix de build/prerender: se quito query string del `src` de `next/image` para el logo (incompatible sin `images.localPatterns` en Next 16).
- Se paso a archivo versionado `public/branding/company-logo-white.png` y branding global actualizado para evitar cache stale sin romper compilacion.

## [0.6.29] - 2026-04-18
- Se actualizo branding para forzar refresco de cache del logo (`company-logo.png`) al reemplazarlo con el mismo nombre.
- El logo blanco nuevo en `public/branding/company-logo.png` se aplica ahora de forma inmediata en todas las vistas.

## [0.6.28] - 2026-04-18
- En `/screen`, `logo + TRIVIA` se movieron al bloque izquierdo principal de la pantalla (fuera del sidebar derecho).
- Se alineo el render del logo a la izquierda en esa vista para reforzar posicionamiento de marca.
- El sidebar derecho quedo enfocado en timer + Top 5.

## [0.6.27] - 2026-04-18
- En `/screen`, `logo + TRIVIA` se movieron al lado izquierdo del header lateral.
- El timer de sidebar se agrando (mismo estilo mobile) con nueva variante de tamano para pantalla publica.
- `Top 5` compacto quedo sin tarjeta/fondo contenedor y ahora usa todo el alto disponible del bloque.
- Se ajusto la distribucion vertical del sidebar para alinear mejor `Top 5` con la zona de respuestas.

## [0.6.26] - 2026-04-18
- `/screen` ahora usa el mismo timer circular de mobile para mantener consistencia visual entre vistas.
- La grilla inferior de mesas llena siempre el alto disponible: ajusta filas/columnas segun mesas activas y estira la altura de cada tarjeta compacta.
- Se aumento el aire vertical y jerarquia tipografica en pregunta/respuestas compactas para acercar la lectura de pantalla publica al estilo mobile.
- Se hizo el timer mobile hydration-safe en SSR con valor inicial determinista y sincronizacion al montar en cliente.

## [0.6.25] - 2026-04-18
- Se rediseño `/screen` con layout en dos franjas: superior `3/4` e inferior `1/4`.
- Se elimino la tarjeta de countdown y se paso a sidebar derecho con header `logo + TRIVIA`, timer ancho completo y `Top 5`.
- La franja inferior ahora distribuye dinamicamente solo mesas activas (sin inactivas) segun cantidad vigente.

## [0.6.24] - 2026-04-18
- Se unifico la estetica visual en todas las vistas: tarjetas, paneles, bordes, botones y formularios con el mismo lenguaje dark minimal.
- Se crearon utilidades globales `app-input` y `app-accent-panel` para consistencia de formas, bordes y uso del color de acento.
- Se actualizaron componentes base (`AppShell`, `SectionCard`, `Card`, `Button`) y paneles de operador/auth/QR/contexto para alinearlos al estilo mobile.

## [0.6.23] - 2026-04-18
- Se simplifico el copy de resultado en mobile: "Respuesta correcta!" y "Respuesta incorrecta.".
- Se mantuvieron los colores de tarjetas por resultado y se agrego confetti para respuesta correcta.

## [0.6.22] - 2026-04-18
- Se agrego feedback explicito en mobile al terminar el tiempo: indica que el tiempo se acabo, que opcion se eligio y si fue correcta o incorrecta con iconos.
- Se colorean las tarjetas de respuesta de forma intuitiva en reveal: seleccion correcta (verde invertido), seleccion incorrecta (rojo) y opcion correcta no seleccionada (verde suave).

## [0.6.21] - 2026-04-18
- Se agrego parpadeo rojo con `ease-in-out` al relleno del timer en los ultimos 5 segundos.
- El efecto se aplico en timer mobile y timer circular del header de pantalla publica.

## [0.6.20] - 2026-04-18
- Se agrego un glow leve del mismo color al aro de progreso del timer.
- El glow se aplico en timer mobile y en timer header de pantalla publica para mantener consistencia visual.

## [0.6.19] - 2026-04-18
- En mobile, cuando la respuesta seleccionada es correcta y la ronda entra en reveal/score/fin, se invierten colores (fondo verde seleccion + tipografia clara).
- Se aumento nuevamente la tipografia de la pregunta en `/play/[tableId]`.

## [0.6.18] - 2026-04-18
- Se redujo la tipografia del mensaje "La ronda ya no acepta cambios." en mobile.
- Se aumento la tipografia de la pregunta en la vista mobile `/play/[tableId]`.

## [0.6.17] - 2026-04-18
- Se aplico el verde seleccion `#09e1aa` en estados de opcion elegida para todas las vistas.
- Se actualizaron `screen/operator/play` para usar estilos de seleccion basados en token semantico (`success/selection-green`).

## [0.6.16] - 2026-04-18
- Se reemplazo `#19c6b5` por `#09e1aa`.
- Se creo el token `--selection-green` (verde seleccion) y se aplico en borde/texto de respuesta seleccionada en mobile.

## [0.6.15] - 2026-04-18
- Se cambio a `#19c6b5` el color del texto de la respuesta seleccionada en mobile.

## [0.6.14] - 2026-04-18
- Se actualizo el fondo de tarjetas de respuestas mobile a `#1e2229`.

## [0.6.13] - 2026-04-18
- Se quito la tarjeta de fondo del mensaje "La ronda ya no acepta cambios." en mobile.

## [0.6.12] - 2026-04-18
- Se ajusto el fondo de tarjetas de respuestas mobile a `#2a2f36`.
- La respuesta elegida ahora muestra borde de `0.5px` en `#19c6b5`.

## [0.6.11] - 2026-04-18
- Se cambio el token `--warning` de `#c9a96c` a `#19c6b5`.
- Se elimino la tarjeta contenedora de fondo en la vista mobile `/play/[tableId]`.
- El fondo de la vista mobile quedo fijo en `#343a43`.

## [0.6.10] - 2026-04-18
- Se ajusto la escala tipografica de la nueva vista mobile para quedar mas fiel a la referencia visual.
- El aro del timer mobile quedo en tono ambar por defecto para replicar el look del ejemplo.
- Se afino el estilo de seleccion de respuesta (borde/acento) en mobile.

## [0.6.9] - 2026-04-18
- Se rediseño la vista mobile `/play/[tableId]` con layout tipo app (estilo referencia) y timer circular protagonista.
- Se actualizaron las opciones de respuesta a botones oscuros full-width, con acento rojo en seleccion.
- Se aplico un estilo visual minimalista sin separadores en mobile, con grises profundos y sombras suaves.

## [0.6.8] - 2026-04-18
- Se aplico estilo minimalista dark en `/screen` con base de grises y rojo como acento principal.
- Se rediseño el timer header a formato circular sin lineas separadoras.
- Se actualizaron tarjetas de respuestas compactas a estilo boton oscuro con acento rojo en seleccion y turquesa en estado correcto.

## [0.6.7] - 2026-04-18
- Se agrego mas aire vertical en bloque de pregunta y tarjetas de respuestas en `/screen`.
- Se agrandaron las letras A/B/C/D en respuestas para lectura a distancia.
- Se rediseño la tarjeta de tiempo en header de pantalla publica para alinearla con el nuevo estilo compacto.

## [0.6.6] - 2026-04-18
- Se optimizo `/screen` para LED de menor resolucion: menos recuadros, layout mas denso y mejor uso vertical.
- Las 20 mesas ahora se muestran en formato compacto con `Mesa #` y puntos, sin texto `Respondio/Pendiente`.
- El estado de respuesta en pantalla publica se comunica por color de contenedor.
- Se redujo la curvatura base de esquinas un 60% en paneles y radios globales.

## [0.6.5] - 2026-04-18
- Se cambio la paleta a una version blue-gray dominante para fondo y superficies.
- Se redujo la presencia visual del rojo para usarlo como acento puntual y mejorar balance dark corporate.

## [0.6.3] - 2026-04-18
- Se aplico nueva paleta corporativa global (azul, rojo, gris calido y gris claro) en `globals.css`.
- Se ajustaron tokens de `background`, `surface`, `accent`, `border`, `muted` y estados para mantener contraste en modo dark broadcast.

## [0.6.4] - 2026-04-18
- Se reforzo la visibilidad de la paleta en fondo y paneles para que el cambio de marca sea evidente.
- Se actualizaron `broadcast-panel` y `broadcast-panel-soft` con mezcla de azul corporativo, rojo acento y gris calido.

## [0.6.2] - 2026-04-18
- Se agregaron titulos por ruta para identificar ventanas/pestanas (`/`, `/screen`, `/operator`, `/play/[tableId]`).
- Se agrego componente reutilizable de logo corporativo para cabeceras compartidas.
- Se documento la carga de logo en `public/branding/company-logo.png`.

## [0.6.1] - 2026-04-11
- Se agrego preset rapido `Plantilla 2 mesas` en el gestor de mesas del operador.

## [0.6.0] - 2026-04-11
- Se agrego alta y baja de mesas (activas/inactivas) desde `/operator`.
- Se agrego edicion de nombre de mesa desde `/operator`.
- Se filtro ranking, grilla publica, QR y respuestas para usar solo mesas activas.
- Se bloqueo el cambio de roster/nombres fuera de `idle` o `game_finished`.
- Se agrego panel de version/contexto en admin alimentado por archivos `.md`.

## [0.5.0] - 2026-04-09
- Se agrego acceso por QR unico por mesa con URL de participacion.
- Se agrego auto-acceso por query `?code=` en `/play/[tableId]`.
- Se centralizo generacion de links/codigos por mesa.

## [0.4.0] - 2026-04-09
- Se agrego autenticacion minima para operador y mesas por cookie `httpOnly`.
- Se agrego modo `server` para comandos criticos.
- Se agrego control de concurrencia por `revision`.

## [0.3.0] - 2026-04-09
- Se preparo servicio de sincronizacion para Supabase.
- Se agregaron endpoints backend para estado y comandos.
- Se agrego capa de eventos del dominio.

## [0.2.0] - 2026-04-08
- Se completo MVP visual con `/screen`, `/operator`, `/play/[tableId]`.
- Se definio engine de juego con rondas, scoring y power-ups.

## [0.1.0] - 2026-04-08
- Base inicial con Next.js App Router, TypeScript y Tailwind.
