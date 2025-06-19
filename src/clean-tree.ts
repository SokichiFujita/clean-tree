#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import ignore, { Ignore } from 'ignore';
import {
  TreeOptions,
  FileEntry,
  TreeStats,
  DirectoryContents,
  TreeGeneratorConfig,
  TreeError,
  InvalidPathError,
  GitignoreParseError,
  TREE_SYMBOLS,
  DEFAULT_TREE_OPTIONS,
  DEFAULT_DISPLAY_OPTIONS,
  FilterFunction,
  SortFunction,
} from './types';

const yargsResult = yargs(hideBin(process.argv))
  .usage('Usage: $0 [path] [options]')
  .positional('path', {
    describe: 'Path to the directory to display',
    default: DEFAULT_TREE_OPTIONS.path,
    type: 'string',
  })
  .option('d', {
    alias: 'depth',
    describe: 'Maximum depth to display directories',
    type: 'number',
  })
  .option('e', {
    alias: 'exclude',
    describe: 'Pattern to exclude files or directories (glob format)',
    type: 'string',
  })
  .option('g', {
    alias: 'gitignore',
    describe: 'Ignore contents of .gitignore file',
    type: 'boolean',
    default: DEFAULT_TREE_OPTIONS.gitignore,
  })
  .option('a', {
    alias: 'allignore',
    describe: 'Ignore rules from any .*ignore files (e.g., .gitignore, .npmignore, .dockerignore)',
    type: 'boolean',
    default: DEFAULT_TREE_OPTIONS.allignore,
  })
  .help('h')
  .alias('h', 'help')
  .version(false)
  .parseSync();

/**
 * Convert parsed arguments to TreeOptions, using positional argument or default
 */
function convertToTreeOptions(args: any): TreeOptions {
  // Determine raw path from first non-option positional argument
  const rawArgs = hideBin(process.argv);
  const firstPos = rawArgs.find((a) => !a.startsWith('-'));
  const rawPath = typeof firstPos === 'string'
    ? firstPos
    : DEFAULT_TREE_OPTIONS.path!;
  return {
    path: rawPath,
    depth: typeof args.depth === 'number' ? args.depth : undefined,
    exclude: typeof args.exclude === 'string' ? args.exclude : undefined,
    gitignore: Boolean(args.gitignore),
    allignore: Boolean(args.allignore),
  };
}

const argv: TreeOptions = convertToTreeOptions(yargsResult);


class FileUtils {
  /**
   * Safely get file statistics
   */
  static getFileStat(filePath: string): fs.Stats | undefined {
    try {
      return fs.statSync(filePath);
    } catch {
      return undefined;
    }
  }

  /**
   * Check if path is a directory
   */
  static isDirectory(filePath: string): boolean {
    const stat = this.getFileStat(filePath);
    return stat?.isDirectory() ?? false;
  }

  /**
   * Check if path is a file
   */
  static isFile(filePath: string): boolean {
    const stat = this.getFileStat(filePath);
    return stat?.isFile() ?? false;
  }
}

class FilterUtils {
  /**
   * Create filter to exclude system files
   */
  static createSystemFileFilter(): FilterFunction {
    return (entry: FileEntry): boolean => {
      const systemFiles = ['.DS_Store', 'Thumbs.db', 'desktop.ini'];
      return !systemFiles.includes(entry.name);
    };
  }

  /**
   * Create filter based on ignore rules
   */
  static createIgnoreFilter(ig: Ignore, startPath: string): FilterFunction {
    return (entry: FileEntry): boolean => {
      const relativePath = path.relative(startPath, entry.fullPath);
      return !ig.ignores(relativePath);
    };
  }
}

class SortUtils {
  /**
   * Create default sorting function (directories first, then alphabetical)
   */
  static createDefaultSort(): SortFunction {
    return (a: FileEntry, b: FileEntry): number => {
      // Display directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      // Sort by name
      return a.name.localeCompare(b.name);
    };
  }
}


class TreeGenerator {
  private readonly config: TreeGeneratorConfig;
  private readonly stats: TreeStats;

  constructor(options: TreeOptions) {
    this.config = {
      startPath: path.resolve(options.path),
      maxDepth: options.depth ?? Infinity,
      ignoreRules: ignore(),
      displayOptions: DEFAULT_DISPLAY_OPTIONS,
    };
    
    this.stats = { dirCount: 0, fileCount: 0 };
    this.setupIgnoreRules(options);
  }

  /**
   * Setup ignore rules based on options
   */
  private setupIgnoreRules(options: TreeOptions): void {
    try {
      // Load ignore rules based on options: allignore supersedes gitignore
      if (options.allignore) {
        this.loadAllIgnoreRules();
      } else if (options.gitignore) {
        this.loadGitignoreRules();
      }

      // Add any additional exclude pattern
      if (options.exclude) {
        this.config.ignoreRules.add(options.exclude);
      }
    } catch (err) {
      throw new GitignoreParseError(this.config.startPath, err as Error);
    }
  }

