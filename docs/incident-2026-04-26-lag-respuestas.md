# Incidente 2026-04-26 — Lag de respuestas en celulares (20 mesas)

## Resumen ejecutivo

El lag que sufrieron los participantes al responder tiene una causa raíz confirmada y
una causa secundaria que la amplifica. Ambas provienen de cómo el sistema escribe el
estado del juego en modo `server`. No hay bugs en el WiFi ni en Supabase Realtime: el
problema es arquitectural y tiene solución directa.

---

## Contexto del evento

- Mesas activas: 20
- Modo de escritura activo (`.env.local`): `NEXT_PUBLIC_GAME_WRITE_MODE=server`
- Modo de sincronización: `NEXT_PUBLIC_GAME_SYNC_PROVIDER=supabase`
- Síntoma reportado: al apretar el botón de respuesta no se marcaba como seleccionado.
  Los participantes tenían que insistir varias veces durante el tiempo activo.

---

## Flujo real de una respuesta en modo `server`

```
[Usuario toca botón A]
        ↓
actions.submitAnswer(tableId, optionId)     ← game-provider.tsx:134
        ↓
gameService.submitAnswer()                  ← supabase-game-service.ts:378
        ↓
if (shouldUseServerWrites) {
  void commitServerCommand(...)             ← no optimistic update, retorna
  return                                    ← la UI NO cambia todavía
}
        ↓
fetch POST /api/game/command                ← red WiFi (saturada en evento)
        ↓
[Vercel] readOrSeedServerGameState()       ← SELECT game_sessions (DB)
         executeGameCommand()               ← puro, rápido
         persistServerGameTransition()      ← UPDATE + INSERT (DB)
        ↓
response.json() → body.state
        ↓
setCachedState(body.state)                  ← recién acá React re-renderiza
        ↓
[Botón aparece seleccionado]
```

**El botón no se ve seleccionado hasta que vuelve la respuesta HTTP completa.**
En WiFi de evento saturado eso puede tardar 1–3 segundos. El usuario cree que no
registró y vuelve a tocar.

---

## Causa raíz 1 — Sin optimistic update en modo server (CRÍTICA)

**Archivo:** `services/supabase-game-service.ts:378-387`

```ts
submitAnswer(tableId, optionId, actorId = tableId) {
  if (shouldUseServerWrites) {
    void commitServerCommand({ command: { type: "submit_answer", ... } })
    return   // ← RETORNA SIN TOCAR EL ESTADO LOCAL
  }
  ...
}
```

A diferencia del modo `direct`, en modo `server` no se llama a `setCachedState`
localmente antes del round-trip. El `selectedOptionId` que muestra `MobileAnswerPad`
viene de `answer?.optionId` (`play-view.tsx:98`), que a su vez viene del estado React,
que solo se actualiza después de recibir la respuesta del servidor.

**Impacto:** feedback visual diferido por la latencia completa de la red.

---

## Causa raíz 2 — Cascada de conflictos de revisión con 20 clientes concurrentes (CRÍTICA)

**Archivo:** `lib/server/game-session-store.ts:96-128`

El estado del juego es un snapshot único con un campo `revision`. Cada escritura hace:

```sql
UPDATE game_sessions
SET revision = N+1, state = ...
WHERE id = gameId AND revision = N   ← solo acepta si nadie escribió antes
```

Cuando el operador inicia una ronda, las 20 mesas ven `revision = N` y disparan su
POST casi simultáneamente:

```
Mesa 1  → POST con expectedRevision=10  → GANA → revision = 11
Mesa 2  → POST con expectedRevision=10  → 409 CONFLICT (revision=11 ≠ 10)
Mesa 3  → POST con expectedRevision=10  → 409 CONFLICT
...
Mesa 20 → POST con expectedRevision=10  → 409 CONFLICT
```

El handler en `commitServerCommand` reintenta hasta 3 veces por cliente
(`services/supabase-game-service.ts:254`):

```ts
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  // ...
  if (body.conflict || response.status === 409) {
    if (!body.state) await pullRemoteState();
    if (attempt < maxAttempts) continue;   ← reintenta
    return;                                 ← silently da up después de 3 intentos
  }
}
```

Con 20 mesas concurrentes, la cascada en el peor caso es:

| Ola | Mesas que compiten | 1 gana | N-1 reintentan |
|-----|-------------------|--------|----------------|
| 1   | 20                | 1      | 19             |
| 2   | 19                | 1      | 18             |
| 3   | 18                | 1      | 17             |
| ... | ...               | ...    | ...            |

Con el límite de 3 reintentos, **las mesas que caen en la ola 4+ nunca registran su
respuesta**. El sistema silencia el error (`.catch`) y el participante cree que tocó mal.

Esto explica exactamente el síntoma: "tenían que insistir varias veces" — cada insistencia
disparaba un nuevo ciclo de reintentos que eventualmente encontraba una ventana libre.

---

## Causa secundaria — submitAnswer permite cambiar la respuesta (AMPLIFICADOR)

**Archivo:** `engine/game-domain.ts:355-376`

