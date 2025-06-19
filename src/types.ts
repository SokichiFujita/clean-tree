import { Stats } from 'fs';
import { Ignore } from 'ignore';

// --- CLI-related type definitions ---

export interface TreeOptions {
  path: string;
  depth?: number;
  exclude?: string;
  gitignore: boolean;
  /**
   * Respect ignore rules from any .*ignore files (e.g., .gitignore, .npmignore)
   */
  allignore: boolean;
}

// --- File and directory related type definitions ---

export interface FileEntry {
  name: string;
  fullPath: string;
  isDirectory: boolean;
  isLast: boolean;
  stats?: Stats;
}

export interface TreeStats {
  dirCount: number;
  fileCount: number;
}

export interface DirectoryContents {
  entries: FileEntry[];
  hasErrors: boolean;
  errorMessage?: string;
}

// --- Configuration-related type definitions ---

export interface TreeGeneratorConfig {
  startPath: string;
  maxDepth: number;
  ignoreRules: Ignore;
  displayOptions: DisplayOptions;
}

export interface DisplayOptions {
  showHidden: boolean;
  colorOutput: boolean;
  showSize: boolean;
  showPermissions: boolean;
}

// --- Error-related type definitions ---

export class TreeError extends Error {
  /**
   * Optional original error cause
   */
  public cause?: Error;
  constructor(
    message: string,
    public readonly code: string,
    public readonly path?: string
  ) {
    super(message);
    this.name = 'TreeError';
  }
}

export class FileAccessError extends TreeError {
  constructor(path: string, originalError: Error) {
    super(`Cannot access file or directory: ${path}`, 'FILE_ACCESS_ERROR', path);
    this.cause = originalError;
  }
}

export class InvalidPathError extends TreeError {
  constructor(path: string) {
    super(`Invalid path: ${path}`, 'INVALID_PATH_ERROR', path);
  }
}

export class GitignoreParseError extends TreeError {
  constructor(path: string, originalError: Error) {
    super(`Failed to parse .gitignore file: ${path}`, 'GITIGNORE_PARSE_ERROR', path);
    this.cause = originalError;
  }
}

// --- Function type definitions ---

export interface FilterFunction {
  (entry: FileEntry): boolean;
}

export interface SortFunction {
  (a: FileEntry, b: FileEntry): number;
}

// --- Constant definitions ---

export const TREE_SYMBOLS = {
  BRANCH: '├── ',
  LAST: '└── ',
  VERTICAL: '│   ',
  SPACE: '    ',
} as const;

export type TreeSymbol = typeof TREE_SYMBOLS[keyof typeof TREE_SYMBOLS];

// --- Default configuration values ---

export const DEFAULT_TREE_OPTIONS: Partial<TreeOptions> = {
  path: '.',
  gitignore: false,
  allignore: false,
} as const;

export const DEFAULT_DISPLAY_OPTIONS: DisplayOptions = {
  showHidden: false,
  colorOutput: true,
  showSize: false,
  showPermissions: false,
} as const;

