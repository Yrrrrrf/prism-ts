// src/common/type-utils.ts

import { SQL_TYPE_MAPPINGS } from "./type-mappings.ts";
import { ArrayType, JsonType } from "./types.ts";

/**
 * Map SQL type to TypeScript type.
 * Handles complex types like arrays and JSON.
 */
export function mapSqlTypeToTs(sqlType: string, sampleData?: unknown): string {
	// Normalize SQL type
	const sqlTypeLower = sqlType.toLowerCase().trim();

	// Handle array types
	if (sqlTypeLower.endsWith("[]")) {
		const baseType = sqlTypeLower.slice(0, -2);
		const itemType = mapSqlTypeToTs(baseType);
		return new ArrayType(itemType).toString();
	}

	// Handle JSON type with sample data
	if (sqlTypeLower === "jsonb" || sqlTypeLower === "json") {
		return new JsonType(sampleData).toString();
	}

	// Match against known types
	for (const mapping of SQL_TYPE_MAPPINGS) {
		if (mapping.sqlPattern.test(sqlTypeLower)) {
			return mapping.tsType;
		}
	}

	// Default fallback
	return "unknown";
}

/**
 * Create a TypeScript interface for a database table.
 */
export function generateInterface(
	tableName: string,
	columns: Array<{ name: string; type: string; nullable: boolean }>,
): string {
	// Convert table name to PascalCase for interface name
	const interfaceName = toPascalCase(tableName);

	// Generate the interface
	let interfaceCode = `export interface ${interfaceName} {\n`;

	// Add each column
	for (const column of columns) {
		const tsType = mapSqlTypeToTs(column.type);
		const nullable = column.nullable ? "?" : "";
		interfaceCode += `  ${column.name}${nullable}: ${tsType};\n`;
	}

	// Close interface
	interfaceCode += "}\n";

	return interfaceCode;
}

/**
 * Create a TypeScript enum from enum values.
 */
export function generateEnum(enumName: string, values: string[]): string {
	// Convert enum name to PascalCase
	const typeName = toPascalCase(enumName);

	// Generate the enum
	let enumCode = `export enum ${typeName} {\n`;

	// Add enum values
	for (const value of values) {
		// Clean up the value to be a valid TypeScript identifier
		const cleanValue = value.replace(/[^a-zA-Z0-9_]/g, "_");
		enumCode += `  ${cleanValue} = "${value}",\n`;
	}

	// Close enum
	enumCode += "}\n";

	return enumCode;
}

/**
 * Convert a string to PascalCase.
 */
export function toPascalCase(str: string): string {
	return str
		.split(/[^a-zA-Z0-9]+/)
		.map((word) =>
			word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join("");
}

/**
 * Convert a string to camelCase.
 */
export function toCamelCase(str: string): string {
	const pascal = toPascalCase(str);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert a value to the corresponding TypeScript type.
 */
export function convertValue(value: unknown, targetType: string): unknown {
	if (value === null || value === undefined) {
		return null;
	}

	// Perform type conversion based on target
	switch (targetType) {
		case "number":
			return Number(value);

		case "boolean":
			return Boolean(value);

		case "Date":
		case "string": // For timestamp/date types
			if (typeof value === "string") {
				// Try to parse as ISO date
				try {
					// Just ensure it's a valid date string, return as is
					new Date(value);
					return value;
				} catch {
					return value;
				}
			}
			return String(value);

		case "Record<string, unknown>":
			if (typeof value === "string") {
				try {
					return JSON.parse(value);
				} catch {
					return {};
				}
			}
			return value;

		default:
			// Check if it's an array type
			if (targetType.endsWith("[]")) {
				const itemType = targetType.slice(0, -2);
				if (Array.isArray(value)) {
					return value.map((item) => convertValue(item, itemType));
				} else if (typeof value === "string") {
					try {
						// Try to parse as JSON array
						const parsed = JSON.parse(value);
						if (Array.isArray(parsed)) {
							return parsed.map((item) =>
								convertValue(item, itemType)
							);
						}
					} catch {
						// Not a valid JSON
					}
					// Handle PostgreSQL array format {item1,item2,...}
					if (value.startsWith("{") && value.endsWith("}")) {
						const items = value.slice(1, -1).split(",");
						return items.map((item) =>
							convertValue(item.trim(), itemType)
						);
					}
				}
				return [];
			}

			return value;
	}
}

/**
 * Process and validate response data against expected types.
 */
export function processResponseData<T>(
	data: Record<string, unknown>,
	expectedTypes: Record<string, string>,
): T {
	const result: Record<string, unknown> = {};

	for (const [key, type] of Object.entries(expectedTypes)) {
		if (key in data) {
			result[key] = convertValue(data[key], type);
		}
	}

	return result as T;
}
