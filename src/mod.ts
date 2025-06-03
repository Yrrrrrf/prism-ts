/**
 * prism-ts: TypeScript client for prism-py APIs
 *
 * This library creates a seamless bridge between prism-py generated APIs
 * and frontend applications with full type safety.
 */

// Main classes
export { Prism } from "./prism.ts";
export { BaseClient } from "./client/base.ts";
export { MetadataClient } from "./client/metadata.ts";
export { TypeGenerator } from "./tools/type-generator.ts";

// CRUD operations
export { createCrudOperations } from "./client/crud.ts";
export type { CrudOperations } from "./client/crud.ts";

// Type exports
export type {
	// Options and configurations
	PrismOptions,
} from "./prism.ts";

export type {
	// Error handling
	PrismError,
	// Client options
	RequestOptions,
} from "./client/base.ts";

export type {
	CacheStatus,
	ColumnMetadata,
	ColumnReference,
	EnumMetadata,
	// Query options
	FilterOptions,
	FunctionMetadata,
	FunctionParameter,
	// Health and status
	HealthStatus,
	// Schema metadata types
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
} from "./client/types.ts";

// Helper function to display package info
export function displayInfo(): void {
	console.log("prism-ts v0.1.0");
	console.log("TypeScript client for prism-py APIs");
	console.log("https://github.com/Yrrrrrf/prism-ts");
}
