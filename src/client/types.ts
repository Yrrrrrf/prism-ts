/**
 * Core type definitions for Prism-TS
 *
 * These interfaces match the JSON structure returned by Prism-PY's metadata endpoints
 */

// Column reference (for foreign keys)
export interface ColumnReference {
	schema: string;
	table: string;
	column: string;
}

// Column metadata
export interface ColumnMetadata {
	name: string;
	type: string;
	nullable: boolean;
	isPrimaryKey: boolean;
	isEnum: boolean;
	references?: ColumnReference;
}

// Table metadata
export interface TableMetadata {
	name: string;
	schema: string;
	columns: ColumnMetadata[];
}

// View metadata
export interface ViewMetadata {
	name: string;
	schema: string;
	columns: ColumnMetadata[];
}

// Enum metadata
export interface EnumMetadata {
	name: string;
	schema: string;
	values: string[];
}

// Function parameter metadata
export interface FunctionParameter {
	name: string;
	type: string;
	mode: string; // "IN", "OUT", "INOUT"
	hasDefault: boolean;
	defaultValue: string | null;
}

// Function metadata
export interface FunctionMetadata {
	name: string;
	schema: string;
	type: string; // "scalar", "table", "set"
	objectType: string; // "function", "procedure", "trigger"
	description: string | null;
	parameters: FunctionParameter[];
	returnType: string | null;
	isStrict: boolean;
}

// Schema metadata (comprehensive database structure)
export interface SchemaMetadata {
	name: string;
	tables: Record<string, TableMetadata>;
	views: Record<string, ViewMetadata>;
	enums: Record<string, EnumMetadata>;
	functions: Record<string, FunctionMetadata>;
	procedures: Record<string, FunctionMetadata>;
	triggers: Record<string, FunctionMetadata>;
}

// Health check response
export interface HealthStatus {
	status: string;
	timestamp: string;
	version: string;
	uptime: number;
	databaseConnected: boolean;
}

// Cache status response
export interface CacheStatus {
	lastUpdated: string;
	totalItems: number;
	tablesCached: number;
	viewsCached: number;
	enumsCached: number;
	functionsCached: number;
	proceduresCached: number;
	triggersCached: number;
}

// Query filtering options
export interface FilterOptions {
	where?: Record<string, unknown>;
	orderBy?: string;
	orderDir?: "asc" | "desc";
	limit?: number;
	offset?: number;
}
