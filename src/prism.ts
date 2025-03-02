/**
 * Main class for prism-ts client
 */
import type { BaseClient } from "./client/base.ts";
// import type { SchemaMetadata } from "./client/types.ts";

export class PrismTs {
	constructor(private client: BaseClient) {}

	/**
	 * Initialize the client and load schema metadata
	 */
	async initialize(): Promise<void> {
		// This will be implemented to fetch schema data
		console.log("Initializing prism-ts client...");
	}

	/**
	 * Generate TypeScript interfaces from schema metadata
	 */
	async generateTypes(): Promise<void> {
		// This will be implemented to generate TypeScript types
		console.log("Generating TypeScript types...");
	}
}
