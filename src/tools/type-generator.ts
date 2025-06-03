// src/tools/type-generator.ts
import { log } from "./logging.ts";
import {
	ColumnMetadata,
	EnumMetadata,
	FunctionMetadata, // <-- Make sure this is the updated one
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
	// Assuming ReturnColumn might be needed for function return types
	// and FunctionParameter for function parameters, though they might be
	// accessed via the FunctionMetadata type itself.
} from "../client/types.ts"; // Ensure this path is correct
import {
	ArrayType,
	JsonType,
	SQL_TYPE_MAPPINGS,
} from "../common/type-mappings.ts";

/**
 * Enhanced TypeScript type generator for Prism-TS
 * Combines the best features from TS-Forge and Prism-TS
 */

export class TypeGenerator {
	/**
	 * Map SQL type to TypeScript type
	 */
	mapSqlTypeToTs(sqlType: string, sampleData?: unknown): string {
		// Normalize SQL type
		const normalizedType = sqlType.toLowerCase().replace(/\(\d+\)/, "")
			.trim();

		// Handle array types
		if (normalizedType.endsWith("[]")) {
			const baseType = normalizedType.slice(0, -2);
			const itemType = this.mapSqlTypeToTs(baseType);
			return new ArrayType(itemType).toString();
		}

		// Handle JSON types with sample data
		if (normalizedType === "jsonb" || normalizedType === "json") {
			return new JsonType(sampleData).toString();
		}

		// Match against mappings
		for (const mapping of SQL_TYPE_MAPPINGS) {
			if (mapping.sqlPattern.test(normalizedType)) {
				return mapping.tsType;
			}
		}

		// Fallback
		return "unknown";
	}

	/**
	 * Generate TypeScript types from schema metadata
	 */
	async generateTypes(
		schemas: SchemaMetadata[],
		outputDir: string = "./src/gen",
	): Promise<void> {
		log.info(`Generating TypeScript types in ${outputDir}`);

		try {
			// Ensure output directory exists
			try {
				await Deno.mkdir(outputDir, { recursive: true });
			} catch (err) {
				if (!(err instanceof Deno.errors.AlreadyExists)) {
					throw err;
				}
			}

			// Process each schema
			for (const schema of schemas) {
				const content = this.generateSchemaTypes(schema);

				// Write file for this schema
				const filename = `${outputDir}/types-${schema.name}.ts`;
				await Deno.writeTextFile(filename, content);
				log.debug(`Generated types for schema: ${schema.name}`);
			}

			// Generate index file
			await this.generateIndexFile(schemas, outputDir);

			log.info(
				`Successfully generated types for ${schemas.length} schemas`,
			);
		} catch (error) {
			log.error(`Error generating types: ${error}`);
			throw error;
		}
	}

	/**
	 * Generate types for a single schema with enhanced features
	 */
	generateSchemaTypes(schema: SchemaMetadata): string {
		let content = `/**
 * Generated TypeScript types for the "${schema.name}" schema
 * Generated on: ${new Date().toISOString()}
 */

`;

		// Generate table interfaces with enhanced typing
		if (Object.keys(schema.tables).length > 0) {
			content += "// Table interfaces\n";
			// The unused variable 'tableName' was here.
			// If it's not needed for logging or other logic, it's removed.
			// If it *was* intended for use, it would be `const [tableName, table]`
			for (const [, table] of Object.entries(schema.tables)) {
				content += this.generateTableInterface(table);
				content += "\n";

				// Generate query parameter type
				content += this.generateQueryInterface(table);
				content += "\n";
			}
		}

		// Generate view interfaces
		if (Object.keys(schema.views).length > 0) {
			content += "// View interfaces\n";
			for (const [, view] of Object.entries(schema.views)) {
				content += this.generateViewInterface(view);
				content += "\n";
			}
		}

		// Generate enum types
		if (Object.keys(schema.enums).length > 0) {
			content += "// Enum types\n";
			// The unused variable 'enumName' was here.
			// for (const [_enumName, enumInfo] of Object.entries(schema.enums)) {
			for (const [, enumInfo] of Object.entries(schema.enums)) {
				content += this.generateEnum(enumInfo);
				content += "\n";
			}
		}

		// Generate function parameter and result types
		if (Object.keys(schema.functions).length > 0) {
			content += "// Function types\n";
			// The unused variable 'fnName' was here.
			// for (const [_fnName, fn] of Object.entries(schema.functions)) {
			for (const [, fn] of Object.entries(schema.functions)) {
				content += this.generateFunctionTypes(fn);
				content += "\n";
			}
		}

		// Generate procedure types (if they are distinct in SchemaMetadata and have parameters/return)
		// Assuming procedures are also in `schema.procedures` and use `FunctionMetadata`
		if (schema.procedures && Object.keys(schema.procedures).length > 0) {
			content += "// Procedure types\n";
			for (const [, proc] of Object.entries(schema.procedures)) {
				content += this.generateFunctionTypes(proc, "Procedure"); // Pass a suffix
				content += "\n";
			}
		}

		return content;
	}

