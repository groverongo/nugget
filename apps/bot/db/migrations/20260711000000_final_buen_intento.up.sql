-- UP MIGRATION: 20260711000000_final_buen_intento

UPDATE estatico_fases SET puntos_buen_intento = 2 WHERE nombre = 'final';
