-- UP MIGRATION: 20260715000000_mejor_gol_cerrado

-- Permite cerrar explicitamente el award de Mejor Gol aunque queden picks de
-- usuarios sin resolver (jugadores que nadie confirmo como nominados). Sin
-- este flag, "resuelto" dependia de que TODO pick tuviera una resolucion, lo
-- que se bloqueaba para siempre si algun usuario eligio un jugador que en
-- realidad nunca fue nominado.

ALTER TABLE awards_resultados
    ADD COLUMN mejor_gol_cerrado_en TIMESTAMP;
