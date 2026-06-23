import type {
	VerMisTimbasPorFechaArgs,
	VerMisTimbasPorFechaRow,
	VerMisTimbasRow,
	VerPartidoParaTimbaRow,
	VerTimbaRow,
	VerTimbasCerradasPorPartidoRow,
	VerTimbasPorPartidoRow,
	VerTimbasResueltasPorPartidoRow,
} from "@sqlc/timba_sql";

export interface CrearTimbaInput {
	jugador1Id: string;
	partidoId: number;
	descripcion: string;
	puntos: number;
}

export interface CrearTimbaResult {
	timbaId: number;
	puntos: number;
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
	puntos: number;
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
	puntos: number;
	descripcion: string;
	equipoLocalSiglas: string;
	equipoLocalBandera: string;
	equipoVisitanteSiglas: string;
	equipoVisitanteBandera: string;
}

export interface ITimbaService {
	verPartidoParaTimba(
		partidoId: number,
	): Promise<VerPartidoParaTimbaRow | null>;

	crearTimba(args: CrearTimbaInput): Promise<CrearTimbaResult>;

	aceptarTimba(args: AceptarTimbaInput): Promise<AceptarTimbaResult>;

	cancelarTimba(args: CancelarTimbaInput): Promise<CancelarTimbaResult>;

	anularTimba(timbaId: number): Promise<void>;

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

	guardarMensajeTimba(timbaId: number, messageId: string): Promise<void>;
}
