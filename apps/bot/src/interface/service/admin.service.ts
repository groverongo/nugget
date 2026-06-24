export interface ResumenActualizacion {
	totalApostadores: number;
	totalAcertadores: number;
	extraPartidazo: boolean;
	puntosBatacazo: number;
	puntosElegido: number;
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
		partido: string;
		puntos: number;
	};
}

export interface IAdminService {
	actualizarPartido(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
		milagro: number;
	}): Promise<ResumenActualizacion>;

	actualizarPartidoMedioTiempo(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
	}): Promise<void>;

	asignarBonuses(): Promise<BonusResult>;
}
