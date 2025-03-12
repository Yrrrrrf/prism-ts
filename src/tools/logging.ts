/**
 * Advanced logging utilities for the Prism TypeScript framework.
 * Designed to match the functionality of the Python logging module.
 */

// ===== Color and Style Codes =====

/**
 * ANSI color and style codes.
 */
export enum ColorCode {
	// Styles
	RESET = "0",
	BOLD = "1",
	DIM = "2",
	ITALIC = "3",
	UNDERLINE = "4",
	BLINK = "5",
	REVERSE = "7",
	STRIKE = "9",

	// Colors (foreground)
	BLACK = "30",
	RED = "31",
	GREEN = "32",
	YELLOW = "33",
	BLUE = "34",
	MAGENTA = "35",
	CYAN = "36",
	WHITE = "37",

	// Bright colors
	BRIGHT_BLACK = "90",
	BRIGHT_RED = "91",
	BRIGHT_GREEN = "92",
	BRIGHT_YELLOW = "93",
	BRIGHT_BLUE = "94",
	BRIGHT_MAGENTA = "95",
	BRIGHT_CYAN = "96",
	BRIGHT_WHITE = "97",
}

/**
 * Apply ANSI color/style codes to text.
 */
export function colorize(
	text: string,
	...codes: (ColorCode | string)[]
): string {
	if (!codes.length) return text;

	const codesStr = codes
		.map((c) => typeof c === "string" ? c : c as string)
		.join(";");

	return `\x1b[${codesStr}m${text}\x1b[0m`;
}

// Cache for color functions to improve performance
const colorFnCache = new Map<string, (text: string) => string>();

/**
 * Create a reusable color function for the given code.
 */
function createColorFn(code: ColorCode | string): (text: string) => string {
	const codeKey = typeof code === "string" ? code : code as string;

	if (!colorFnCache.has(codeKey)) {
		colorFnCache.set(codeKey, (text: string) => colorize(text, code));
	}

	return colorFnCache.get(codeKey)!;
}

// ===== Style Functions =====

// Basic styles
export const bold = createColorFn(ColorCode.BOLD);
export const dim = createColorFn(ColorCode.DIM);
export const italic = createColorFn(ColorCode.ITALIC);
export const underline = createColorFn(ColorCode.UNDERLINE);
export const strike = createColorFn(ColorCode.STRIKE);

// Basic colors
export const black = createColorFn(ColorCode.BLACK);
export const green = createColorFn(ColorCode.GREEN);
export const yellow = createColorFn(ColorCode.YELLOW);
export const blue = createColorFn(ColorCode.BLUE);
export const cyan = createColorFn(ColorCode.CYAN);
export const white = createColorFn(ColorCode.WHITE);

// Custom RGB colors that match Python implementation
export const violet = (s: string) => `\x1b[38;2;138;43;226m${s}\x1b[0m`;
export const indigo = (s: string) => `\x1b[38;2;75;0;130m${s}\x1b[0m`;
export const orange = (s: string) => `\x1b[38;2;255;165;0m${s}\x1b[0m`;
export const red = (s: string) => `\x1b[38;2;255;0;0m${s}\x1b[0m`;
export const pink = (s: string) => `\x1b[38;2;255;192;203m${s}\x1b[0m`;

// Bright colors
export const brightBlack = createColorFn(ColorCode.BRIGHT_BLACK);
export const brightRed = createColorFn(ColorCode.BRIGHT_RED);
export const brightGreen = createColorFn(ColorCode.BRIGHT_GREEN);
export const brightYellow = createColorFn(ColorCode.BRIGHT_YELLOW);
export const brightBlue = createColorFn(ColorCode.BRIGHT_BLUE);
export const brightMagenta = createColorFn(ColorCode.BRIGHT_MAGENTA);
export const brightCyan = createColorFn(ColorCode.BRIGHT_CYAN);
export const brightWhite = createColorFn(ColorCode.BRIGHT_WHITE);

// Combined styles
export const errorStyle = (text: string) =>
	colorize(text, ColorCode.BOLD, ColorCode.RED);
export const successStyle = (text: string) =>
	colorize(text, ColorCode.BOLD, ColorCode.GREEN);
export const warningStyle = (text: string) =>
	colorize(text, ColorCode.BOLD, ColorCode.YELLOW);
export const infoStyle = (text: string) =>
	colorize(text, ColorCode.BOLD, ColorCode.BLUE);

// ===== Database Element Color Palette =====

