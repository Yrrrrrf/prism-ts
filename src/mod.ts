// src/mod.ts

/**
 * prism-ts: TypeScript client for prism-py APIs
 *
 * This library creates a seamless bridge between prism-py generated APIs
 * and frontend applications with full type safety.
 */

// Main classes
export { Prism } from "./prism.ts";
export { BaseClient, PrismError } from "./client/base.ts"; // <--- MODIFIED: Export PrismError class directly here
export { MetadataClient } from "./client/metadata.ts";

// CRUD operations
export { createCrudOperations } from "./client/crud.ts";
export type { CrudOperations } from "./client/crud.ts"; // CrudOperations is an interface, so 'export type' is fine

// Type exports
export type {
	// Options and configurations
	PrismOptions,
} from "./prism.ts";

export type {
	// Client options (RequestOptions is an interface)
	RequestOptions,
	// PrismError type can still be exported here if needed for purely type contexts,
	// but the class export above makes it available as a value too.
	// It's generally fine to just export the class, as its type is implicitly available.
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
	ReturnColumn, // Make sure ReturnColumn is exported if used in public types
	// Schema metadata types
	SchemaMetadata,
	TableMetadata,
	TriggerEventData, // Make sure TriggerEventData is exported
	TriggerMetadata, // Make sure TriggerMetadata is exported
	ViewMetadata,
} from "./client/types.ts"; // Assuming these are all interfaces/types

// Helper function to display package info
export function displayInfo(): void {
	console.log("prism-ts v0.1.0"); // Consider updating this version string if it has changed
	console.log("TypeScript client for prism-py APIs");
	console.log("https://github.com/Yrrrrrf/prism-ts");
}