```ts
const existingAnswerIndex = state.submittedAnswers.findIndex(
  (answer) =>
    answer.tableId === tableId &&
    answer.questionId === question.id &&
    answer.roundNumber === roundNumber
);

const submittedAnswers =
  existingAnswerIndex === -1
    ? [...state.submittedAnswers, nextAnswer]
    : state.submittedAnswers.map((answer, index) =>
        index === existingAnswerIndex ? nextAnswer : answer  ← SOBREESCRIBE
      );
```

El dominio **permite cambiar la respuesta** si ya existe una para esa mesa/ronda.
Esto significa que si el usuario toca A, no ve feedback, toca B por desesperación, y
ambas requests llegan: el orden en que procesan determina la respuesta final. Si B llega
después, la respuesta registrada es B aunque el usuario quisiera A.

---

## Hipótesis descartadas

- **Debounce / rate limit que descarte clicks:** no existe ninguno en el código. No es la causa.
- **Estado visual desde Realtime (no local):** en modo server, el estado viene de la
  response del POST, no del canal Realtime. El canal Realtime existe pero solo actualiza
  si la revision del snapshot remoto es mayor a la local (`supabase-game-service.ts:162`).
- **Saturación del canal Realtime:** todas las mesas comparten un canal
  (`game-session-{gameId}`), pero cada una abre su propia conexión WebSocket. Supabase
  puede manejar esto sin problema a 20 clientes. No es la causa.
- **Cold start de Vercel:** agrega 200-500ms en la primera llamada de cada función, pero
  no explica el lag sistemático en todas las rondas.

---

## Plan de fix propuesto (en orden de impacto)

### Fix 1 — Optimistic update antes del POST (soluciona causa raíz 1)

**Prioridad: alta. Estimado: 30-60 min.**

En `commitServerCommand`, antes de hacer el `fetch`, aplicar el reducer localmente y
llamar a `setCachedState`. Si el servidor rechaza (409 o error), revertir con
`pullRemoteState()`.

Esto da feedback visual instantáneo al usuario independientemente de la latencia de red.
El caso de error (respuesta rechazada) se resuelve silenciosamente sincronizando con el
estado real del servidor.

Archivos a tocar: `services/supabase-game-service.ts` (función `commitServerCommand`)
y los reducers que necesiten estar disponibles en ese contexto (ya lo están, se importan
de `engine/game-domain.ts`).

### Fix 2 — Escritura por campo, no por snapshot (soluciona causa raíz 2)

**Prioridad: alta. Estimado: 2-4 horas.**

Sacar `submitted_answers` del snapshot y convertirla en una tabla separada en Supabase:

```sql
CREATE TABLE submitted_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  table_id text NOT NULL,
  question_id text NOT NULL,
  round_number int NOT NULL,
  option_id text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (game_id, table_id, round_number)  -- upsert atómico por mesa/ronda
);
```

Con un `INSERT ... ON CONFLICT (game_id, table_id, round_number) DO UPDATE SET ...`,
cada mesa escribe su respuesta sin competir con las demás. No hay cascada de revisiones.
El snapshot de `game_sessions` solo cambia cuando el operador avanza el juego.

Requiere: nueva migración SQL, ajuste de `submitAnswer` en el server route para usar
`supabase.from("submitted_answers").upsert(...)` en lugar de actualizar el snapshot, y
ajuste de los selectores del cliente para leer respuestas desde la tabla separada o
desde el snapshot enriquecido en `readState`.

Esta es la solución definitiva para el problema de concurrencia a escala.

### Fix 3 — Disable del botón durante submit en vuelo (reduce amplificador)

**Prioridad: media. Estimado: 20 min.**

Agregar estado local `isSubmitting` en `PlayView`. Mientras hay un POST en vuelo,
deshabilitar los botones de respuesta. Esto previene el doble-tap y elimina la fuente
de confusion de "toqué pero no cambió".

Se puede implementar antes del Fix 1 como parche inmediato, aunque el Fix 1 lo hace
menos necesario (si hay feedback visual instantáneo, el usuario no vuelve a tocar).

---

## Orden de implementación recomendado

1. **Fix 1** (optimistic update): máximo impacto, mínimo riesgo. Hace el sistema
   responsive aunque el WiFi esté lento. Implementable en una sesión corta.
2. **Fix 3** (disable durante submit): complementa Fix 1, elimina el doble-tap por
   usuario impaciente. Simple.
3. **Fix 2** (tabla separada de answers): solución estructural para escalar a más mesas
   o eventos simultáneos. Requiere migración y es más invasivo. Hacer después de que
   Fix 1 y 3 estén deployed y validados.

---

## Notas para el siguiente evento

Antes del próximo evento, con Fix 1 y Fix 3 implementados, el sistema debería manejar
20 mesas sin lag visible. Fix 2 es necesario si escala a más de 30-40 mesas simultáneas
o si se corren varios eventos en paralelo.

El modo `direct` no tiene estos problemas de latencia percibida (hay optimistic update),
pero tiene el riesgo inverso: dos mesas que escriben simultáneamente pueden sobreescribir
sus respuestas. El modo `server` + Fix 1 es el camino correcto.
