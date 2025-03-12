// src/common/type-mappings.ts
// Type for conversion functions (optional)
export type TypeConverter = (value: unknown) => unknown;

/**
 * Comprehensive SQL type mapping configuration
 */
export interface TypeMapping {
	sqlPattern: RegExp; // Regex pattern to match SQL type
	tsType: string; // Corresponding TypeScript type
	defaultValue: string; // Default value as string
	converter?: TypeConverter; // Optional conversion function
}

/**
 * TypeScript array type wrapper
 */
export class ArrayType {
	constructor(public itemType: string) {}

	toString(): string {
		return `${this.itemType}[]`;
	}
}

/**
 * TypeScript JSON type wrapper
 */
export class JsonType {
	constructor(public sampleData?: unknown) {}

	toString(): string {
		return "Record<string, unknown>";
	}
}

/**
 * Complete SQL to TypeScript type mapping definitions
 */
export const SQL_TYPE_MAPPINGS: TypeMapping[] = [
	// Numeric types
	{
		sqlPattern: /^smallint$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^integer$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^bigint$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^decimal(\(\d+,\s*\d+\))?$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^numeric(\(\d+,\s*\d+\))?$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^real$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^double precision$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^serial$/,
		tsType: "number",
		defaultValue: "0",
	},
	{
		sqlPattern: /^bigserial$/,
		tsType: "number",
		defaultValue: "0",
	},

	// String types
	{
		sqlPattern: /^varchar(\(\d+\))?$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^character varying(\(\d+\))?$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^char(\(\d+\))?$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^text$/,
		tsType: "string",
		defaultValue: '""',
	},

	// Boolean type
	{
		sqlPattern: /^boolean$/,
		tsType: "boolean",
		defaultValue: "false",
	},
	{
		sqlPattern: /^bool$/,
		tsType: "boolean",
		defaultValue: "false",
	},

	// Date/Time types
	{
		sqlPattern: /^timestamp(\(\d+\))?( with(out)? time zone)?$/,
		tsType: "string",
		defaultValue: "new Date().toISOString()",
	},
	{
		sqlPattern: /^date$/,
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[0]",
	},
	{
		sqlPattern: /^time(\(\d+\))?( with(out)? time zone)?$/,
		tsType: "string",
		defaultValue: "new Date().toISOString().split('T')[1]",
	},

	// UUID type
	{
		sqlPattern: /^uuid$/,
		tsType: "string",
		defaultValue: '""',
	},

	// JSON types
	{
		sqlPattern: /^json$/,
		tsType: "Record<string, unknown>",
		defaultValue: "{}",
	},
	{
		sqlPattern: /^jsonb$/,
		tsType: "Record<string, unknown>",
		defaultValue: "{}",
	},

	// Binary types
	{
		sqlPattern: /^bytea$/,
		tsType: "string",
		defaultValue: '""',
	},

	// Network address types
	{
		sqlPattern: /^inet$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^cidr$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^macaddr$/,
		tsType: "string",
		defaultValue: '""',
	},

	// Geometric types
	{
		sqlPattern: /^point$/,
		tsType: "string",
		defaultValue: '""',
	},
	{
		sqlPattern: /^line$/,
		tsType: "string",
		defaultValue: '""',
	},

	// Enum types
	{
		sqlPattern: /^enum$/,
		tsType: "string",
		defaultValue: '""',
	},

	// Fallback
	{
		sqlPattern: /.*/,
		tsType: "unknown",
		defaultValue: "undefined",
	},
];
