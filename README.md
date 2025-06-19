# clean-tree

A modern, TypeScript-based implementation of the `tree` command with advanced filtering and .gitignore support.

## Features

- 🌳 **Beautiful tree visualization** - Clean, colorized directory structure display
- 📏 **Depth limiting** - Control how deep to traverse with `--depth`
- 🚫 **Pattern exclusion** - Exclude files/directories with glob patterns
- 📝 **.gitignore support** - Respect .gitignore rules automatically
- 🎨 **Colorized output** - Directories and files are color-coded for better readability
- ⚡ **Fast & lightweight** - Efficient traversal with minimal dependencies
- 🔧 **Cross-platform** - Works on Windows, macOS, and Linux

## Installation

### Global Installation (Recommended)

```bash
npm install -g clean-tree
```

### Local Installation

```bash
npm install clean-tree
npx clean-tree
```

## Usage

### Basic Usage

```bash
# Display current directory tree
clean-tree

# Display specific directory
clean-tree /path/to/directory
```

### Advanced Options

```bash
# Limit depth to 2 levels
clean-tree --depth 2

# Respect .gitignore rules
clean-tree --gitignore

# Exclude specific patterns
clean-tree --exclude "node_modules"

# Respect all .*ignore files
clean-tree --allignore

# Combine multiple options
clean-tree src --depth 3 --allignore --exclude "*.log"
```

## Command Line Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--depth` | `-d` | number | Maximum depth to display (default: unlimited) |
| `--exclude` | `-e` | string | Exclude files/directories matching glob pattern |
| `--gitignore`   | `-g`   | boolean | Respect .gitignore rules (default: false) |
| `--allignore`   | `-a`   | boolean | Respect all .*ignore files (e.g., .gitignore, .npmignore, .dockerignore) |
| `--help`        | `-h`   | boolean | Show help information |

## Examples

### Basic Tree Display

```bash
clean-tree
```

Output:
```
my-project
├── src
│   ├── components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── utils
│   │   └── helpers.ts
│   └── index.ts
├── package.json
└── README.md

4 directories, 6 files
```

### With Depth Limitation

```bash
clean-tree --depth 2
```

Output:
```
my-project
├── src
│   ├── components
│   ├── utils
│   └── index.ts
├── package.json
└── README.md

3 directories, 3 files
```

### Respecting .gitignore

```bash
clean-tree --gitignore
```

This will automatically exclude files and directories listed in your `.gitignore` file.

### Excluding Patterns

```bash
clean-tree --exclude "node_modules"
clean-tree --exclude "*.log"
clean-tree --exclude "{dist,build}"
```

## Pattern Matching

The `--exclude` option supports glob patterns:

- `*` - matches any number of characters
- `?` - matches a single character
- `**` - matches directories recursively
- `{pattern1,pattern2}` - matches either pattern
- `[abc]` - matches any character in brackets

Examples:
```bash
# Exclude all JavaScript files
clean-tree --exclude "*.js"

# Exclude multiple directories
clean-tree --exclude "{node_modules,dist,build}"

# Exclude all hidden files
clean-tree --exclude ".*"
```

## .gitignore Integration

When using the `--gitignore` flag, `clean-tree` will:

1. Look for a `.gitignore` file in the target directory
2. Parse the gitignore patterns
3. Automatically exclude matching files and directories
4. Apply the same rules as Git would

This is particularly useful for development projects where you want to see the project structure without build artifacts, dependencies, or temporary files.

## Requirements

- Node.js >= 14.0.0
- npm >= 6.0.0

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/clean-tree.git
cd clean-tree

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm run dev
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run with ts-node for development
- `npm start` - Run the compiled JavaScript version
- `npm run watch` - Watch for changes and rebuild

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [tree](https://linux.die.net/man/1/tree) - The original tree command
- [exa](https://the.exa.website/) - A modern replacement for ls with tree functionality
- [fd](https://github.com/sharkdp/fd) - A simple, fast and user-friendly alternative to find

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/clean-tree/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible, including:
   - Your operating system
   - Node.js version
   - Command you ran
   - Expected vs actual output


