/**
 * Main Prism class
 *
 * This is the primary class for interacting with Prism-PY APIs
 */

import { BaseClient } from "./client/base.ts";
import { MetadataClient } from "./client/metadata.ts";
import { createCrudOperations, CrudOperations } from "./client/crud.ts";
import {
	EnumMetadata,
	FilterOptions,
	FunctionMetadata,
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
} from "./client/types.ts";
import { TypeGenerator } from "./tools/type-generator.ts";

export interface PrismOptions {
	baseUrl: string;
	debug?: boolean;
}

/**
 * Prism - TypeScript client for Prism-PY APIs
 *
 * @example
 * ```typescript
 * // Create with URL
 * const prism = new Prism("http://localhost:8000");
 *
 * // OR create with options
 * const prism = new Prism({ baseUrl: "http://localhost:8000", debug: true });
 *
 * // OR create with an existing BaseClient
 * const client = new BaseClient("http://localhost:8000");
 * const prism = new Prism(client);
 * ```
 */
export class Prism {
	private client: BaseClient;
	private metadataClient: MetadataClient;
	private schemas: SchemaMetadata[] = [];
	private initialized = false;
	private initPromise: Promise<void> | null = null;

	/**
	 * Create a new Prism client
	 *
	 * @param options URL string, options object, or BaseClient instance
	 */
	constructor(options: string | PrismOptions | BaseClient) {
		if (options instanceof BaseClient) {
			// Use the provided BaseClient instance directly
			this.client = options;
		} else {
			// Create a new BaseClient from the URL or options
			const baseUrl = typeof options === "string"
				? options
				: options.baseUrl;
			this.client = new BaseClient(baseUrl);
		}

		// Initialize the metadata client with our client
		this.metadataClient = new MetadataClient(this.client);
	}

	/**
	 * Initialize the client by loading schema metadata
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		if (!this.initPromise) {
			this.initPromise = this._initialize();
		}

		return this.initPromise;
	}

	private async _initialize(): Promise<void> {
		try {
			this.schemas = await this.metadataClient.getSchemas();
			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize Prism:", error);
			throw error;
		}
	}

	/**
	 * Get all database schemas
	 */
	async getSchemas(): Promise<SchemaMetadata[]> {
		await this.ensureInitialized();
		return this.schemas;
	}

	/**
	 * Get a specific schema by name
	 */
	async getSchema(schemaName: string): Promise<SchemaMetadata | undefined> {
		await this.ensureInitialized();
		return this.schemas.find((schema) => schema.name === schemaName);
	}

	/**
	 * Get a specific table by schema and name
	 */
	async getTable(
		schemaName: string,
		tableName: string,
	): Promise<TableMetadata | undefined> {
		const schema = await this.getSchema(schemaName);
		return schema?.tables[tableName];
	}

	/**
	 * Get a specific view by schema and name
	 */
	async getView(
		schemaName: string,
		viewName: string,
	): Promise<ViewMetadata | undefined> {
		const schema = await this.getSchema(schemaName);
		return schema?.views[viewName];
	}

	/**
	 * Get a specific enum by schema and name
	 */
	async getEnum(
		schemaName: string,
		enumName: string,
	): Promise<EnumMetadata | undefined> {
		const schema = await this.getSchema(schemaName);
		return schema?.enums[enumName];
	}

	/**
	 * Get a specific function by schema and name
	 */
	async getFunction(
		schemaName: string,
		functionName: string,
	): Promise<FunctionMetadata | undefined> {
		const schema = await this.getSchema(schemaName);
		return schema?.functions[functionName];
	}

	/**
	 * Get CRUD operations for a table
	 */
	async getTableOperations<T = Record<string, unknown>>(
		schemaName: string,
		tableName: string,
	): Promise<CrudOperations<T>> {
		await this.ensureInitialized();
		return createCrudOperations<T>(this.client, schemaName, tableName);
	}

	/**
	 * Execute a database function
	 */
	async executeFunction<T = unknown>(
		schemaName: string,
		functionName: string,
		params: Record<string, unknown> = {},
	): Promise<T> {
		return this.client.post<T>(`/${schemaName}/fn/${functionName}`, params);
	}

	/**
	 * Execute a stored procedure
	 */
	async executeProcedure(
		schemaName: string,
		procedureName: string,
		params: Record<string, unknown> = {},
	): Promise<void> {
		await this.client.post(`/${schemaName}/proc/${procedureName}`, params);
	}

	/**
	 * Get API health status
	 */
	async getHealth() {
		return this.metadataClient.getHealth();
	}

	/**
	 * Ping the API
	 */
	async ping() {
		return this.metadataClient.ping();
	}

	/**
	 * Get cache status
	 */
	async getCacheStatus() {
		return this.metadataClient.getCacheStatus();
	}

	/**
	 * Clear and reload metadata cache
	 */
	async clearCache() {
		const result = await this.metadataClient.clearCache();
		this.initialized = false;
		this.initPromise = null;
		return result;
	}

	/**
	 * Display schema statistics
	 */
	async displaySchemaStats(): Promise<void> {
		await this.ensureInitialized();

		console.log("\n=== Database Schema Statistics ===\n");

		let totalTables = 0;
		let totalViews = 0;
		let totalEnums = 0;
		let totalFunctions = 0;

		for (const schema of this.schemas) {
			const tableCount = Object.keys(schema.tables || {}).length;
			const viewCount = Object.keys(schema.views || {}).length;
			const enumCount = Object.keys(schema.enums || {}).length;
			const functionCount = Object.keys(schema.functions || {}).length +
				Object.keys(schema.procedures || {}).length +
				Object.keys(schema.triggers || {}).length;

			console.log(`Schema: ${schema.name}`);
			console.log(`  Tables: ${tableCount}`);
			console.log(`  Views: ${viewCount}`);
			console.log(`  Enums: ${enumCount}`);
			console.log(`  Functions: ${functionCount}`);
			console.log();

			totalTables += tableCount;
			totalViews += viewCount;
			totalEnums += enumCount;
			totalFunctions += functionCount;
		}

		console.log("=== Totals ===");
		console.log(`Schemas: ${this.schemas.length}`);
		console.log(`Tables: ${totalTables}`);
		console.log(`Views: ${totalViews}`);
		console.log(`Enums: ${totalEnums}`);
		console.log(`Functions: ${totalFunctions}`);
		console.log(
			`Total Objects: ${
				totalTables + totalViews + totalEnums + totalFunctions
			}`,
		);
	}

	/**
	 * Generate TypeScript types from database metadata
	 *
	 * @param outputDir Directory where type files will be written
	 */
	async generateTypes(outputDir: string = "./src/gen"): Promise<void> {
		await this.ensureInitialized();

		const generator = new TypeGenerator();
		await generator.generateTypes(this.schemas, outputDir);

		return;
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.initialize();
		}
	}
}
