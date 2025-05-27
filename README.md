# Local Cached Run Action

A GitHub Action that implements local caching for command execution. If a cache key is found, it uses the cached result; otherwise, it runs the script and saves the result to the cache. Failed scripts are not cached.

## Features

- **Smart Caching**: Filesystem-based caching with configurable cache directories and composite keys
- **Symlink Management**: Uses symlinks for efficient cache retrieval and automatic cleanup
- **Cache Expiration**: Automatically removes cache directories older than 7 days
- **Post-Action Cleanup**: Removes symlinks and creates empty directories after action completion

## Usage

```yaml
- name: Run with cache
  uses: ./
  with:
    prefix: 'build'
    key: ${{ hashFiles('package-lock.json') }}
    path: './node_modules'
    run: 'npm install'
    cache_base_dir: '/cache'  # optional, defaults to '/cache'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `prefix` | The prefix to use for the cache directory | Yes | - |
| `key` | The cache key to use | Yes | - |
| `path` | The path to the cache directory | Yes | - |
| `run` | The command to run | Yes | - |
| `cache_base_dir` | The base directory to use for the cache | No | `/cache` |

## How It Works

### Cache Hit
1. Checks if cache directory exists at `{cache_base_dir}/{prefix}-{key}`
2. If found, removes target path and creates symlink from cache to target path
3. Updates cache directory timestamp to prevent cleanup

### Cache Miss
1. Executes the specified command
2. If command succeeds, moves result to cache directory
3. Creates symlink from cache to target path
4. Cleans up old cache directories (>7 days)

### Post Action
1. Removes symlinks created during main action
2. Replaces symlinks with empty directories
3. Handles cleanup gracefully with warning-level logging

## Development

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Compile TypeScript only
tsc
```

## Cache Strategy

The action implements atomic cache operations using a move + symlink pattern:
- Cache directories are named using composite keys: `{prefix}-{key}`
- Symlinks provide efficient access to cached content
- Failed commands are never cached
- Cache cleanup runs automatically based on modification time