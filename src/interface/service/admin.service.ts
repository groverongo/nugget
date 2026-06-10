export interface ResumenActualizacion {
	totalApostadores: number;
	totalAcertadores: number;
	extraPartidazo: boolean;
	puntosBatacazo: number;
	puntosElegido: number;
}

export interface IAdminService {
	actualizarPartido(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
		milagro: boolean;
	}): Promise<ResumenActualizacion>;

	actualizarPartidoMedioTiempo(args: {
		partidoId: number;
		golesLocal: number;
		golesVisitante: number;
	}): Promise<void>;
}
