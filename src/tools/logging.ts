/**
 * Logging utilities for Prism-TS
 */

// ANSI color codes
const COLORS = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	italic: "\x1b[3m",
	underline: "\x1b[4m",

	// Foreground colors
	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",

	// Background colors
	bgBlack: "\x1b[40m",
	bgRed: "\x1b[41m",
	bgGreen: "\x1b[42m",
	bgYellow: "\x1b[43m",
	bgBlue: "\x1b[44m",
	bgMagenta: "\x1b[45m",
	bgCyan: "\x1b[46m",
	bgWhite: "\x1b[47m",
};

// Text coloring functions
export const color = {
	// Styles
	bold: (text: string) => `${COLORS.bold}${text}${COLORS.reset}`,
	dim: (text: string) => `${COLORS.dim}${text}${COLORS.reset}`,
	italic: (text: string) => `${COLORS.italic}${text}${COLORS.reset}`,
	underline: (text: string) => `${COLORS.underline}${text}${COLORS.reset}`,

	// Colors
	black: (text: string) => `${COLORS.black}${text}${COLORS.reset}`,
	red: (text: string) => `${COLORS.red}${text}${COLORS.reset}`,
	green: (text: string) => `${COLORS.green}${text}${COLORS.reset}`,
	yellow: (text: string) => `${COLORS.yellow}${text}${COLORS.reset}`,
	blue: (text: string) => `${COLORS.blue}${text}${COLORS.reset}`,
	magenta: (text: string) => `${COLORS.magenta}${text}${COLORS.reset}`,
	cyan: (text: string) => `${COLORS.cyan}${text}${COLORS.reset}`,
	white: (text: string) => `${COLORS.white}${text}${COLORS.reset}`,

	// Combined styles
	error: (text: string) =>
		`${COLORS.bold}${COLORS.red}${text}${COLORS.reset}`,
	success: (text: string) =>
		`${COLORS.bold}${COLORS.green}${text}${COLORS.reset}`,
	warning: (text: string) =>
		`${COLORS.bold}${COLORS.yellow}${text}${COLORS.reset}`,
	info: (text: string) =>
		`${COLORS.bold}${COLORS.blue}${text}${COLORS.reset}`,
};

// Database-element color scheme (matches Prism-PY)
export const dbColors = {
	table: color.blue,
	view: color.green,
	column: (text: string) => text, // No color
	enum: color.magenta,
	function: color.red,
	procedure: color.yellow,
	trigger: color.cyan,
	schema: color.bold,
};

// Log levels
export enum LogLevel {
	TRACE = 0,
	DEBUG = 1,
	INFO = 2,
	WARN = 3,
	ERROR = 4,
	NONE = 5,
}

/**
 * Logger class for Prism-TS
 */
export class Logger {
	private level: LogLevel;
	private prefix: string;
	private indentLevel = 0;

	constructor(options: {
		level?: LogLevel;
		prefix?: string;
	} = {}) {
		this.level = options.level ?? LogLevel.INFO;
		this.prefix = options.prefix ?? "Prism-TS";
	}

	/**
	 * Set the log level
	 */
	setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Format a log message
	 */
	private format(
		level: string,
		colorFn: (text: string) => string,
		message: string,
	): string {
		const timestamp = new Date().toISOString();
		const indent = "  ".repeat(this.indentLevel);
		const formattedLevel = colorFn(`[${level}]`);
		const formattedPrefix = color.cyan(`[${this.prefix}]`);

		return `${
			color.dim(timestamp)
		} ${formattedLevel} ${formattedPrefix} ${indent}${message}`;
	}

	/**
	 * Log a trace message
	 */
	trace(message: string): void {
		if (this.level <= LogLevel.TRACE) {
			console.log(this.format("TRACE", color.dim, message));
		}
	}

	/**
	 * Log a debug message
	 */
	debug(message: string): void {
		if (this.level <= LogLevel.DEBUG) {
			console.log(this.format("DEBUG", color.magenta, message));
		}
	}

	/**
	 * Log an info message
	 */
	info(message: string): void {
		if (this.level <= LogLevel.INFO) {
			console.log(this.format("INFO", color.blue, message));
		}
	}

	/**
	 * Log a warning message
	 */
	warn(message: string): void {
		if (this.level <= LogLevel.WARN) {
			console.log(this.format("WARN", color.yellow, message));
		}
	}

	/**
	 * Log an error message
	 */
	error(message: string): void {
		if (this.level <= LogLevel.ERROR) {
			console.log(this.format("ERROR", color.red, message));
		}
	}

	/**
	 * Increase indentation level
	 */
	indent(levels = 1): void {
		this.indentLevel += levels;
	}

	/**
	 * Decrease indentation level
	 */
	outdent(levels = 1): void {
		this.indentLevel = Math.max(0, this.indentLevel - levels);
	}

	/**
	 * Log a section header
	 */
	section(title: string): void {
		if (this.level <= LogLevel.INFO) {
			const separator = "=".repeat(50);
			console.log(`\n${color.bold(separator)}`);
			console.log(color.bold(title));
			console.log(`${color.bold(separator)}\n`);
		}
	}

	/**
	 * Measure execution time of an async function
	 */
	async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
		if (this.level <= LogLevel.DEBUG) {
			const start = Date.now();
			this.debug(`Starting: ${label}`);

			try {
				const result = await fn();
				const duration = Date.now() - start;
				this.debug(`Completed: ${label} (${duration}ms)`);
				return result;
			} catch (error) {
				const duration = Date.now() - start;
				this.error(
					`Failed: ${label} (${duration}ms): ${error.message}`,
				);
				throw error;
			}
		} else {
			return fn();
		}
	}
}

// Create a default logger instance
export const log = new Logger();
