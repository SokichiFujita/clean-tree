#!/usr/bin/env node
// Simple test for clean-tree CLI using test/test-dir
const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');

function run(cmd, options = {}) {
  // Execute a command and return stdout as string
  const result = execSync(cmd, options);
  if (result == null) {
    return '';
  }
  return result.toString().replace(/\r\n/g, '\n');
}

// Define paths
const cliPath = path.join(__dirname, '..', 'dist', 'clean-tree.js');
const testDir = path.join(__dirname, 'test-dir');

// Run the CLI on test directory without color
console.log('Running clean-tree on test/test-dir...');
const output = run(
  `node ${cliPath} ${testDir}`,
  { env: { ...process.env, FORCE_COLOR: '0' } }
);

// Expected tree output (no colors)
const expected = [
  'test-dir',
  '├── subdir',
  '│   └── file2.txt',
  '└── file1.txt',
  '',
  '1 directories, 2 files'
].join('\n') + '\n';

// Assert output matches expected
assert.strictEqual(output, expected);
console.log('Test passed.');