/**
 * Color palette for database elements, matching the Python implementation.
 */
export const colorPalette: Record<string, (text: string) => string> = {
	table: blue,
	view: green,
	enum: violet,
	function: red,
	procedure: orange,
	trigger: pink,
	schema: brightCyan,
	column: (x: string) => x, // Default (no color)
	pk: yellow,
	fk: brightBlue,
	type: dim,
};

// ===== Text Utilities =====

/**
 * Calculate visible length of string with ANSI codes removed.
 */
export function getAnsiLength(text: string): number {
	// Using RegExp constructor to avoid control char linting issues
	const ansiPattern = new RegExp(
		"\u001b(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])",
		"g",
	);
	return text.replace(ansiPattern, "").length;
}

/**
 * Pad string with spaces, accounting for ANSI color codes.
 */
export function padStr(
	text: string,
	length: number,
	align: "left" | "right" | "center" = "left",
): string {
	const visibleLength = getAnsiLength(text);
	const padding = Math.max(0, length - visibleLength);

	switch (align) {
		case "right": {
			return " ".repeat(padding) + text;
		}
		case "center": {
			const leftPad = Math.floor(padding / 2);
			const rightPad = padding - leftPad;
			return " ".repeat(leftPad) + text + " ".repeat(rightPad);
		}
		default: { // left
			return text + " ".repeat(padding);
		}
	}
}

// ===== Logging System =====

/**
 * Log levels with associated colors and severity values.
 */
export enum LogLevel {
	TRACE = 0,
	DEBUG = 1,
	INFO = 2,
	WARNING = 4,
	ERROR = 5,
	NONE = 100, // Special level to disable all logging
}

/**
 * Check if terminal features are available in the current environment
 */
function detectTerminalSupport(): boolean {
	if (typeof Deno !== "undefined") {
		// In Deno environment
		return Deno.stdout.isTerminal();
	}

	// In browser or other environments, typically no terminal support
	return false;
}

/**
 * Enhanced logger with ANSI color support, timing utilities, and level filtering.
 */
export class Logger {
	private moduleName: string;
	private indentLevel: number;
	private showTimestamp: boolean;
	private level: LogLevel;
	private enableConsole: boolean;
	private isTerminal: boolean;

	constructor(options: {
		moduleName?: string;
		level?: LogLevel;
		enableConsole?: boolean;
		showTimestamp?: boolean;
	} = {}) {
		this.moduleName = options.moduleName || "prism-ts";
		this.indentLevel = 0;
		this.showTimestamp = options.showTimestamp !== false;
		this.level = options.level || LogLevel.INFO;
		this.enableConsole = options.enableConsole !== false;

		// Detect terminal support for colors
		this.isTerminal = detectTerminalSupport();
	}

	/**
	 * Set the minimum log level to display.
	 */
	setLevel(level: LogLevel | string): void {
		if (typeof level === "string") {
			const levelKey = level.toUpperCase() as keyof typeof LogLevel;
			if (LogLevel[levelKey] === undefined) {
				const validLevels = Object.keys(LogLevel)
					.filter((k) => isNaN(Number(k)))
					.join(", ");
				throw new Error(
					`Invalid log level: ${level}. Valid levels are: ${validLevels}`,
				);
			}
			this.level = LogLevel[levelKey] as unknown as LogLevel;
		} else {
			this.level = level;
		}
	}

	/**
	 * Format log message with consistent styling.
	 */
	private formatMsg(level: LogLevel, message: string): string {
		const timestamp = this.showTimestamp
			? `${
				dim(new Date().toISOString().replace("T", " ").split(".")[0])
			} `
			: "";

		const indent = "  ".repeat(this.indentLevel);
		let levelStr: string;

		switch (level) {
			case LogLevel.TRACE: {
				levelStr = dim(`[TRACE]`);
				break;
			}
			case LogLevel.DEBUG: {
				levelStr = colorize(
					`[DEBUG]`,
					ColorCode.DIM,
					ColorCode.MAGENTA,
				);
				break;
			}
			case LogLevel.INFO: {
				levelStr = blue(`[INFO]`);
				break;
			}
			case LogLevel.WARNING: {
				levelStr = yellow(`[WARNING]`);
				break;
			}
			case LogLevel.ERROR: {
				levelStr = red(`[ERROR]`);
				break;
			}
			default: {
				const levelName = LogLevel[level] || "UNKNOWN";
				levelStr = `[${levelName}]`;
			}
		}

		const moduleStr = cyan(`[${this.moduleName}]`);
		return `${
			italic(timestamp)
		}${levelStr} ${moduleStr} ${indent}${message}`;
	}

