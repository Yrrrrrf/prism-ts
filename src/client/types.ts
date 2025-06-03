// src/client/types.ts

/**
 * Core type definitions for Prism-TS, designed to match the JSON structure
 * returned by Prism-PY's metadata endpoints (as defined by its OpenAPI spec).
 */

// --- Base & Reused Utility Types ---

/**
 * Reference to another database column, typically used for foreign keys.
 * Matches Prism-PY's ApiColumnReference.
 */
export interface ColumnReference {
	schema: string;
	table: string;
	column: string;
}

/**
 * Metadata for a column within a table or view.
 * Matches Prism-PY's ApiColumnMetadata.
 */
export interface ColumnMetadata {
	name: string;
	type: string; // SQL type string, e.g., "VARCHAR", "INTEGER[]", "NUMERIC(10,2)"
	nullable: boolean;
	is_pk?: boolean | null; // True if part of the primary key, null/false otherwise.
	is_enum?: boolean | null; // True if the column type is a database enum.
	references?: ColumnReference | null; // FK reference, if any.
}

/**
 * Metadata for a database table or view.
 * For views, it describes the columns of the view's result set.
 * Matches Prism-PY's ApiTableMetadata.
 */
export interface TableMetadata {
	name: string;
	schema: string; // The schema this table/view belongs to.
	columns: ColumnMetadata[];
}

/**
 * Alias for TableMetadata, specifically for views.
 * Views share the same structural metadata as tables in this context.
 */
export type ViewMetadata = TableMetadata;

/**
 * Metadata for a database enum type.
 * Matches Prism-PY's ApiEnumMetadata.
 */
export interface EnumMetadata {
	name: string; // The name of the enum type.
	schema: string; // The schema this enum belongs to.
	values: string[]; // List of string values for the enum.
}

/**
 * Metadata for a parameter of a database function or procedure.
 * Matches Prism-PY's ApiFunctionParameter.
 */
export interface FunctionParameter {
	name: string;
	type: string; // SQL type string of the parameter.
	mode: string; // e.g., "IN", "OUT", "INOUT", "VARIADIC".
	has_default: boolean;
	default_value?: string | null; // Default value as a string, if any.
}

/**
 * Describes a single column returned by a table-returning function.
 * Matches Prism-PY's ApiReturnColumn.
 */
export interface ReturnColumn {
	name: string;
	type: string; // SQL type string of the return column.
}

/**
 * Metadata for a database function or procedure.
 * Matches Prism-PY's ApiFunctionMetadata.
 */
export interface FunctionMetadata {
	name: string;
	schema: string; // The schema this function/procedure belongs to.
	type: string; // Nature of the function, e.g., "scalar", "table", "set".
	object_type: string; // Type of database object, e.g., "function", "procedure".
	description?: string | null;
	parameters: FunctionParameter[];
	return_type?: string | null; // SQL type string of the return value (for scalar/set functions).
	return_columns?: ReturnColumn[] | null; // For table-returning functions.
	is_strict: boolean; // True if the function is strict (returns null on null input).
}

/**
 * Specific event data for a database trigger.
 * Matches Prism-PY's ApiTriggerEvent.
 */
export interface TriggerEventData {
	timing: string; // e.g., "BEFORE", "AFTER", "INSTEAD OF".
	events: string[]; // e.g., ["INSERT", "UPDATE"].
	table_schema: string; // Schema of the table the trigger is on.
	table_name: string; // Name of the table the trigger is on.
}

/**
 * Metadata for a database trigger.
 * Extends FunctionMetadata as triggers are special types of functions.
 * Matches Prism-PY's ApiTriggerMetadata.
 */
export interface TriggerMetadata extends FunctionMetadata {
	trigger_data: TriggerEventData;
}

/**
 * Comprehensive metadata for a single database schema, including all its objects.
 * This is the primary structure fetched by `Prism.initialize()`.
 * Matches Prism-PY's ApiSchemaMetadata.
 */
export interface SchemaMetadata {
	name: string;
	tables: Record<string, TableMetadata>;
	views: Record<string, ViewMetadata>;
	enums: Record<string, EnumMetadata>;
	functions: Record<string, FunctionMetadata>;
	procedures: Record<string, FunctionMetadata>; // Procedures are also described by FunctionMetadata
	triggers: Record<string, TriggerMetadata>;
}

// --- Health and Status Types ---

/**
 * API health status.
 * Matches Prism-PY's HealthResponse.
 */
export interface HealthStatus {
	status: string;
	timestamp: string; // ISO date-time string
	version: string;
	uptime: number; // in seconds
	database_connected: boolean;
}

/**
 * Metadata cache status.
 * Matches Prism-PY's CacheStatus.
 */
export interface CacheStatus {
	last_updated: string; // ISO date-time string
	total_items: number;
	tables_cached: number;
	views_cached: number;
	enums_cached: number;
	functions_cached: number;
	procedures_cached: number;
	triggers_cached: number;
}

// --- Client Operation Types ---

/**
 * Options for filtering, sorting, and paginating API requests.
 * This is a client-side construct used by `CrudOperations`.
 */
export interface FilterOptions {
	where?: Record<string, unknown>; // For simple key-value equality filters.
	orderBy?: string; // Field name to order by.
	orderDir?: "asc" | "desc"; // Direction of ordering.
	limit?: number;
	offset?: number;
}

// Note: RequestOptions and PrismError from the original src/client/base.ts
// are client-specific and don't directly map to OpenAPI metadata response models,
// so they can remain as they were if they serve their purpose for client operations.