	/**
	 * Generate TypeScript interface for a table with enhanced typing
	 */
	generateTableInterface(table: TableMetadata): string {
		const interfaceName = this.toPascalCase(table.name);

		let code = `export interface ${interfaceName} {\n`;

		for (const column of table.columns) {
			// Get enhanced type with sample data support
			const tsType = this.mapSqlTypeToTs(column.type);
			const nullable = column.nullable ? "?" : "";
			const comment = this.generateColumnComment(column);

			if (comment) {
				code += `  /** ${comment} */\n`;
			}

			code += `  ${column.name}${nullable}: ${tsType};\n`;
		}

		code += "}\n";
		return code;
	}

	/**
	 * Generate TypeScript interface for view data
	 */
	generateViewInterface(view: ViewMetadata): string {
		const interfaceName = this.toPascalCase(view.name) + "View";

		let code = `export interface ${interfaceName} {\n`;

		for (const column of view.columns) {
			const tsType = this.mapSqlTypeToTs(column.type);
			const nullable = column.nullable ? "?" : "";
			// Views might not have detailed comments like PK/FK from direct table metadata
			// const comment = this.generateColumnComment(column);
			// if (comment) {
			// 	code += `  /** ${comment} */\n`;
			// }
			code += `  ${column.name}${nullable}: ${tsType};\n`;
		}

		code += "}\n";
		return code;
	}

	/**
	 * Generate TypeScript enum
	 */
	generateEnum(enumInfo: EnumMetadata): string {
		const enumName = this.toPascalCase(enumInfo.name);

		let code = `export enum ${enumName} {\n`;

		for (const value of enumInfo.values) {
			// Handle special characters in enum values
			const safeValue = this.sanitizeEnumValue(value);
			code += `  ${safeValue} = "${value}",\n`;
		}

		code += "}\n";
		return code;
	}

	/**
	 * Generate function input and output types
	 */
	// Changed `fn: any` to `fn: FunctionMetadata`
	generateFunctionTypes(fn: FunctionMetadata, suffix: string = ""): string {
		const baseName = this.toPascalCase(fn.name) + suffix;
		let code = "";

		// Generate input parameters interface
		if (fn.parameters && fn.parameters.length > 0) {
			// Filter for IN or INOUT parameters for the Params interface
			const inputParams = fn.parameters.filter((param) =>
				param.mode === "IN" || param.mode === "INOUT"
			);

			if (inputParams.length > 0) {
				code += `export interface ${baseName}Params {\n`;
				for (const param of inputParams) {
					const tsType = this.mapSqlTypeToTs(param.type);
					// A parameter is optional if it has a default value.
					// Or, if it's an OUT/INOUT param that might not be provided on input (though less common for pure input models).
					// For a *Params model, `has_default` is the primary driver for optionality.
					const nullable = param.has_default ? "?" : "";
					code += `  ${param.name}${nullable}: ${tsType};\n`;
				}
				code += "}\n\n";
			}
		}

		// Generate result type/interface
		// This needs to handle scalar returns, set returns (arrays), and table returns (objects or arrays of objects)
		if (fn.return_type && fn.return_type.toLowerCase() !== "void") {
			if (fn.return_columns && fn.return_columns.length > 0) {
				// This is a table-returning function (or setof record where columns are defined)
				code += `export interface ${baseName}ResultRow {\n`;
				for (const col of fn.return_columns) {
					const tsType = this.mapSqlTypeToTs(col.type);
					// Columns in a result row are generally not nullable unless the SQL type itself implies it (which mapSqlTypeToTs handles)
					// Or if the function can return partial rows (less common for SQL functions).
					// Assuming columns are present.
					code += `  ${col.name}: ${tsType};\n`;
				}
				code += "}\n\n";

				// If the function returns a set (multiple rows), the result is an array of these rows.
				// Otherwise, it's a single row object (or potentially null/undefined if no row is returned).
				// `fn.type` from FunctionMetadata ("scalar", "table", "set") helps here.
				if (fn.type === "set" || fn.type === "table") { // "table" often implies setof records
					code +=
						`export type ${baseName}Result = ${baseName}ResultRow[];\n`;
				} else { // Assuming scalar returning a single complex record
					code +=
						`export type ${baseName}Result = ${baseName}ResultRow | null;\n`; // Or undefined
				}
			} else {
				// Scalar or setof scalar return type
				const resultTsType = this.mapSqlTypeToTs(fn.return_type);
				if (fn.type === "set") {
					code +=
						`export type ${baseName}Result = ${resultTsType}[];\n`;
				} else { // scalar
					code +=
						`export type ${baseName}Result = ${resultTsType} | null;\n`; // Or undefined
				}
			}
		} else if (
			fn.object_type === "procedure" &&
			(!fn.return_type || fn.return_type.toLowerCase() === "void")
		) {
			// Procedures might not have an explicit return type in the same way functions do.
			// If they have OUT/INOUT parameters, those form the "result".
			const outParams = fn.parameters.filter((param) =>
				param.mode === "OUT" || param.mode === "INOUT"
			);
			if (outParams.length > 0) {
				code += `export interface ${baseName}Result {\n`;
				for (const param of outParams) {
					const tsType = this.mapSqlTypeToTs(param.type);
					// OUT params are part of the result, nullability depends on SQL type.
					code += `  ${param.name}: ${tsType};\n`;
				}
				code += "}\n\n";
			} else {
				// Procedure with no OUT params and void return.
				code += `export type ${baseName}Result = void;\n`;
			}
		}

		return code;
	}

