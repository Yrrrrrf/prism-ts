/**
 * Utilities for mapping SQL types to TypeScript types
 */

/**
 * SQL to TypeScript type mapping definition
 */
export interface TypeMapping {
	tsType: string;
	defaultValue?: string;
}

/**
 * Mapping of PostgreSQL types to TypeScript types
 */
export const SQL_TYPE_MAPPINGS: Record<string, TypeMapping> = {
	// Numeric types
	"smallint": { tsType: "number", defaultValue: "0" },
	"integer": { tsType: "number", defaultValue: "0" },
	"bigint": { tsType: "number", defaultValue: "0" },
	"decimal": { tsType: "number", defaultValue: "0" },
	"numeric": { tsType: "number", defaultValue: "0" },
	"real": { tsType: "number", defaultValue: "0" },
	"double precision": { tsType: "number", defaultValue: "0" },
	"serial": { tsType: "number", defaultValue: "0" },
	"bigserial": { tsType: "number", defaultValue: "0" },

	// String types
	"char": { tsType: "string", defaultValue: '""' },
	"character": { tsType: "string", defaultValue: '""' },
	"varchar": { tsType: "string", defaultValue: '""' },
	"character varying": { tsType: "string", defaultValue: '""' },
	"text": { tsType: "string", defaultValue: '""' },

	// Boolean type
	"boolean": { tsType: "boolean", defaultValue: "false" },
	"bool": { tsType: "boolean", defaultValue: "false" },

	// Date/Time types
	"timestamp": { tsType: "string", defaultValue: "new Date().toISOString()" },
	"timestamp with time zone": {
		tsType: "string",
		defaultValue: "new Date().toISOString()",
	},
	"timestamp without time zone": {
		tsType: "string",
		defaultValue: "new Date().toISOString()",
	},
	"date": {
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[0]",
	},
	"time": {
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[1]",
	},
	"time with time zone": {
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[1]",
	},
	"time without time zone": {
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[1]",
	},

	// UUID type
	"uuid": { tsType: "string", defaultValue: '""' },

	// JSON types
	"json": { tsType: "Record<string, unknown>", defaultValue: "{}" },
	"jsonb": { tsType: "Record<string, unknown>", defaultValue: "{}" },

	// Array types
	"_int4": { tsType: "number[]", defaultValue: "[]" },
	"_text": { tsType: "string[]", defaultValue: "[]" },
	"_varchar": { tsType: "string[]", defaultValue: "[]" },
	"_bool": { tsType: "boolean[]", defaultValue: "[]" },
	"_timestamp": { tsType: "string[]", defaultValue: "[]" },
	"_uuid": { tsType: "string[]", defaultValue: "[]" },

	// Network address types
	"inet": { tsType: "string", defaultValue: '""' },
	"cidr": { tsType: "string", defaultValue: '""' },
	"macaddr": { tsType: "string", defaultValue: '""' },

	// Binary types
	"bytea": { tsType: "string", defaultValue: '""' },
};

/**
 * Maps a PostgreSQL type to its TypeScript equivalent
 *
 * @param sqlType The SQL type string (e.g., 'varchar(255)', 'integer')
 * @returns The corresponding TypeScript type
 */
export function mapSqlTypeToTs(sqlType: string): string {
	// Normalize the SQL type by removing length specifiers and converting to lowercase
	const normalizedType = sqlType.toLowerCase().replace(/\(.*\)/, "").trim();

	// Handle array types with special syntax
	if (normalizedType.endsWith("[]")) {
		const baseType = normalizedType.slice(0, -2);
		const mappedBaseType = mapSqlTypeToTs(baseType);
		return `${mappedBaseType}[]`;
	}

	// Look up the type in our mapping
	const mapping = SQL_TYPE_MAPPINGS[normalizedType];

	// Return the mapped type or a fallback
	return mapping?.tsType || "unknown";
}

/**
 * Generate TypeScript interface from table metadata
 *
 * @param tableName The name of the table
 * @param columns Array of column metadata
 * @returns TypeScript interface definition as a string
 */
export function generateTypeScriptInterface(
	tableName: string,
	columns: Array<{
		name: string;
		type: string;
		nullable: boolean;
	}>,
): string {
	// Convert table name to PascalCase for interface name
	const interfaceName = tableName
		.split("_")
		.map((part) =>
			part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
		)
		.join("");

	// Start with interface declaration
	let interfaceCode = `export interface ${interfaceName} {\n`;

	// Add each column as a property
	for (const column of columns) {
		const tsType = mapSqlTypeToTs(column.type);
		const nullable = column.nullable ? "?" : "";

		interfaceCode += `  ${column.name}${nullable}: ${tsType};\n`;
	}

	// Close interface
	interfaceCode += "}\n";

	return interfaceCode;
}
