import core from '@actions/core';
import fs from 'fs';
import path_module from 'path';
import { execSync } from 'child_process';

const cache_base_dir = core.getInput('cache_base_dir') || '/cache';
const prefix = core.getInput('prefix', { required: true });
const key = core.getInput('key', { required: true });
const path = core.getInput('path', { required: true });
const run = core.getInput('run', { required: true });

const cache_dir = `${cache_base_dir}/${prefix}-${key}`;

async function main() {
  try {
    // Ensure cache base directory exists
    if (!fs.existsSync(cache_base_dir)) {
      fs.mkdirSync(cache_base_dir, { recursive: true });
    }

    // Check cache hit
    const cacheExists = fs.existsSync(cache_dir);
    
    if (cacheExists) {
      core.info(`Cache hit for ${prefix}-${key}`);
      
      // Remove target path if it exists
      if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
      }
      
      // Create symlink from cache to target path
      fs.symlinkSync(path_module.resolve(cache_dir), path_module.resolve(path));
      core.info(`Symlinked cache ${cache_dir} to ${path}`);
    } else {
      core.info(`Cache miss for ${prefix}-${key}, running script`);
      
      try {
        // Run the script
        execSync(run, { 
          stdio: 'inherit',
          cwd: process.cwd(),
          shell: '/bin/bash'
        });
        
        core.info('Script executed successfully, caching result');
        // Move target path to cache directory
        if (fs.existsSync(path)) {
          if (fs.existsSync(cache_dir)) {
            fs.rmSync(cache_dir, { recursive: true, force: true });
          }
          fs.renameSync(path, cache_dir);
          
          // Create symlink from cache to target path
          fs.symlinkSync(path_module.resolve(cache_dir), path_module.resolve(path));
          core.info(`Cached result in ${cache_dir} and symlinked to ${path}`);
        }
      } catch (error) {
        core.error(`Script failed: ${error.message}`);
        throw error;
      }
    }
    
    // Touch current cache directory to prevent cleanup
    if (fs.existsSync(cache_dir)) {
      const now = new Date();
      fs.utimesSync(cache_dir, now, now);
    }
    
    // Cleanup old cache directories (older than 7 days)
    cleanupOldCache();
    
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

function cleanupOldCache() {
  try {
    if (!fs.existsSync(cache_base_dir)) return;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const entries = fs.readdirSync(cache_base_dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(prefix)) {
        const dirPath = path_module.join(cache_base_dir, entry.name);
        const stats = fs.statSync(dirPath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          core.info(`Removing old cache directory: ${dirPath}`);
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      }
    }
  } catch (error) {
    core.warning(`Cache cleanup failed: ${error.message}`);
  }
}

main();
