import type {
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasMedioTiempoPorPartidoRow,
	VerTimbasPorPartidoRow,
	VerTimbasResueltasPorPartidoRow,
} from "@sqlc/timba_sql";

export interface CrearTimbaInput {
	jugador1Id: string;
	partidoId: number;
	descripcion: string;
	puntosPropuestos: number;
	puntosArriesgados?: number;
}

export interface CrearTimbaResult {
	timbaId: number;
	puntosPropuestos: number;
	puntosArriesgados: number;
	descripcion: string;
	jugador1Id: string;
	equipoLocalNombre: string;
	equipoLocalBandera: string;
	equipoLocalSiglas: string;
	equipoVisitanteNombre: string;
	equipoVisitanteBandera: string;
	equipoVisitanteSiglas: string;
}

export interface AceptarTimbaInput {
	timbaId: number;
	jugador2Id: string;
}

export interface AceptarTimbaResult {
	timbaId: number;
	puntosPropuestos: number;
	puntosArriesgados: number;
	descripcion: string;
	jugador1Id: string;
	jugador2Id: string;
	jugador1Nombre: string;
	equipoLocalNombre: string;
	equipoLocalBandera: string;
	equipoLocalSiglas: string;
	equipoVisitanteNombre: string;
	equipoVisitanteBandera: string;
	equipoVisitanteSiglas: string;
	cancelledContraofertaMessageIds: string[];
}

export interface CancelarTimbaInput {
	timbaId: number;
	jugador1Id: string;
}

export type CancelarTimbaResult = Pick<
	VerTimbaRow,
	| "jugador_1Id"
	| "equipoLocalNombre"
	| "equipoLocalBandera"
	| "equipoLocalSiglas"
	| "equipoVisitanteNombre"
	| "equipoVisitanteBandera"
	| "equipoVisitanteSiglas"
	| "discordMessageId"
> & { cancelledContraofertaMessageIds: string[] };

export type AnularTimbaResult = Pick<
	VerTimbaRow,
	| "jugador_1Id"
	| "jugador_2Id"
	| "equipoLocalNombre"
	| "equipoLocalBandera"
	| "equipoVisitanteNombre"
	| "equipoVisitanteBandera"
	| "descripcion"
	| "discordMessageId"
>;

export interface ResolverTimbaInput {
	timbaId: number;
	ganadorJugador: "j1" | "j2";
}

export interface ResolverTimbaResult {
	ganadorId: string;
	ganadorNombre: string;
	perdedorId: string;
	perdedorNombre: string;
	puntosRobados: number;
	descripcion: string;
	equipoLocalSiglas: string;
	equipoLocalBandera: string;
	equipoVisitanteSiglas: string;
	equipoVisitanteBandera: string;
}

export interface CrearContraofertaInput {
	jugador1Id: string;
	timbaOriginalId: number;
	descripcion: string;
	puntosPropuestos: number;
	puntosArriesgados: number;
}

export interface CrearContraofertaResult {
	contraofertaId: number;
	puntosPropuestos: number;
	puntosArriesgados: number;
	descripcion: string;
	jugador1Id: string;
	equipoLocalNombre: string;
	equipoLocalBandera: string;
	equipoLocalSiglas: string;
	equipoVisitanteNombre: string;
	equipoVisitanteBandera: string;
	equipoVisitanteSiglas: string;
	timbaOriginalId: number;
	timbaOriginalJugador1Id: string;
}

export interface AceptarContraofertaInput {
	contraofertaId: number;
	jugador1OriginalId: string;
}

export interface ITimbaService {
	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null>;

	verTimba(timbaId: number): Promise<VerTimbaRow | null>;

	crearTimba(args: CrearTimbaInput): Promise<CrearTimbaResult>;

	aceptarTimba(args: AceptarTimbaInput): Promise<AceptarTimbaResult>;

	cancelarTimba(args: CancelarTimbaInput): Promise<CancelarTimbaResult>;

	anularTimba(timbaId: number): Promise<AnularTimbaResult>;

	resolverTimba(args: ResolverTimbaInput): Promise<ResolverTimbaResult>;

	verTimbasCerradasPorPartido(
		partidoId: number,
	): Promise<VerTimbasCerradasPorPartidoRow[]>;

	verTimbasResueltasPorPartido(
		partidoId: number,
	): Promise<VerTimbasResueltasPorPartidoRow[]>;

	verMisTimbas(jugador1Id: string): Promise<VerMisTimbasRow[]>;

	verFechasDeTimbasPorUsuario(jugador1Id: string): Promise<string[]>;

	verMisTimbasPorFecha(
		args: VerMisTimbasPorFechaArgs,
	): Promise<VerMisTimbasPorFechaRow[]>;

	verTimbasPorPartido(partidoId: number): Promise<VerTimbasPorPartidoRow[]>;

	cancelarTimbasAbiertas(partidoId: number): Promise<void>;

	verTimbasMedioTiempoPorPartido(
		partidoId: number,
	): Promise<VerTimbasMedioTiempoPorPartidoRow[]>;

	resolverTimbaMedioTiempo(
		args: ResolverTimbaInput,
	): Promise<ResolverTimbaResult>;

	revertirTimba(timbaId: number): Promise<void>;

	guardarMensajeTimba(timbaId: number, messageId: string): Promise<void>;

	crearContraoferta(
		args: CrearContraofertaInput,
	): Promise<CrearContraofertaResult>;

	aceptarContraoferta(
		args: AceptarContraofertaInput,
	): Promise<AceptarTimbaResult>;

	rechazarContraoferta(args: {
		contraofertaId: number;
		jugador1OriginalId: string;
	}): Promise<CancelarTimbaResult>;

	verTimbaIdPorDiscordMessageId(
		discordMessageId: string,
	): Promise<number | null>;
}