	/**
	 * Generate query interface for filtering
	 */
	generateQueryInterface(table: TableMetadata): string {
		const baseName = this.toPascalCase(table.name);

		let code = `export interface ${baseName}QueryParams {\n`;
		code += `  limit?: number;\n`;
		code += `  offset?: number;\n`;
		code += `  order_by?: string;\n`; // Consider making this keyof ${baseName} if possible, but that's complex with aliases/DB names
		code += `  order_dir?: "asc" | "desc";\n`;

		// Add optional fields for each column
		for (const column of table.columns) {
			const tsType = this.mapSqlTypeToTs(column.type);
			// For query params, all filterable fields are optional.
			code += `  ${column.name}?: ${tsType} | null;\n`; // Allow null for explicit null checks if API supports it
		}

		code += "}\n";
		return code;
	}

	// Removed generateTableFunctionResult as its logic should be integrated into generateFunctionTypes
	// based on `fn.return_columns` and `fn.type`.

	/**
	 * Generate JSDoc comment for a column
	 */
	private generateColumnComment(column: ColumnMetadata): string {
		const comments = [];

		// Use the updated 'is_pk'
		if (column.is_pk) {
			comments.push("Primary key");
		}

		if (column.references) {
			comments.push(
				`References ${column.references.schema}.${column.references.table}.${column.references.column}`,
			);
		}

		// Use the updated 'is_enum'
		if (column.is_enum) {
			comments.push("Enum type");
		}

		return comments.join(". ");
	}

	/**
	 * Convert a string to PascalCase
	 */
	toPascalCase(str: string): string {
		return str
			.split(/[^a-zA-Z0-9]+/)
			.map((word) =>
				word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			)
			.join("");
	}

	/**
	 * Sanitize enum value for use as TypeScript identifier
	 */
	private sanitizeEnumValue(value: string): string {
		// Replace invalid characters with underscores
		let safeValue = value.replace(/[^a-zA-Z0-9_]/g, "_");

		// Ensure it doesn't start with a number
		if (/^[0-9]/.test(safeValue)) {
			safeValue = "_" + safeValue;
		}
		// Handle keywords by prefixing (more robustly later, this is basic)
		if (
			["delete", "default", "public", "private", "enum"].includes(
				safeValue.toLowerCase(),
			)
		) {
			safeValue = `_${safeValue}`;
		}

		return safeValue;
	}

	/**
	 * Generate index file that exports all types
	 */
	async generateIndexFile(
		schemas: SchemaMetadata[],
		outputDir: string,
	): Promise<void> {
		let content = `/**
 * Index file for generated TypeScript types
 * Generated on: ${new Date().toISOString()}
 */

`;

		// Add exports for each schema
		for (const schema of schemas) {
			content += `export * from './types-${schema.name}';\n`;
		}

		// Write the index file
		const filename = `${outputDir}/index.ts`;
		await Deno.writeTextFile(filename, content);
		log.debug(`Generated index file: ${filename}`);
	}
}
