export interface ResumenActualizacion {
	totalApostadores: number;
	totalAcertadores: number;
	extraPartidazo: boolean;
	puntosBatacazo: number;
	puntosElegido: number;
	supleCreado: { supleId: number } | null;
}

export interface BonusGanador {
	id: string;
	username: string;
}

export interface BonusResult {
	winRate: {
		ganadores: BonusGanador[];
		valor: number;
		puntos: number;
	};
	rachaMaxima: {
		ganadores: BonusGanador[];
		valor: number;
		puntos: number;
	};
	hitMasGoles: {
		ganadores: BonusGanador[];
		totalGoles: number;
		partidos: string[];
		puntos: number;
	};
}

export interface IAdminService {
	actualizarPartido(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
		milagro: number;
		penalesGanadorId?: number | null;
	}): Promise<ResumenActualizacion>;

	actualizarPartidoMedioTiempo(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
	}): Promise<void>;

	asignarBonuses(): Promise<BonusResult>;

	ajustarPuntos(usuarioId: string, delta: number): Promise<void>;
}
