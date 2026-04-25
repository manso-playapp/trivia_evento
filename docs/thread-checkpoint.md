# Thread Checkpoint

## Goal

- Ajustar el flujo de la trivia para una noche en vivo con menos friccion operativa.
- Mejorar feedback visual de mesas.
- Medir ritmo real de partida con una simulacion de 20 mesas.

## Current Decisions

- `Lanzar siguiente pregunta` ahora tambien inicia la ronda y el timer.
- El timer de ronda ya no sale de `question.timeLimitSeconds`; usa `state.roundDurationSeconds`.
- El operador puede cambiar `roundDurationSeconds` entre rondas desde el panel.
- El header del operador muestra el timer configurado.
- El feedback de mesas prioriza:
  - glow breve verde al responder durante ronda
  - verde + confetti para correctas
  - destaque extra para ganadoras de la ronda
  - rojo para incorrecta / sin respuesta / congelada
- La sesion de mesa ahora soporta multiples mesas en el mismo navegador con una sola cookie serializada.
- El usuario paso un nuevo set manual definitivo de `23` preguntas.
- Ese set nuevo todavia NO fue aplicado al repo porque el turno se interrumpio antes del parche.

## Files Touched

- [engine/game-domain.ts](/Users/javiermanso/Desktop/trivia-evento/engine/game-domain.ts:1)
- [engine/game-command-runner.ts](/Users/javiermanso/Desktop/trivia-evento/engine/game-command-runner.ts:1)
- [types/game-command.ts](/Users/javiermanso/Desktop/trivia-evento/types/game-command.ts:1)
- [types/game-event.ts](/Users/javiermanso/Desktop/trivia-evento/types/game-event.ts:1)
- [lib/game-command-validator.ts](/Users/javiermanso/Desktop/trivia-evento/lib/game-command-validator.ts:1)
- [services/game-service.ts](/Users/javiermanso/Desktop/trivia-evento/services/game-service.ts:1)
- [services/mock-game-service.ts](/Users/javiermanso/Desktop/trivia-evento/services/mock-game-service.ts:1)
- [services/supabase-game-service.ts](/Users/javiermanso/Desktop/trivia-evento/services/supabase-game-service.ts:1)
- [components/operator-controls.tsx](/Users/javiermanso/Desktop/trivia-evento/components/operator-controls.tsx:1)
- [components/views/operator-view.tsx](/Users/javiermanso/Desktop/trivia-evento/components/views/operator-view.tsx:1)
- [components/event-header.tsx](/Users/javiermanso/Desktop/trivia-evento/components/event-header.tsx:1)
- [components/table-card.tsx](/Users/javiermanso/Desktop/trivia-evento/components/table-card.tsx:1)
- [components/table-grid.tsx](/Users/javiermanso/Desktop/trivia-evento/components/table-grid.tsx:1)
- [components/question-card.tsx](/Users/javiermanso/Desktop/trivia-evento/components/question-card.tsx:1)
- [components/views/play-view.tsx](/Users/javiermanso/Desktop/trivia-evento/components/views/play-view.tsx:1)
- [components/views/screen-view.tsx](/Users/javiermanso/Desktop/trivia-evento/components/views/screen-view.tsx:1)
- [components/typewriter-text.tsx](/Users/javiermanso/Desktop/trivia-evento/components/typewriter-text.tsx:1)
- [app/api/table/session/route.ts](/Users/javiermanso/Desktop/trivia-evento/app/api/table/session/route.ts:1)
- [lib/server/table-auth.ts](/Users/javiermanso/Desktop/trivia-evento/lib/server/table-auth.ts:1)
- [hooks/use-table-session.ts](/Users/javiermanso/Desktop/trivia-evento/hooks/use-table-session.ts:1)
- [data/mock-questions.ts](/Users/javiermanso/Desktop/trivia-evento/data/mock-questions.ts:1)
- [scripts/e2e-20-tables.mjs](/Users/javiermanso/Desktop/trivia-evento/scripts/e2e-20-tables.mjs:1)

## Open Risks

- No hubo verificacion visual automatizada real del browser en este entorno:
  - no hay `agent-browser`
  - no hay Playwright instalado
  - el sandbox no ve el puerto del dev server escalado
- La simulacion E2E de 20 mesas esta lista pero no se ejecuto porque se rechazo la elevacion para pegarle al server local.
- El script `scripts/e2e-20-tables.mjs` quedo configurado por defecto para correr con `10s` por ronda y esperar el vencimiento real antes de cerrar respuestas.
- El estado `question_revealed` sigue existiendo por compatibilidad aunque ya no deberia quedar visible en flujo normal.
- `data/mock-questions.ts` sigue con un set anterior de `20` preguntas.
- El ultimo set del usuario trae una ambiguedad potencial:
  - la pregunta 19 repite `Real Madrid` en C y D, con D marcada como correcta en el mensaje del usuario

## Last Verified Status

- `npm run lint` paso en los ultimos cambios.
- El script de simulacion `scripts/e2e-20-tables.mjs` compila con `node --check`.
- La extraccion del PDF final de preguntas ya fue incorporada al dataset.
- Despues de eso, el usuario reemplazo ese dataset por un listado manual de `23` preguntas, pendiente de carga.

## Resume Notes

- Si el usuario retoma la medicion de ritmo:
  - correr `node scripts/e2e-20-tables.mjs` contra el server local con elevacion
  - defaults actuales:
    - `--round-duration-seconds=10`
    - `--answer-delay-ms=80`
    - `--between-rounds-ms=250`
  - opcional: ajustar `--round-duration-seconds`, `--answer-delay-ms` y `--between-rounds-ms`
  - mirar `/screen` abierto en paralelo para validacion visual
- Si el usuario sigue iterando UI:
  - empezar por `components/table-card.tsx`, `components/table-grid.tsx`, `components/operator-controls.tsx`
- Si el usuario retoma preguntas:
  - actualizar [data/mock-questions.ts](/Users/javiermanso/Desktop/trivia-evento/data/mock-questions.ts:1) con las `23` preguntas del ultimo mensaje
  - actualizar [README.md](/Users/javiermanso/Desktop/trivia-evento/README.md:26) y [data/README.md](/Users/javiermanso/Desktop/trivia-evento/data/README.md:5) a `23 preguntas`
  - decidir si la pregunta 19 queda tal cual o si el usuario quiere corregir la opcion repetida
