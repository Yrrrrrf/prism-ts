/**
 * prism-ts: TypeScript client for prism-py generated APIs
 *
 * This library creates a seamless bridge between prism-py generated APIs
 * and frontend applications with full type safety.
 */

// Re-export main components
export { BaseClient } from "./client/base.ts";
export { PrismTs } from "./prism.ts";

console.log("prism-ts v0.1.0");

// // Export types
// export type {
//   FilterOptions,
//   CrudOperations
// } from "./client/crud.ts";

// export type {
//   TableMetadata,
//   SchemaMetadata,
//   ColumnMetadata
// } from "./client/types.ts";

// Helper function to display application info
export function displayInfo(): void {
	console.log("prism-ts v0.1.0");
	console.log("TypeScript client for prism-py APIs");
}