	/**
	 * Log a message with the specified level if it meets the threshold.
	 */
	log(level: LogLevel, message: string): void {
		if (!this.enableConsole || level < this.level) {
			return;
		}

		console.log(this.formatMsg(level, message));
	}

	/**
	 * Print a simple message without timestamp, level, or module name.
	 * Only shows if log level is TRACE or lower.
	 */
	simple(message: string): void {
		if (!this.enableConsole || this.level > LogLevel.TRACE) {
			return;
		}
		console.log(message);
	}

	/**
	 * Log a trace message.
	 */
	trace(message: string): void {
		this.log(LogLevel.TRACE, message);
	}

	/**
	 * Log a debug message.
	 */
	debug(message: string): void {
		this.log(LogLevel.DEBUG, message);
	}

	/**
	 * Log an info message.
	 */
	info(message: string): void {
		this.log(LogLevel.INFO, message);
	}

	/**
	 * Log a warning message.
	 */
	warn(message: string): void {
		this.log(LogLevel.WARNING, message);
	}

	/**
	 * Log an error message.
	 */
	error(message: string): void {
		this.log(LogLevel.ERROR, message);
	}

	/**
	 * Temporarily increase indentation for a block of code.
	 */
	indented<T>(fn: () => T, levels: number = 1): T {
		this.indentLevel += levels;
		try {
			return fn();
		} finally {
			this.indentLevel = Math.max(0, this.indentLevel - levels);
		}
	}

	/**
	 * Time an operation and log its duration.
	 */
	async timed<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		const startTime = Date.now();
		this.info(`Starting ${operation}...`);
		try {
			const result = await fn();
			const elapsed = (Date.now() - startTime) / 1000;
			this.debug(`${operation} completed in ${elapsed.toFixed(2)}s`);
			return result;
		} catch (error) {
			const elapsed = (Date.now() - startTime) / 1000;
			this.error(
				`${operation} failed after ${elapsed.toFixed(2)}s: ${
					(error as Error).message || String(error)
				}`,
			);
			throw error;
		}
	}

	/**
	 * Enable or disable console output.
	 */
	toggleConsole(enabled: boolean = true): void {
		this.enableConsole = enabled;
	}

	/**
	 * Print a section header.
	 */
	section(title: string): void {
		if (!this.enableConsole || this.level > LogLevel.INFO) {
			return;
		}

		const header = `${"=".repeat(50)}\n${title}\n${"=".repeat(50)}`;
		console.log(`\n${brightWhite(header)}`);
	}

	/**
	 * Print a formatted table with headers and rows.
	 */
	table(headers: string[], rows: unknown[][], widths?: number[]): void {
		if (!this.enableConsole || this.level > LogLevel.INFO) {
			return;
		}

		if (!widths) {
			// Calculate widths based on content
			widths = Array.from({ length: headers.length }, (_, i) => {
				return Math.max(
					getAnsiLength(String(headers[i])),
					...rows.map((row) => getAnsiLength(String(row[i] || ""))),
				);
			});
		}

		// Top border
		const borderTop = "┌" + widths.map((w) => "─".repeat(w + 2)).join("┬") +
			"┐";
		console.log(borderTop);

		// Header row
		const headerCells = headers.map((h, i) =>
			padStr(brightWhite(String(h)), widths![i])
		);
		console.log("│ " + headerCells.join(" │ ") + " │");

		// Separator
		const separator = "├" + widths.map((w) => "─".repeat(w + 2)).join("┼") +
			"┤";
		console.log(separator);

		// Data rows
		for (const row of rows) {
			const cells = row.map((cell, i) =>
				padStr(String(cell || ""), widths![i])
			);
			console.log("│ " + cells.join(" │ ") + " │");
		}

		// Bottom border
		const borderBottom = "└" +
			widths.map((w) => "─".repeat(w + 2)).join("┴") + "┘";
		console.log(borderBottom);
	}
}

// Create a shared logger instance (default level is INFO)
export const log: Logger = new Logger();

// Example of how to change log level
// log.setLevel(LogLevel.DEBUG);  // Show debug messages and above
// log.setLevel("WARNING");       // Show only warnings and above
// log.setLevel(LogLevel.NONE);   // Disable all logging
