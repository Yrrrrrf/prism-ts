// src/client/crud.ts
import { BaseClient, PrismError } from "./base.ts";
import { FilterOptions, WhereClause, WhereClauseValue } from "./types.ts"; // Ensure WhereClauseValue is also imported
import { log } from "../tools/logging.ts";

export interface CrudOperations<T> {
	findOne(id: string | number): Promise<T>;
	findAll(filter?: FilterOptions<T>): Promise<T[]>;
	create(data: Partial<T>): Promise<T>;
	update(id: string | number, data: Partial<T>): Promise<T>;
	delete(id: string | number): Promise<Record<string, string | number>>; // Updated to match typical delete response
	findMany(filter: FilterOptions<T>): Promise<T[]>;
	count(filter?: FilterOptions<T>): Promise<number>;
}

export function createCrudOperations<
	// T now represents the actual entity type, e.g., ProfileRecord
	// We can constrain it to have an 'id' field for findOne if that's a strict requirement.
	T extends { id?: string | number | null } & Record<string, unknown>,
>(
	client: BaseClient,
	schema: string,
	table: string,
): CrudOperations<T> {
	const basePath = `/${schema}/${table}`;

	function transformFilterToParams(
		filter: FilterOptions<T> = {},
	): Record<string, string> {
		const params: Record<string, string> = {};

		if (filter.where) {
			// Iterate over the 'where' object which is WhereClause<Partial<T>>
			for (const key in filter.where) {
				if (Object.hasOwn(filter.where, key)) {
					// value can be V | V[] | null from WhereClauseValue
					const value = (filter.where as Partial<T>)[
						key as keyof Partial<T>
					] as WhereClauseValue<unknown>;

					if (value !== undefined && value !== null) {
						if (Array.isArray(value)) {
							params[key] = value.map(String).join(","); // Convert each item to string for join
						} else if (typeof value === "object") { // For advanced operator objects
							log.warn(
								`Skipping complex where clause object for key '${key}' in transformFilterToParams for now.`,
							);
							// Future: Implement logic to convert { _gte: 10 } to "key__gte=10"
						} else {
							params[key] = String(value);
						}
					} else if (value === null) {
						// Convention for IS NULL, e.g., key__isnull=true or key=null (depends on prism-py)
						// For now, let's assume prism-py handles "key=null" as IS NULL check if needed.
						// Or, more explicitly, this might need a special query param like `key__isnull=true`
						params[key] = "null"; // Or handle based on server convention
					}
				}
			}
		}

		if (filter.orderBy) {
			if (typeof filter.orderBy === "string") {
				params.order_by = filter.orderBy;
				if (filter.orderDir) params.order_dir = filter.orderDir;
			} else if (
				typeof filter.orderBy === "object" &&
				!Array.isArray(filter.orderBy)
			) {
				const field = Object.keys(filter.orderBy)[0];
				const direction =
					(filter.orderBy as Record<string, string>)[field];
				if (field) {
					params.order_by = field;
					if (direction === "asc" || direction === "desc") {
						params.order_dir = direction;
					}
				}
			}
		} else if (filter.orderDir) { // Only if orderBy is not an object that already specified direction
			params.order_dir = filter.orderDir;
		}
		if (filter.limit !== undefined) params.limit = String(filter.limit);
		if (filter.offset !== undefined) params.offset = String(filter.offset);

		return params;
	}

	return {
		async findAll(filter?: FilterOptions<T>): Promise<T[]> {
			return await client.get<T[]>(basePath, { // Added await
				params: transformFilterToParams(filter),
			});
		},

		async findOne(id: string | number): Promise<T> {
			// Construct the where clause correctly.
			// We assume T has an 'id' field based on the constraint.
			const whereClause: WhereClause<Partial<T>> = {
				id: id as WhereClauseValue<T["id"]>, // Cast 'id' to match expected value type
			} as WhereClause<Partial<T>>; // Ensure the object matches the type

			const results = await this.findAll({
				where: whereClause,
				limit: 1,
			});

			if (results.length === 0) {
				throw new PrismError(
					`No record found with ID: ${id}`,
					"NOT_FOUND",
					404,
				);
			}
			return results[0];
		},

		async create(data: Partial<T>): Promise<T> {
			return await client.post<T>(basePath, data); // Added await
		},

		async update(id: string | number, data: Partial<T>): Promise<T> {
			const updatedRecord = await client.put<T>( // Added await
				basePath,
				data,
				{
					params: { id: String(id) },
				},
			);
			if (!updatedRecord) { // This check might be redundant if client.put throws on non-2xx/empty body for T
				throw new PrismError(
					`Update failed for ID: ${id} - no record returned.`,
					"UPDATE_FAILED",
				);
			}
			return updatedRecord;
		},

		async delete(
			id: string | number,
		): Promise<Record<string, string | number>> { // Return type matches prism-py
			return await client.delete<Record<string, string | number>>(
				basePath,
				{ // Added await
					params: { id: String(id) },
				},
			);
		},

		async findMany(filter: FilterOptions<T>): Promise<T[]> {
			return await this.findAll(filter); // Added await (findAll is async)
		},

		async count(filter?: FilterOptions<T>): Promise<number> {
			const response = await client.get<{ count: number }>( // Added await
				`${basePath}/count`,
				{
					params: transformFilterToParams(filter),
				},
			);
			return response.count;
		},
	};
}
