# engine/

Dominio puro del juego.

- `game-domain.ts`: transiciones de estado puras
- `game-selectors.ts`: lecturas derivadas

## Nota realtime

Cuando exista backend real, estas reglas deberian ejecutarse del lado servidor o en una capa validada para evitar estados inconsistentes entre clientes.
