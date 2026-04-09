# Supabase

Archivos base para conectar la app a Supabase sin cambiar la UI.

## Flujo recomendado

1. Crear `.env.local` a partir de `.env.example`
2. Poner `NEXT_PUBLIC_GAME_SYNC_PROVIDER=supabase`
3. Elegir write mode:
   - `NEXT_PUBLIC_GAME_WRITE_MODE=direct` para MVP rapido
   - `NEXT_PUBLIC_GAME_WRITE_MODE=server` para backend writes
4. Elegir automatizacion:
   - `NEXT_PUBLIC_GAME_AUTOMATION_MODE=client` para depender de una pestaña activa
   - `NEXT_PUBLIC_GAME_AUTOMATION_MODE=hybrid` para fallback mixto
   - `NEXT_PUBLIC_GAME_AUTOMATION_MODE=scheduler` para delegar a un scheduler HTTP
5. Si usas `server`, agregar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
6. Si usas scheduler, agregar `CRON_SECRET`
7. Ejecutar el SQL de `supabase/schema.sql` en el SQL Editor
8. En `scheduler`, llamar `GET /api/cron/game-tick` con `Authorization: Bearer <CRON_SECRET>`

## Alcance de esta etapa

- Hay sincronizacion realtime por snapshot de juego
- No hay auth ni RLS endurecida para produccion
- El timer, reveal y scoring ya pueden automatizarse desde backend
- En modo `server`, las acciones criticas ya viajan por Route Handlers de Next
- La UI puede dejar de hacer polling si un scheduler externo mantiene vivo el tick

## Nota practica

Para un juego en vivo con rondas de 30 segundos, conviene usar `hybrid` o un
scheduler externo de baja latencia. Un cron tradicional por minuto sirve como
soporte operativo, no como reloj principal de gameplay.

## Produccion mas adelante

- mover reglas criticas a servidor
- agregar auth para operador/mesas
- endurecer RLS
- reemplazar writes directas por RPC o Edge Functions
