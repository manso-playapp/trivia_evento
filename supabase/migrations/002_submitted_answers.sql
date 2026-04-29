-- Tabla de respuestas separada del snapshot del juego.
-- Permite escrituras concurrentes por mesa sin conflictos de revision:
-- cada fila es unica por (game_id, table_id, round_number), el upsert
-- es atomico y no depende del campo revision de game_sessions.

CREATE TABLE IF NOT EXISTS public.submitted_answers (
  game_id      text    NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  table_id     text    NOT NULL,
  question_id  text    NOT NULL,
  round_number integer NOT NULL,
  option_id    text    NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (game_id, table_id, round_number)
);

ALTER TABLE public.submitted_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_submitted_answers" ON public.submitted_answers;
CREATE POLICY "anon_read_submitted_answers"
  ON public.submitted_answers
  FOR SELECT
  TO anon
  USING (true);

-- Las escrituras solo pasan por el backend con service_role.
-- El rol anon no puede INSERT ni UPDATE en esta tabla.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'submitted_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submitted_answers;
  END IF;
END $$;
