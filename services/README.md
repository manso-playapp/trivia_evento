# services/

Esta capa separa UI de ejecucion del dominio.

- `game-service.ts`: contrato que una futura implementacion realtime debe cumplir
- `create-game-service.ts`: punto unico donde se elige la implementacion activa
- `mock-game-service.ts`: implementacion local con `localStorage`
- `supabase-game-service.ts`: implementacion base realtime con snapshot + eventos

## Futuro realtime

Una version con Supabase o Firebase deberia reemplazar solo la implementacion:

- `initialize()`: abrir conexion o cargar snapshot inicial
- `readState()`: leer estado cacheado/sincronizado
- `subscribe()`: escuchar cambios remotos
- acciones (`revealQuestion`, `submitAnswer`, etc.): enviar comando al backend

La UI y los componentes no deberian cambiar.

## Recomendacion de integracion

1. Mantener `engine/` como fuente de verdad de reglas.
2. En esta etapa, Supabase escribe desde cliente solo para desarrollo.
3. En produccion, ejecutar esas reglas del lado servidor.
4. Publicar snapshots y/o eventos por realtime.
5. Cambiar `create-game-service.ts` para usar Supabase o Firebase.

## Modos de escritura con Supabase

- `direct`: el cliente escribe directo a Supabase. Sirve para MVP y pruebas.
- `server`: el cliente manda comandos a `app/api/game/command/route.ts` y el servidor persiste.

La UI no cambia entre modos. Solo cambia `NEXT_PUBLIC_GAME_WRITE_MODE`.
