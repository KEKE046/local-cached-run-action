import * as core from '@actions/core';
import fs from 'fs';

const path = core.getInput('path', { required: true });

async function postAction() {
  try {
    core.info('Running post action cleanup');
    
    // Remove symlink if it exists and is actually a symlink
    if (fs.existsSync(path)) {
      const stats = fs.lstatSync(path);
      if (stats.isSymbolicLink()) {
        core.info(`Removing symlink: ${path}`);
        fs.unlinkSync(path);
        
        // Create empty directory in place of the symlink
        core.info(`Creating empty directory: ${path}`);
        fs.mkdirSync(path, { recursive: true });
      } else {
        core.info(`Path ${path} exists but is not a symlink, skipping cleanup`);
      }
    } else {
      core.info(`Path ${path} does not exist, skipping cleanup`);
    }
    
    core.info('Post action cleanup completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`Post action cleanup failed: ${errorMessage}`);
  }
}

postAction();