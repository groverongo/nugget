import type { VerEquiposArgs, VerEquiposRow } from "@sqlc/equipos_sql";
import type {
	BuscarJugadoresArgs,
	BuscarJugadoresRow,
	VerJugadoresPorEquipoArgs,
	VerJugadoresPorEquipoRow,
} from "@sqlc/jugadores_sql";
import type { AgregarPuestoPremioArgs } from "@sqlc/usuarios_sql";
import type { PoolClient } from "pg";

export interface IEstaticoRepository {
	limpiezaDistribucionPremios(): Promise<void>;
	agregarEntradaDistribucionPremio(
		args: AgregarPuestoPremioArgs[],
	): Promise<void>;
	verEquipos(args: VerEquiposArgs): Promise<VerEquiposRow[]>;
	verJugadoresPorEquipo(
		args: VerJugadoresPorEquipoArgs,
	): Promise<VerJugadoresPorEquipoRow[]>;
	buscarJugadores(args: BuscarJugadoresArgs): Promise<BuscarJugadoresRow[]>;
	withTx(tx: PoolClient): IEstaticoRepository;
}
