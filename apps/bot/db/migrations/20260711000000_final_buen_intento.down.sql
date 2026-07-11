-- DOWN MIGRATION: 20260711000000_final_buen_intento

UPDATE estatico_fases SET puntos_buen_intento = 3 WHERE nombre = 'final';
