-- DOWN MIGRATION: 20260714000000_mejor_gol_nominado

ALTER TABLE awards_mejor_gol_resueltos
    ALTER COLUMN posicion SET NOT NULL;
