-- DOWN MIGRATION: 20260715000000_mejor_gol_cerrado

ALTER TABLE awards_resultados
    DROP COLUMN mejor_gol_cerrado_en;
