// src/tools/type-generator.ts
import { log } from "./logging.ts";
import {
	ColumnMetadata,
	EnumMetadata,
	SchemaMetadata,
	TableMetadata,
	ViewMetadata,
} from "../client/types.ts";
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
			for (const [tableName, table] of Object.entries(schema.tables)) {
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
			for (const [enumName, enumInfo] of Object.entries(schema.enums)) {
				content += this.generateEnum(enumInfo);
				content += "\n";
			}
		}

		// Generate function parameter and result types
		if (Object.keys(schema.functions).length > 0) {
			content += "// Function types\n";
			for (const [fnName, fn] of Object.entries(schema.functions)) {
				content += this.generateFunctionTypes(fn);
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
	generateFunctionTypes(fn: any): string {
		const baseName = this.toPascalCase(fn.name);
		let code = "";

		// Generate input parameters interface
		if (fn.parameters && fn.parameters.length > 0) {
			code += `export interface ${baseName}Params {\n`;

			for (const param of fn.parameters) {
				if (param.mode === "IN" || param.mode === "INOUT") {
					const tsType = this.mapSqlTypeToTs(param.type);
					const nullable = param.hasDefault ? "?" : "";

					code += `  ${param.name}${nullable}: ${tsType};\n`;
				}
			}

			code += "}\n\n";
		}

		// Generate result type
		if (fn.returnType) {
			// Handle different return types
			if (fn.returnType.includes("TABLE")) {
				code += this.generateTableFunctionResult(
					baseName,
					fn.returnType,
				);
			} else {
				const resultType = this.mapSqlTypeToTs(fn.returnType);
				code += `export type ${baseName}Result = ${resultType};\n`;
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
		code += `  order_by?: string;\n`;
		code += `  order_dir?: "asc" | "desc";\n`;

		// Add optional fields for each column
		for (const column of table.columns) {
			const tsType = this.mapSqlTypeToTs(column.type);
			code += `  ${column.name}?: ${tsType};\n`;
		}

		code += "}\n";
		return code;
	}

	/**
	 * Generate result type for table-returning functions
	 */
	private generateTableFunctionResult(
		baseName: string,
		returnType: string,
	): string {
		// Extract column definitions from TABLE(...) syntax
		const columnsMatch = returnType.match(/TABLE\s*\((.*)\)/i);

		if (!columnsMatch || !columnsMatch[1]) {
			return `export type ${baseName}Result = Record<string, unknown>;\n`;
		}

		const columnDefs = columnsMatch[1].split(",").map((c) => c.trim());
		let code = `export interface ${baseName}Result {\n`;

		for (const colDef of columnDefs) {
			const [name, type] = colDef.split(/\s+/, 2);
			if (name && type) {
				const tsType = this.mapSqlTypeToTs(type);
				code += `  ${name}: ${tsType};\n`;
			}
		}

		code += "}\n";
		return code;
	}

	/**
	 * Generate JSDoc comment for a column
	 */
	private generateColumnComment(column: ColumnMetadata): string {
		const comments = [];

		if (column.isPrimaryKey) {
			comments.push("Primary key");
		}

		if (column.references) {
			comments.push(
				`References ${column.references.schema}.${column.references.table}.${column.references.column}`,
			);
		}

		if (column.isEnum) {
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
