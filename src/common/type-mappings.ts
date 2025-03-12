// src/common/type-mappings.ts

import { SqlTypeCategory, TypeMapping } from "./types.ts";

/**
 * Comprehensive mapping for SQL types to TypeScript types.
 * Designed to match the sophistication of the Python implementation.
 */
export const SQL_TYPE_MAPPINGS: TypeMapping[] = [
	// Numeric types
	{
		sqlPattern: /^smallint$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^integer$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^bigint$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^decimal(\(\d+,\s*\d+\))?$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^numeric(\(\d+,\s*\d+\))?$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^real$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^double precision$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^serial$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},
	{
		sqlPattern: /^bigserial$/,
		tsType: "number",
		category: SqlTypeCategory.NUMERIC,
		defaultValue: "0",
	},

	// String types
	{
		sqlPattern: /^varchar(\(\d+\))?$/,
		tsType: "string",
		category: SqlTypeCategory.STRING,
		defaultValue: '""',
	},
	{
		sqlPattern: /^character varying(\(\d+\))?$/,
		tsType: "string",
		category: SqlTypeCategory.STRING,
		defaultValue: '""',
	},
	{
		sqlPattern: /^char(\(\d+\))?$/,
		tsType: "string",
		category: SqlTypeCategory.STRING,
		defaultValue: '""',
	},
	{
		sqlPattern: /^text$/,
		tsType: "string",
		category: SqlTypeCategory.STRING,
		defaultValue: '""',
	},

	// Boolean type
	{
		sqlPattern: /^boolean$/,
		tsType: "boolean",
		category: SqlTypeCategory.BOOLEAN,
		defaultValue: "false",
	},
	{
		sqlPattern: /^bool$/,
		tsType: "boolean",
		category: SqlTypeCategory.BOOLEAN,
		defaultValue: "false",
	},

	// Date/Time types
	{
		sqlPattern: /^timestamp(\(\d+\))?( with(out)? time zone)?$/,
		tsType: "string", // Use string for dates in TS
		category: SqlTypeCategory.TEMPORAL,
		defaultValue: "new Date().toISOString()",
	},
	{
		sqlPattern: /^date$/,
		tsType: "string",
		category: SqlTypeCategory.TEMPORAL,
		defaultValue: "new Date().toISOString().split('T')[0]",
	},
	{
		sqlPattern: /^time(\(\d+\))?( with(out)? time zone)?$/,
		tsType: "string",
		category: SqlTypeCategory.TEMPORAL,
		defaultValue: "new Date().toISOString().split('T')[1]",
	},

	// UUID type
	{
		sqlPattern: /^uuid$/,
		tsType: "string",
		category: SqlTypeCategory.UUID,
		defaultValue: '""',
	},

	// JSON types
	{
		sqlPattern: /^json$/,
		tsType: "Record<string, unknown>",
		category: SqlTypeCategory.JSON,
		defaultValue: "{}",
	},
	{
		sqlPattern: /^jsonb$/,
		tsType: "Record<string, unknown>",
		category: SqlTypeCategory.JSON,
		defaultValue: "{}",
	},

	// Binary types
	{
		sqlPattern: /^bytea$/,
		tsType: "string", // Used as base64 string
		category: SqlTypeCategory.BINARY,
		defaultValue: '""',
	},

	// Network address types
	{
		sqlPattern: /^inet$/,
		tsType: "string",
		category: SqlTypeCategory.NETWORK,
		defaultValue: '""',
	},
	{
		sqlPattern: /^cidr$/,
		tsType: "string",
		category: SqlTypeCategory.NETWORK,
		defaultValue: '""',
	},
	{
		sqlPattern: /^macaddr$/,
		tsType: "string",
		category: SqlTypeCategory.NETWORK,
		defaultValue: '""',
	},

	// Geometric types (all represented as strings)
	{
		sqlPattern: /^point$/,
		tsType: "string",
		category: SqlTypeCategory.GEOMETRIC,
		defaultValue: '""',
	},
	{
		sqlPattern: /^line$/,
		tsType: "string",
		category: SqlTypeCategory.GEOMETRIC,
		defaultValue: '""',
	},

	// Enum types (handled specially)
	{
		sqlPattern: /^enum$/,
		tsType: "string",
		category: SqlTypeCategory.ENUM,
		defaultValue: '""',
	},

	// Fallback
	{
		sqlPattern: /.*/,
		tsType: "unknown",
		category: SqlTypeCategory.OTHER,
		defaultValue: "undefined",
	},
];
