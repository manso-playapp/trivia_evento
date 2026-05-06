# Diagnóstico: Colisión de respuestas entre mesas — Trivia Evento

**Fecha:** 2026-05-05  
**Contexto:** T-VAL con 4 dispositivos reales conectados a Supabase Realtime  
**Síntomas observados:**

- Mesa 2: sus respuestas son sobreescritas por lo que selecciona Mesa 4.
- Mesa 4: tras enviar respuesta, queda sin respuesta seleccionada al instante.
- Mesas 1 y 3: sin problemas.
- Comodines: funcionando bien en todas las mesas.

---

## Pregunta 1: Generación del identificador de mesa

### Dónde y cómo se genera

Los IDs de mesa son **estáticos y determinísticos**, definidos en tiempo de build:

```typescript
// data/mock-tables.ts:24-33
export const mockTables: Table[] = Array.from({ length: 20 }, (_, index) => ({
  id: `table-${index + 1}`,
  ...
}));
```

Mesa 1 = `table-1`, Mesa 2 = `table-2`, Mesa 4 = `table-4`, etc. No hay UUID, token aleatorio ni hash. La entropía es **cero**: el ID es completamente predecible dado el índice.

El código de acceso de cada mesa también es determinístico:

```typescript
// lib/table-access.ts:17-22
export const getTableAccessCode = (tableId: string) => {
  const tableNumber = extractTableNumber(tableId);
  if (!tableNumber) return null;
  return String(1000 + tableNumber);  // Mesa 2 → "1002", Mesa 4 → "1004"
};
```

### Acumulación de IDs en la cookie — el mecanismo de colisión

La sesión de mesa se guarda en una cookie httpOnly `trivia_table_session`. Al autenticar, el servidor **agrega** el nuevo ID a los que ya existen en la cookie:

```typescript
// app/api/table/session/route.ts:51-52 (POST)
applyTableSessionCookie(response, tableId, getAuthenticatedTableIds(request));
```

Y la serialización **ordena** los IDs alfabéticamente:

```typescript
// lib/server/table-auth.ts:42-52
const serializeAuthenticatedTableIds = (tableIds: string[]) =>
  Array.from(new Set(tableIds)).sort().join(TABLE_SESSION_SEPARATOR);
```

Luego `getAuthenticatedTableId` retorna **solo el primero** de la lista:

```typescript
// lib/server/table-auth.ts:56
export const getAuthenticatedTableId = (request: NextRequest) =>
  getAuthenticatedTableIds(request)[0] ?? null;
```

**Consecuencia directa:** Si un dispositivo autentica Mesa 2 primero y Mesa 4 después (o viceversa en cualquier orden que coloque table-2 antes de table-4 al ordenar), la cookie queda `table-2,table-4`. Toda llamada a `getAuthenticatedTableId` retorna `"table-2"`, sin importar que la URL sea `/play/table-4`.

Dos mesas distintas **pueden y van a colisionar** si el mismo dispositivo/browser se autentica en ambas sin un DELETE previo.

### Problema adicional: la cookie se limpia en cada submit

Al completar un `submit_answer`, el servidor regenera la cookie usando **solo** `sessionTableId`, sin pasar `existingTableIds`:

```typescript
// app/api/game/command/route.ts:127-128
const response = NextResponse.json({ success: true });
applyTableSessionCookie(response, sessionTableId);  // sin existingTableIds → elimina table-4
```

Esto reduce la cookie a solo `table-2` después del primer submit, haciendo que cualquier verificación de sesión posterior para `table-4` devuelva `authenticated: false`.

---

## Pregunta 2: Esquema de submitted_answers y flujo de escritura

### Esquema completo

```sql
-- supabase/migrations/002_submitted_answers.sql:6-14
CREATE TABLE IF NOT EXISTS public.submitted_answers (
  game_id      text    NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  table_id     text    NOT NULL,
  question_id  text    NOT NULL,
  round_number integer NOT NULL,
  option_id    text    NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, table_id, round_number)
);
```

La **primary key compuesta es `(game_id, table_id, round_number)`**. Por diseño, una sola fila por mesa por ronda.

### El UPSERT y el tableId que realmente se usa

El upsert en el servidor:

```typescript
// lib/server/game-session-store.ts  (función upsertSubmittedAnswer)
await supabase.from("submitted_answers").upsert(
  { game_id, table_id: tableId, question_id, round_number, option_id, updated_at },
  { onConflict: "game_id,table_id,round_number" }
);
```

Y el `tableId` que se pasa proviene **de la cookie**, no del body del request:

```typescript
// app/api/game/command/route.ts:84, 119-125
const sessionTableId = getAuthenticatedTableId(request);
// ...
await upsertSubmittedAnswer({
  gameId: serverRuntimeConfig.supabaseGameId,
  tableId: sessionTableId,   // ← table-2 si la cookie colisionó
  questionId: question.id,
  roundNumber: getCurrentRoundNumber(currentState),
  optionId: command.optionId,
});
```

