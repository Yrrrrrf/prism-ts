/**
 * Core type definitions and utilities for the Prism-TS framework.
 * Designed to provide sophisticated type mapping similar to the Python implementation.
 */

// ===== Type Aliases =====
export type SqlType = string; // SQL type string (e.g., "varchar(255)")
export type JsonData = Record<string, any> | Record<string, any>[];

// ===== SQL Type Categories =====
export enum SqlTypeCategory {
	NUMERIC = "numeric",
	STRING = "string",
	TEMPORAL = "temporal",
	BOOLEAN = "boolean",
	BINARY = "binary",
	JSON = "json",
	ARRAY = "array",
	ENUM = "enum",
	UUID = "uuid",
	NETWORK = "network",
	GEOMETRIC = "geometric",
	OTHER = "other",
}

// ===== Type Mapping Interfaces =====
export interface TypeMapping {
	sqlPattern: RegExp; // Regex pattern to match SQL type
	tsType: string; // Corresponding TypeScript type
	category: SqlTypeCategory; // Type category
	defaultValue?: string; // Default value representation
	converter?: (value: unknown) => unknown; // Optional conversion function
}

// ===== Special Type Wrappers =====
export class ArrayType<T> {
	constructor(public itemType: string) {}

	toString(): string {
		return `${this.itemType}[]`;
	}
}

export class JsonType {
	private modelCache: Map<string, string> = new Map();

	constructor(public sampleData?: unknown) {}

	getModelName(baseName: string): string {
		if (!this.modelCache.has(baseName)) {
			// Generate model name based on the base name
			this.modelCache.set(baseName, `${baseName}Json`);
		}
		return this.modelCache.get(baseName)!;
	}

	toString(): string {
		return "Record<string, unknown>";
	}
}

// ===== Query Parameters Interface =====
export interface QueryParams {
	limit?: number;
	offset?: number;
	order_by?: string;
	order_dir?: "asc" | "desc";
	[key: string]: unknown;
}
