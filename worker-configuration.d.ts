/** Minimal Worker bindings. Run `pnpm cf-typegen` for the full generated types. */
interface Env {
	DB?: D1Database;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
	dump(): Promise<ArrayBuffer>;
	batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
	exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	first<T = unknown>(colName?: string): Promise<T | null>;
	run<T = unknown>(): Promise<D1Result<T>>;
	all<T = unknown>(): Promise<D1Result<T>>;
	raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
	results?: T[];
	success: boolean;
	error?: string;
	meta: {
		duration: number;
		changes?: number;
		last_row_id?: number;
		changed_db?: boolean;
		rows_read?: number;
		rows_written?: number;
	};
}

interface D1ExecResult {
	count: number;
	duration: number;
}