El servidor ignora el `command.tableId` del body (comentario en línea 81-83 del mismo archivo). Esto es intencional como medida de seguridad, pero convierte la colisión de cookie en una colisión de escritura en base de datos: **el UPSERT de Mesa 4 sobreescribe la fila de Mesa 2 en `submitted_answers`**.

---

## Pregunta 3: Suscripción a Supabase Realtime

### Configuración del canal

```typescript
// services/supabase-game-service.ts:292-301
answersRealtimeChannel = supabase
  .channel(`submitted-answers-${runtimeConfig.supabaseGameId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "submitted_answers",
      filter: `game_id=eq.${runtimeConfig.supabaseGameId}`,  // solo filtra por game_id
    },
    (payload) => {
      const row = payload.new as SubmittedAnswerRow | undefined;
      if (!row?.table_id) return;
      mergeIncomingAnswer(rowToSubmittedAnswer(row));
    }
  )
  .subscribe();
```

El filtro es **solo por `game_id`**. Cada cliente recibe **todos** los eventos de `submitted_answers` para el juego, sin distinción de mesa.

### Ausencia de validación antes de aplicar al estado

`mergeIncomingAnswer` aplica el evento directamente sin verificar si corresponde a la mesa propia:

```typescript
// services/supabase-game-service.ts:151-165
function mergeIncomingAnswer(answer: SubmittedAnswer) {
  const existing = cachedState.submittedAnswers.findIndex(
    (a) => a.tableId === answer.tableId && a.roundNumber === answer.roundNumber
  );

  const nextAnswers =
    existing === -1
      ? [...cachedState.submittedAnswers, answer]
      : cachedState.submittedAnswers.map((a, i) =>
          i === existing ? answer : a
        );

  cachedState = { ...cachedState, submittedAnswers: nextAnswers };
  writeStoredGameState(cachedState);   // escribe al localStorage compartido
  notifyListeners();                   // fuerza re-render en todos los listeners
}
```

Consecuencia: cuando el UPSERT de Mesa 4 (atribuido a `table-2` por la cookie) dispara el Realtime, todos los clientes actualizan su entrada de `table-2` con la opción seleccionada por el operador de Mesa 4. La pantalla de Mesa 2 muestra la selección de Mesa 4.

---

## Pregunta 4: Estado compartido entre mesas

### localStorage — clave sin namespace por mesa

```typescript
// lib/game-storage.ts:6
export const GAME_STORAGE_KEY = "trivia-evento-game-state";

