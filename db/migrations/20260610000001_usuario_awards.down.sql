-- DOWN MIGRATION: 20260610000001_usuario_awards

ALTER TABLE usuarios
    DROP COLUMN IF EXISTS award_campeon,
    DROP COLUMN IF EXISTS award_goleador,
    DROP COLUMN IF EXISTS award_mejor_jugador,
    DROP COLUMN IF EXISTS award_mejor_arquero,
    DROP COLUMN IF EXISTS award_mejor_jugador_joven,
    DROP COLUMN IF EXISTS award_mejor_gol,
    DROP COLUMN IF EXISTS award_seleccion_decepcion,
    DROP COLUMN IF EXISTS award_seleccion_sorpresa;
