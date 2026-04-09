# Trivia Evento MVP

MVP inicial para una trivia corporativa en vivo con tres vistas:

- `/screen`
- `/operator`
- `/play/[tableId]`

## Correr el proyecto

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Como funciona este MVP

- Usa mocks locales para 20 mesas y 14 preguntas.
- El estado del juego vive en `localStorage`.
- Si abrís varias pestañas, `screen`, `operator` y `play` se sincronizan localmente.

## Activar Supabase

1. Crear `.env.local` a partir de `.env.example`
2. Completar:

```bash
NEXT_PUBLIC_GAME_SYNC_PROVIDER=supabase
NEXT_PUBLIC_GAME_WRITE_MODE=direct
NEXT_PUBLIC_GAME_AUTOMATION_MODE=hybrid
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_GAME_ID=trivia-evento-mvp
NEXT_PUBLIC_APP_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TRIVIA_OPERATOR_API_TOKEN=...
```

3. Ejecutar `supabase/schema.sql` en el SQL Editor del proyecto
4. Levantar la app con `npm run dev`

Mientras no actives esa variable, la app sigue usando mocks locales.
Si queres mover writes criticas a backend, cambia `NEXT_PUBLIC_GAME_WRITE_MODE=server`.
En ese modo, `/operator` requiere iniciar sesion con el token configurado en `TRIVIA_OPERATOR_API_TOKEN`.
Las mesas tambien validan un codigo simple por equipo:

- Mesa 1 => `1001`
- Mesa 2 => `1002`
- ...
- Mesa 20 => `1020`

El operador ahora tambien tiene una grilla de QR unicos por mesa. Cada QR
apunta a `/play/[tableId]` y lleva el codigo de acceso en la URL para abrir la
participacion con menos friccion en evento.

En modo `server`, la automatizacion del juego puede correr de tres formas:

- `NEXT_PUBLIC_GAME_AUTOMATION_MODE=client`: una pestaña cliente hace polling de `/api/game/tick`
- `NEXT_PUBLIC_GAME_AUTOMATION_MODE=hybrid`: fallback mixto, sigue usando polling y queda lista para scheduler
- `NEXT_PUBLIC_GAME_AUTOMATION_MODE=scheduler`: la UI deja de hacer polling y espera un scheduler real

La ruta de scheduler preparada es `GET /api/cron/game-tick` y espera
`Authorization: Bearer <CRON_SECRET>`.

Tambien podes configurar delays del backend para el flujo automatico:

- `TRIVIA_REVEAL_DELAY_MS`
- `TRIVIA_SCORE_DELAY_MS`
- `CRON_SECRET`

## Scheduler real

La app ya tiene una ruta interna protegida para automatismos de servidor:

- `GET /api/cron/game-tick`

Sirve para Vercel Cron o cualquier scheduler HTTP externo. Para live gameplay,
no conviene depender de Vercel Cron si necesitas precision de segundos: esta
base soporta ese camino, pero para rondas de 30 segundos es mejor usar un
worker o scheduler externo con mayor frecuencia.

## Estructura base

- `app/`: rutas App Router
- `components/`: UI y vistas del producto
- `data/`: preguntas, mesas y estado inicial mock
- `engine/`: reglas puras del dominio
- `hooks/`: hooks de lectura para las vistas
- `lib/`: motor del juego, storage y helpers
- `services/`: acciones, selector de servicio y capa reemplazable para sincronizacion
- `supabase/`: SQL y notas de integracion realtime
- `styles/`: espacio reservado para estilos compartidos futuros
- `types/`: tipos del dominio

## Proxima etapa realtime

1. Mover el Route Handler actual a RPC o Edge Functions con transaccion real.
2. Validar `revision` del snapshot para evitar carreras.
3. Mantener `engine/` como reglas de dominio validadas por servidor.
4. Incorporar autenticacion para operador y mesas.
5. Reemplazar polling por scheduler/worker de baja latencia.