// lib/game-storage.ts:34-41
export const writeStoredGameState = (state: GameState) => {
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(GAME_STORAGE_EVENT));
};
```

La clave `"trivia-evento-game-state"` es única para toda la aplicación. Si dos pestañas del mismo navegador acceden a mesas distintas, **comparten el mismo slot de localStorage**. Cualquier escritura en una pestaña dispara el evento `storage` en la otra:

```typescript
// lib/game-storage.ts:58-62
const handleStorage = (event: StorageEvent) => {
  if (!event.key || event.key === GAME_STORAGE_KEY) {
    listener();  // re-sincroniza la pestaña con lo que escribió la otra
  }
};
```

### Singleton del servicio — estado global por pestaña JS

```typescript
// services/supabase-game-service.ts:74-78
const listeners = new Set<GameServiceListener>();
let realtimeChannel: RealtimeChannel | null = null;
let answersRealtimeChannel: RealtimeChannel | null = null;
let initialized = false;
let cachedState: GameState = createConfiguredInitialState();
```

Variables a nivel de módulo: un único `cachedState`, un único canal Realtime, un único set de listeners. En distintos dispositivos (procesos de browser separados) estos singletons están aislados, pero en múltiples pestañas del mismo browser **se comparten completamente** (misma instancia JS).

### GameProvider — un único contexto de React

```typescript
// components/game-provider.tsx:49-66
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialGameState);
  useEffect(() => {
    gameService.initialize();
    const syncState = () => { setState(gameService.readState()); };
    syncState();
    return gameService.subscribe(syncState);
  }, []);
  ...
}
```

Hay un solo `GameProvider` envolviendo la aplicación. Cualquier actualización de `cachedState` (por Realtime o por optimistic update) notifica a todos los componentes dentro de este provider.

### Parámetros de URL

El `tableId` de la URL es la única fuente de identidad del lado del cliente:

```typescript
// app/play/[tableId]/page.tsx (implícito por la ruta)
// components/views/play-view.tsx:35
const table = state.tables.find((entry) => entry.id === tableId);
```

No hay token de sesión por pestaña ni identificador opaco que aísle instancias. Si dos pestañas usan el mismo `tableId` en la URL, son indistinguibles para el estado de la aplicación.

---

## Hipótesis de causa raíz

### 1. Colisión por acumulación de IDs en la cookie (probabilidad: ALTA — causa directa)

**Mecanismo:** El dispositivo que operó Mesa 4 autenticó Mesa 2 primero (durante el setup o una prueba previa sin cerrar sesión). La cookie quedó `table-2,table-4` tras el login de Mesa 4. Al ordenarse alfabéticamente, `table-2` queda primero. `getAuthenticatedTableId` retorna siempre el primero → todos los submits de Mesa 4 se registran en la DB como `table-2`.

**Explica Mesa 2:** El UPSERT por `(game_id, "table-2", round_number)` sobreescribe la respuesta real de Mesa 2 con la selección de Mesa 4. Supabase Realtime lo propaga a todos los clientes. La pantalla de Mesa 2 muestra lo que eligió Mesa 4.

**Explica Mesa 4:** La actualización optimista (`cachedState`) pone la entrada bajo `table-4`. Pero en la base de datos se escribió `table-2`. El Realtime trae el evento para `table-2`, no para `table-4`. La entrada optimista de `table-4` queda huérfana. Además, el cookie del submit response (línea 128 de `command/route.ts`) se reduce a solo `table-2`, eliminando `table-4`. Si cualquier verificación de sesión o una llamada a `pullRemoteState()` se dispara posteriormente (por error de red, re-mount, etc.), el estado se reemplaza con los datos reales de la DB, que no tienen fila para `table-4` → la selección desaparece.

**Archivos clave:**
- `lib/server/table-auth.ts:42-56` — acumulación y orden de IDs en cookie
- `app/api/game/command/route.ts:84, 128` — uso de cookie y limpieza de IDs extras
- `lib/server/game-session-store.ts` (función `upsertSubmittedAnswer`) — escritura con el tableId incorrecto

---

### 2. Canal Realtime sin filtro por mesa (probabilidad: ALTA — amplificador)

**Mecanismo:** El filtro del canal es `game_id=eq.${gameId}` sin `table_id`. Cada cliente recibe eventos de todas las mesas. `mergeIncomingAnswer` los aplica sin validar pertenencia.

**Efecto:** Aunque no es la causa de que Mesa 4 escriba en la slot de Mesa 2, sí garantiza que cualquier corrupción de escritura (como la de hipótesis 1) se propaga inmediatamente a todos los clientes. También contamina el `cachedState` de cada cliente con respuestas de mesas ajenas, aumentando el tamaño del estado y la frecuencia de re-renders innecesarios.

**Archivo clave:** `services/supabase-game-service.ts:293-310`

---

### 3. localStorage sin namespace por mesa (probabilidad: MEDIA — causa directa solo en same-browser)

**Mecanismo:** La clave `"trivia-evento-game-state"` es compartida por todos los tabs del mismo browser. Un evento `storage` de una pestaña re-sincroniza inmediatamente a otra.

**Aplica si:** El T-VAL fue parcialmente ejecutado con dos mesas en el mismo browser (distintas pestañas del mismo dispositivo). En ese caso, cada escritura de una mesa sobrescribe el estado de la otra de forma recíproca. Con 4 dispositivos físicos separados, este mecanismo no aplica entre devices pero sí aplica si algún device usó dos pestañas.

**Archivo clave:** `lib/game-storage.ts:6, 34-41, 58-62`

---

### 4. Singleton de estado en cliente (probabilidad: BAJA como causa directa)

**Mecanismo:** `cachedState`, canales y listeners son variables de módulo (singleton por proceso JS). En un browser normal, cada pestaña tiene su propio proceso JS, así que el singleton está aislado entre pestañas distintas. El riesgo es real solo en SSR/Node.js si múltiples requests comparten el módulo, o en pruebas con Jest donde el módulo es compartido entre tests.

**Archivo clave:** `services/supabase-game-service.ts:74-78`

---

## Resumen de archivos relevantes

| Archivo | Líneas | Rol en el bug |
|---|---|---|
| `lib/server/table-auth.ts` | 42-56 | Acumula IDs en cookie, retorna solo el primero (sorted) |
| `app/api/game/command/route.ts` | 84, 119-128 | Usa el tableId de cookie, limpia IDs extras al responder |
| `supabase/migrations/002_submitted_answers.sql` | 6-14 | PK `(game_id, table_id, round_number)` — UPSERT sobreescribe por mesa |
| `services/supabase-game-service.ts` | 293-310 | Filtro Realtime solo por game_id, sin table_id |
| `services/supabase-game-service.ts` | 151-165 | `mergeIncomingAnswer` sin validación de mesa propia |
| `services/supabase-game-service.ts` | 74-78 | Variables globales de módulo (singleton) |
| `lib/game-storage.ts` | 6, 34-41 | Key de localStorage sin namespace por mesa |
| `data/mock-tables.ts` | 24-33 | IDs estáticos `table-N`, entropía cero |
