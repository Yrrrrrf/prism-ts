/**
 * Client for accessing Prism-PY metadata endpoints
 *
 * These endpoints provide information about the database structure
 */

import { BaseClient } from "./base.ts";
import {
	CacheStatus,
	EnumMetadata,
	FunctionMetadata,
	HealthStatus,
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
} from "./types.ts";

export class MetadataClient {
	constructor(private client: BaseClient) {}

	/**
	 * Get all database schemas with their structure
	 */
	async getSchemas(): Promise<SchemaMetadata[]> {
		return this.client.get<SchemaMetadata[]>("/dt/schemas");
	}

	/**
	 * Get all tables for a specific schema
	 */
	async getTables(schema: string): Promise<TableMetadata[]> {
		return this.client.get<TableMetadata[]>(`/dt/${schema}/tables`);
	}

	/**
	 * Get all views for a specific schema
	 */
	async getViews(schema: string): Promise<ViewMetadata[]> {
		return this.client.get<ViewMetadata[]>(`/dt/${schema}/views`);
	}

	/**
	 * Get all enum types for a specific schema
	 */
	async getEnums(schema: string): Promise<EnumMetadata[]> {
		return this.client.get<EnumMetadata[]>(`/dt/${schema}/enums`);
	}

	/**
	 * Get all functions for a specific schema
	 */
	async getFunctions(schema: string): Promise<FunctionMetadata[]> {
		return this.client.get<FunctionMetadata[]>(`/dt/${schema}/functions`);
	}

	/**
	 * Get all procedures for a specific schema
	 */
	async getProcedures(schema: string): Promise<FunctionMetadata[]> {
		return this.client.get<FunctionMetadata[]>(`/dt/${schema}/procedures`);
	}

	/**
	 * Get all triggers for a specific schema
	 */
	async getTriggers(schema: string): Promise<FunctionMetadata[]> {
		return this.client.get<FunctionMetadata[]>(`/dt/${schema}/triggers`);
	}

	/**
	 * Get API health status
	 */
	async getHealth(): Promise<HealthStatus> {
		return this.client.get<HealthStatus>("/health");
	}

	/**
	 * Simple ping endpoint (returns "pong")
	 */
	async ping(): Promise<string> {
		return this.client.get<string>("/health/ping");
	}

	/**
	 * Get metadata cache status
	 */
	async getCacheStatus(): Promise<CacheStatus> {
		return this.client.get<CacheStatus>("/health/cache");
	}

	/**
	 * Clear and reload metadata cache
	 */
	async clearCache(): Promise<{ status: string; message: string }> {
		return this.client.post<{ status: string; message: string }>(
			"/health/clear-cache",
		);
	}
}
