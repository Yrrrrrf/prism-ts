/**
 * CRUD operations for database tables
 */

import { BaseClient } from "./base.ts";
import { FilterOptions } from "./types.ts";

/**
 * Standard CRUD operations interface for a table
 */
export interface CrudOperations<T> {
	/**
	 * Find a single record by ID
	 */
	findOne(id: string | number): Promise<T>;

	/**
	 * Find all records with optional filtering
	 */
	findAll(filter?: FilterOptions): Promise<T[]>;

	/**
	 * Create a new record
	 */
	create(data: Partial<T>): Promise<T>;

	/**
	 * Update a record by ID
	 */
	update(id: string | number, data: Partial<T>): Promise<T>;

	/**
	 * Delete a record by ID
	 */
	delete(id: string | number): Promise<void>;

	/**
	 * Find records with filtering (alias for findAll)
	 */
	findMany(filter: FilterOptions): Promise<T[]>;

	/**
	 * Count records with optional filtering
	 */
	count(filter?: FilterOptions): Promise<number>;
}

/**
 * Create a set of CRUD operations for a table
 */
export function createCrudOperations<T>(
	client: BaseClient,
	schema: string,
	table: string,
): CrudOperations<T> {
	const basePath = `/${schema}/${table}`;

	/**
	 * Transform filter options to query parameters
	 */
	function transformFilterToParams(
		filter: FilterOptions = {},
	): Record<string, string> {
		const params: Record<string, string> = {};

		// Add where conditions
		if (filter.where) {
			Object.entries(filter.where).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					params[key] = String(value);
				}
			});
		}

		// Add pagination and sorting
		if (filter.orderBy) params.order_by = filter.orderBy;
		if (filter.orderDir) params.order_dir = filter.orderDir;
		if (filter.limit !== undefined) params.limit = String(filter.limit);
		if (filter.offset !== undefined) params.offset = String(filter.offset);

		return params;
	}

	return {
		async findAll(filter?: FilterOptions): Promise<T[]> {
			return client.get<T[]>(basePath, {
				params: transformFilterToParams(filter),
			});
		},

		async findOne(id: string | number): Promise<T> {
			const results = await this.findAll({
				where: { id: String(id) },
			});

			if (results.length === 0) {
				throw new Error(`No record found with ID: ${id}`);
			}

			return results[0];
		},

		async create(data: Partial<T>): Promise<T> {
			return client.post<T>(basePath, data);
		},

		async update(id: string | number, data: Partial<T>): Promise<T> {
			const response = await client.put<{ updated_data: T[] }>(
				basePath,
				data,
				{
					params: { id: String(id) },
				},
			);

			if (!response.updated_data || response.updated_data.length === 0) {
				throw new Error(`Update failed for ID: ${id}`);
			}

			return response.updated_data[0];
		},

		async delete(id: string | number): Promise<void> {
			await client.delete(basePath, {
				params: { id: String(id) },
			});
		},

		async findMany(filter: FilterOptions): Promise<T[]> {
			return this.findAll(filter);
		},

		async count(filter?: FilterOptions): Promise<number> {
			const response = await client.get<{ count: number }>(
				`${basePath}/count`,
				{
					params: transformFilterToParams(filter),
				},
			);

			return response.count;
		},
	};
}