  /**
   * Load .gitignore rules from file
   */
  private loadGitignoreRules(): void {
    const gitignorePath = path.join(this.config.startPath, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        this.config.ignoreRules.add(gitignoreContent);
      } catch (err) {
        console.error(chalk.red(`Error reading .gitignore file: ${(err as Error).message}`));
      }
    }
  }
  
  /**
   * Load rules from all .*ignore files in the start directory
   */
  private loadAllIgnoreRules(): void {
    let files: string[];
    try {
      files = fs.readdirSync(this.config.startPath);
    } catch {
      return;
    }
    const ignoreFiles = files.filter(name => name.startsWith('.') && name.endsWith('ignore'));
    for (const ignoreFile of ignoreFiles) {
      const filePath = path.join(this.config.startPath, ignoreFile);
      if (FileUtils.isFile(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          this.config.ignoreRules.add(content);
        } catch (err) {
          console.error(chalk.red(`Error reading ${ignoreFile} file: ${(err as Error).message}`));
        }
      }
    }
  }

  /**
   * Get directory contents with error handling
   */
  private getDirectoryContents(currentPath: string): DirectoryContents {
    try {
      const entries = fs.readdirSync(currentPath);
      const fileEntries = this.createFileEntries(currentPath, entries);
      
      return {
        entries: this.filterAndSortEntries(fileEntries),
        hasErrors: false,
      };
    } catch (err) {
      return {
        entries: [],
        hasErrors: true,
        errorMessage: (err as Error).message,
      };
    }
  }

  /**
   * Create FileEntry objects from directory listing
   */
  private createFileEntries(currentPath: string, entries: string[]): FileEntry[] {
    return entries.map((entry, index): FileEntry => {
      const fullPath = path.join(currentPath, entry);
      const isDirectory = FileUtils.isDirectory(fullPath);
      
      return {
        name: entry,
        fullPath,
        isDirectory,
        isLast: index === entries.length - 1,
        stats: FileUtils.getFileStat(fullPath),
      };
    });
  }

  /**
   * Apply filters and sorting to entries
   */
  private filterAndSortEntries(entries: FileEntry[]): FileEntry[] {
    const filters: FilterFunction[] = [
      FilterUtils.createSystemFileFilter(),
      FilterUtils.createIgnoreFilter(this.config.ignoreRules, this.config.startPath),
    ];

    let filteredEntries = entries;
    
    // Apply all filters
    for (const filter of filters) {
      filteredEntries = filteredEntries.filter(filter);
    }

    // Sort entries
    const sortFunction = SortUtils.createDefaultSort();
    filteredEntries.sort(sortFunction);

    // Update isLast flags
    return filteredEntries.map((entry, index) => ({
      ...entry,
      isLast: index === filteredEntries.length - 1,
    }));
  }

  /**
   * Display a single entry with appropriate formatting
   */
  private displayEntry(entry: FileEntry, prefix: string): void {
    const connector = entry.isLast ? TREE_SYMBOLS.LAST : TREE_SYMBOLS.BRANCH;
    
    if (entry.isDirectory) {
      console.log(`${prefix}${connector}${chalk.blue.bold(entry.name)}`);
      this.stats.dirCount++;
    } else {
      console.log(`${prefix}${connector}${entry.name}`);
      this.stats.fileCount++;
    }
  }

  /**
   * Generate prefix for next level of tree
   */
  private getNextPrefix(prefix: string, isLast: boolean): string {
    return prefix + (isLast ? TREE_SYMBOLS.SPACE : TREE_SYMBOLS.VERTICAL);
  }

  /**
   * Recursively walk directory tree
   */
  private walk(currentPath: string, prefix: string, currentDepth: number): void {
    if (currentDepth > this.config.maxDepth) {
      return;
    }

    const contents = this.getDirectoryContents(currentPath);
    
    if (contents.hasErrors) {
      console.log(`${prefix}${TREE_SYMBOLS.LAST}${chalk.red(`[Error: ${contents.errorMessage}]`)}`);
      return;
    }

    contents.entries.forEach(entry => {
      this.displayEntry(entry, prefix);

      if (entry.isDirectory) {
        const nextPrefix = this.getNextPrefix(prefix, entry.isLast);
        this.walk(entry.fullPath, nextPrefix, currentDepth + 1);
      }
    });
  }

  /**
   * Generate and display the tree
   */
  public generate(): void {
    try {
      if (!FileUtils.isDirectory(this.config.startPath)) {
        throw new InvalidPathError(this.config.startPath);
      }

      // Display root directory
      console.log(chalk.blue.bold(path.basename(this.config.startPath)));

      // Start tree generation
      this.walk(this.config.startPath, '', 1);

      // Display summary
      console.log(chalk.green(`\n${this.stats.dirCount} directories, ${this.stats.fileCount} files`));

    } catch (err) {
      if (err instanceof TreeError) {
        console.error(chalk.red(`Error [${err.code}]: ${err.message}`));
      } else {
        console.error(chalk.red(`Unexpected error: ${(err as Error).message}`));
      }
      process.exit(1);
    }
  }
}

// --- Execute ---

const treeGenerator = new TreeGenerator(argv);
treeGenerator.generate();
