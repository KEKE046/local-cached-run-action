# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that implements local caching for command execution. The action runs a script with a local cache mechanism - if the cache key is found, it uses the cached result; otherwise, it runs the script and saves the result to the cache. Failed scripts are not cached.

## Development Commands

- `npm run build` - Compiles TypeScript and bundles with ncc for distribution
- `tsc` - Compile TypeScript to JavaScript (outputs to lib/)

## Architecture

- `src/index.ts`: Main TypeScript source implementing full cache logic with command execution
- `src/post.ts`: Post action TypeScript source for cleanup operations
- `dist/index.js`: Bundled main action distribution file
- `dist/post.js`: Bundled post action distribution file
- `lib/index.js` & `lib/post.js`: Compiled TypeScript outputs (intermediate build artifacts)
- `action.yml`: GitHub Action metadata defining inputs, main action, and post action

## Cache Implementation Details

- **Cache Strategy**: Uses filesystem-based caching with configurable base directory and composite keys (prefix-key)
- **Cache Hit**: Creates symlink from cached directory to target path when cache exists
- **Cache Miss**: Executes command, moves result to cache directory, then creates symlink
- **Cache Cleanup**: Automatically removes cache directories older than 7 days based on modification time
- **Post Action**: Removes symlinks created during main action and replaces them with empty directories
- **Build Process**: TypeScript source is compiled and bundled with @vercel/ncc for GitHub Actions distribution

## Key Implementation Notes

- Uses `execSync` with `/bin/bash` shell for command execution
- Implements atomic cache operations using move + symlink pattern
- Creates parent directories automatically when needed
- Handles cleanup gracefully with warning-level logging on failure