# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that implements local caching for command execution. The action runs a script with a local cache mechanism - if the cache key is found, it uses the cached result; otherwise, it runs the script and saves the result to the cache. Failed scripts are not cached.

## Architecture

- `action.yml`: GitHub Action metadata defining inputs (prefix, key, path, run, cache_base_dir) and specifying Node.js 20 runtime
- `index.js`: Main entry point that validates required inputs using @actions/core
- `package.json`: Minimal Node.js package with @actions/core dependency

## Key Components

- **Input Validation**: Uses @actions/core to validate required inputs (prefix, key, path, run) and optional cache_base_dir
- **Cache Strategy**: Implements cache-based command execution with configurable cache directory and keys
- **Error Handling**: Fails the action if input validation fails

## Development Notes

- Uses ES6 imports for @actions/core
- Requires Node.js 20 runtime as specified in action.yml
- Currently implements only input validation; cache logic and command execution appear incomplete in index.js