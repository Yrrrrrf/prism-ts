// tests/type-mapping-test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { TypeGenerator } from "../src/tools/type-generator.ts";
import { // Import the necessary types for mocks
	EnumMetadata,
	FunctionMetadata,
	TableMetadata,
	// ColumnMetadata might be needed if you test deeper parts of TableMetadata generation
} from "../src/client/types.ts";

// Create an instance of TypeGenerator to use its methods
const typeGenerator = new TypeGenerator();

Deno.test("SQL Type Mapping - Basic Types", () => {
	// Test basic SQL types
	assertEquals(typeGenerator.mapSqlTypeToTs("integer"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("boolean"), "boolean");
	assertEquals(typeGenerator.mapSqlTypeToTs("timestamp"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("uuid"), "string");
});

Deno.test("SQL Type Mapping - Types with Length Specifiers", () => {
	// Test SQL types with length/precision
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar(255)"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("numeric(10,2)"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("decimal(16,4)"), "number");
	assertEquals(typeGenerator.mapSqlTypeToTs("char(1)"), "string");
});

Deno.test("SQL Type Mapping - Array Types", () => {
	// Test array type handling
	assertEquals(typeGenerator.mapSqlTypeToTs("integer[]"), "number[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("varchar[]"), "string[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("text[]"), "string[]");
	assertEquals(typeGenerator.mapSqlTypeToTs("uuid[]"), "string[]");
});

Deno.test("SQL Type Mapping - Special Types", () => {
	// Test special types
	assertEquals(
		typeGenerator.mapSqlTypeToTs("jsonb"),
		"Record<string, unknown>",
	);
	assertEquals(
		typeGenerator.mapSqlTypeToTs("json"),
		"Record<string, unknown>",
	);
	assertEquals(typeGenerator.mapSqlTypeToTs("bytea"), "string");
});

Deno.test("SQL Type Mapping - Time/Date Types", () => {
	// Test time and date types
	assertEquals(
		typeGenerator.mapSqlTypeToTs("timestamp without time zone"),
		"string",
	);
	assertEquals(
		typeGenerator.mapSqlTypeToTs("timestamp with time zone"),
		"string",
	);
	assertEquals(typeGenerator.mapSqlTypeToTs("time"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("date"), "string");
});

Deno.test("SQL Type Mapping - Unusual/Edge Cases", () => {
	// Test unusual types and edge cases
	assertEquals(typeGenerator.mapSqlTypeToTs("unknown_type"), "unknown");
	assertEquals(typeGenerator.mapSqlTypeToTs(""), "unknown");
	assertEquals(typeGenerator.mapSqlTypeToTs("cidr"), "string");
	assertEquals(typeGenerator.mapSqlTypeToTs("point"), "string");
});

Deno.test("TypeGenerator - Generate Table Interface", () => {
	// Create mock table data
	const mockTable: TableMetadata = { // Added type annotation
		name: "users",
		schema: "public",
		columns: [
			{
				name: "id",
				type: "uuid",
				nullable: false,
				is_pk: true, // Use is_pk
				is_enum: false, // Use is_enum
				references: undefined,
			},
			{
				name: "username",
				type: "varchar",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
			{
				name: "email",
				type: "varchar",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
			{
				name: "is_active",
				type: "boolean",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
			{
				name: "created_at",
				type: "timestamp",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
			{
				name: "profile",
				type: "jsonb",
				nullable: true,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
		],
	};

	// Generate interface
	const result = typeGenerator.generateTableInterface(mockTable);

	// Check interface structure
	assertEquals(result.includes("export interface Users {"), true);
	assertEquals(result.includes("/** Primary key */"), true); // Check for comment
	assertEquals(result.includes("id: string;"), true);
	assertEquals(result.includes("username: string;"), true);
	assertEquals(result.includes("email: string;"), true);
	assertEquals(result.includes("is_active: boolean;"), true);
	assertEquals(result.includes("created_at: string;"), true);
	assertEquals(result.includes("profile?: Record<string, unknown>;"), true);
});

Deno.test("TypeGenerator - Generate Enum", () => {
	// Create mock enum data
	const mockEnum: EnumMetadata = { // Added type annotation
		name: "user_status",
		schema: "public",
		values: ["active", "inactive", "pending"],
	};

	// Generate enum
	const result = typeGenerator.generateEnum(mockEnum);

	// Check enum structure
	assertEquals(result.includes("export enum UserStatus {"), true);
	assertEquals(result.includes('active = "active",'), true);
	assertEquals(result.includes('inactive = "inactive",'), true);
	assertEquals(result.includes('pending = "pending",'), true);
});

Deno.test("TypeGenerator - Generate Query Interface", () => {
	// Create mock table data
	const mockTable: TableMetadata = { // Added type annotation
		name: "products",
		schema: "public",
		columns: [
			{
				name: "id",
				type: "uuid",
				nullable: false,
				is_pk: true,
				is_enum: false,
				references: undefined,
			},
			{
				name: "name",
				type: "varchar",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
			{
				name: "price",
				type: "numeric",
				nullable: false,
				is_pk: false,
				is_enum: false,
				references: undefined,
			},
		],
	};

	// Generate query interface
	const result = typeGenerator.generateQueryInterface(mockTable);

	// Check interface structure
	assertEquals(
		result.includes("export interface ProductsQueryParams {"),
		true,
	);
	assertEquals(result.includes("limit?: number;"), true);
	assertEquals(result.includes("offset?: number;"), true);
	assertEquals(result.includes("order_by?: string;"), true);
	assertEquals(result.includes('order_dir?: "asc" | "desc";'), true);
	assertEquals(result.includes("id?: string | null;"), true); // updated to reflect generator change
	assertEquals(result.includes("name?: string | null;"), true);
	assertEquals(result.includes("price?: number | null;"), true);
});

Deno.test("TypeGenerator - PascalCase Conversion", () => {
	// Test various names
	assertEquals(typeGenerator.toPascalCase("user_profiles"), "UserProfiles");
	assertEquals(typeGenerator.toPascalCase("api-keys"), "ApiKeys");
	assertEquals(typeGenerator.toPascalCase("simple"), "Simple");
	assertEquals(
		typeGenerator.toPascalCase("CamelCaseAlready"),
		"Camelcasealready", // PascalCase converts to all lowercase then capitalizes first letter of each word
	);
	assertEquals(
		typeGenerator.toPascalCase("snake_case_name"),
		"SnakeCaseName",
	);
});

Deno.test("TypeGenerator - Generate Function Types (Scalar Return)", () => {
	// Create mock function data
	const mockFunction: FunctionMetadata = { // Added type annotation and missing fields
		name: "get_user_by_id",
		schema: "public",
		type: "scalar", // Added
		object_type: "function", // Added
		is_strict: false, // Added
		return_type: "json", // This will map to Record<string, unknown>
		parameters: [
			{
				name: "user_id",
				type: "uuid",
				mode: "IN",
				has_default: false,
				default_value: null,
			},
		],
		description: "Fetches a user by their ID.",
		return_columns: null, // Explicitly null for non-table returns
	};

	// Generate function types
	const result = typeGenerator.generateFunctionTypes(mockFunction);

	// Check result structure
	assertEquals(result.includes("export interface GetUserByIdParams {"), true);
	assertEquals(result.includes("user_id: string;"), true);
	// Based on the updated TypeGenerator logic for scalar returning json
	assertEquals(
		result.includes(
			"export type GetUserByIdResult = Record<string, unknown> | null;", // Updated expected type
		),
		true,
	);
});

Deno.test("TypeGenerator - Generate Function Types (Table Return)", () => {
	// Create mock function with TABLE return type
	const mockFunction: FunctionMetadata = { // Added type annotation and missing fields
		name: "get_users",
		schema: "public",
		type: "table", // "table" indicates it might return multiple rows
		object_type: "function",
		is_strict: false,
		// For `return_columns` to be used, `return_type` itself can be more generic
		// or specific. The `return_columns` field is key.
		return_type: "SETOF record", // Or just "record", or even "TABLE(...)" - TypeGenerator prioritizes return_columns
		parameters: [],
		return_columns: [ // This is what TypeGenerator will use to build the ResultRow
			{ name: "id", type: "uuid" },
			{ name: "username", type: "varchar" },
			{ name: "email", type: "varchar" },
		],
		description: "Fetches all users.",
	};

	// Generate function types
	const result = typeGenerator.generateFunctionTypes(mockFunction);

	// Check result structure based on updated TypeGenerator
	assertEquals(result.includes("export interface GetUsersResultRow {"), true);
	assertEquals(result.includes("id: string;"), true);
	assertEquals(result.includes("username: string;"), true);
	assertEquals(result.includes("email: string;"), true);
	assertEquals(
		result.includes("export type GetUsersResult = GetUsersResultRow[];"),
		true,
	);
});

Deno.test("TypeGenerator - Generate Function Types (Procedure with OUT params)", () => {
	const mockProcedure: FunctionMetadata = {
		name: "update_user_status",
		schema: "public",
		type: "scalar", // Procedures are often scalar in terms of direct SQL return, but "result" is via OUT params
		object_type: "procedure",
		is_strict: false,
		return_type: "void", // Procedures typically return void
		parameters: [
			{
				name: "p_user_id",
				type: "uuid",
				mode: "IN",
				has_default: false,
				default_value: null,
			},
			{
				name: "p_new_status",
				type: "varchar",
				mode: "IN",
				has_default: false,
				default_value: null,
			},
			{
				name: "o_updated_count",
				type: "integer",
				mode: "OUT",
				has_default: false,
				default_value: null,
			},
			{
				name: "o_message",
				type: "text",
				mode: "OUT",
				has_default: false,
				default_value: null,
			},
		],
		description: "Updates a user's status and returns a message.",
		return_columns: null,
	};

	const result = typeGenerator.generateFunctionTypes(
		mockProcedure,
		"Procedure",
	);

	assertEquals(
		result.includes("export interface UpdateUserStatusProcedureParams {"),
		true,
	);
	assertEquals(result.includes("p_user_id: string;"), true);
	assertEquals(result.includes("p_new_status: string;"), true);

	assertEquals(
		result.includes("export interface UpdateUserStatusProcedureResult {"),
		true,
	);
	assertEquals(result.includes("o_updated_count: number;"), true);
	assertEquals(result.includes("o_message: string;"), true);
});
