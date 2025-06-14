"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const cache_base_dir = core.getInput('cache_base_dir') || '/cache';
const prefix = core.getInput('prefix', { required: true });
const key = core.getInput('key', { required: true });
const path = core.getInput('path', { required: true });
const run = core.getInput('run', { required: true });
const cache_dir = `${cache_base_dir}/${prefix}-${key}`;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Ensure cache base directory exists
            if (!fs_1.default.existsSync(cache_base_dir)) {
                fs_1.default.mkdirSync(cache_base_dir, { recursive: true });
            }
            // Check cache hit
            const cacheExists = fs_1.default.existsSync(cache_dir);
            if (cacheExists) {
                core.info(`Cache hit for ${prefix}-${key}`);
                // Remove target path if it exists
                if (fs_1.default.existsSync(path)) {
                    fs_1.default.rmSync(path, { recursive: true, force: true });
                }
                // Create parent directory for target path if it doesn't exist
                const targetDir = path_1.default.dirname(path);
                if (!fs_1.default.existsSync(targetDir)) {
                    fs_1.default.mkdirSync(targetDir, { recursive: true });
                }
                // Create symlink from cache to target path
                fs_1.default.symlinkSync(path_1.default.resolve(cache_dir), path_1.default.resolve(path));
                core.info(`Symlinked cache ${cache_dir} to ${path}`);
            }
            else {
                core.info(`Cache miss for ${prefix}-${key}, running script`);
                try {
                    // Run the script
                    (0, child_process_1.execSync)(run, {
                        stdio: 'inherit',
                        cwd: process.cwd(),
                        shell: '/bin/bash'
                    });
                    core.info('Script executed successfully, caching result');
                    // Move target path to cache directory
                    if (fs_1.default.existsSync(path)) {
                        if (fs_1.default.existsSync(cache_dir)) {
                            fs_1.default.rmSync(cache_dir, { recursive: true, force: true });
                        }
                        (0, child_process_1.execSync)(`mv "${path}" "${cache_dir}"`, {
                            stdio: 'inherit',
                            cwd: process.cwd(),
                            shell: '/bin/bash'
                        });
                        // Create symlink from cache to target path
                        fs_1.default.symlinkSync(path_1.default.resolve(cache_dir), path_1.default.resolve(path));
                        core.info(`Cached result in ${cache_dir} and symlinked to ${path}`);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    core.error(`Script failed: ${errorMessage}`);
                    throw error;
                }
            }
            // Touch current cache directory to prevent cleanup
            if (fs_1.default.existsSync(cache_dir)) {
                const now = new Date();
                fs_1.default.utimesSync(cache_dir, now, now);
            }
            // Cleanup old cache directories (older than 7 days)
            cleanupOldCache();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            core.setFailed(`Action failed: ${errorMessage}`);
        }
    });
}
function cleanupOldCache() {
    try {
        if (!fs_1.default.existsSync(cache_base_dir))
            return;
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const entries = fs_1.default.readdirSync(cache_base_dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith(prefix)) {
                const dirPath = path_1.default.join(cache_base_dir, entry.name);
                const stats = fs_1.default.statSync(dirPath);
                if (stats.mtime.getTime() < sevenDaysAgo) {
                    core.info(`Removing old cache directory: ${dirPath}`);
                    fs_1.default.rmSync(dirPath, { recursive: true, force: true });
                }
            }
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.warning(`Cache cleanup failed: ${errorMessage}`);
    }
}
main();
