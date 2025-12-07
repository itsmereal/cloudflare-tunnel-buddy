#!/usr/bin/env node

import chalk from 'chalk';
import { showMainMenu, handleNavigationError } from './utils/navigation.js';
import { logger } from './utils/logger.js';
import { addCommandInteractive } from './commands/add-interactive.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { editCommand } from './commands/edit.js';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { statusCommand } from './commands/status.js';
import { resetCommand } from './commands/reset.js';
import { syncCommand } from './commands/sync.js';
import { cloudflaredStatusCommand } from './commands/cloudflared-status.js';
import { ensureConfigDirectory } from './utils/config.js';

async function waitForKey() {
  console.log();
  console.log('Press any key to continue...');
  
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

async function runInteractiveMode() {
  try {
    await ensureConfigDirectory();
    
    while (true) {
      try {
        const choice = await showMainMenu();
        
        if (choice === 'exit') {
          console.log();
          console.log('Thanks for using Cloudflare Tunnel Buddy!');
          process.exit(0);
        }
        
        console.clear();
        
        try {
          switch (choice) {
            case 'add':
              await addCommandInteractive();
              break;
            case 'list':
              await listCommand();
              break;
            case 'start':
              await startCommand();
              break;
            case 'stop':
              await stopCommand();
              break;
            case 'status':
              await statusCommand();
              break;
            case 'edit':
              await editCommand();
              break;
            case 'remove':
              await removeCommand();
              break;
            case 'reset':
              await resetCommand({});
              break;
            case 'sync':
              await syncCommand();
              break;
            case 'cloudflared-status':
              await cloudflaredStatusCommand();
              break;
            default:
              logger.error('Unknown command');
          }
          
          await waitForKey();
          
        } catch (error) {
          const result = handleNavigationError(error);
          if (result === 'back') {
            continue; // Go back to main menu
          } else if (result === 'cancel') {
            logger.info('Operation cancelled');
            await waitForKey();
            continue;
          }
          // If not a navigation error, re-throw
          throw error;
        }
        
      } catch (error) {
        if (error.name === 'ExitPromptError') {
          console.log();
          console.log('Thanks for using Cloudflare Tunnel Buddy!');
          process.exit(0);
        } else {
          console.log(`Error: ${error.message}`);
          await waitForKey();
        }
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Fatal error:'), error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log();
  console.log('Thanks for using Cloudflare Tunnel Buddy!');
  process.exit(0);
});

// Start interactive mode
runInteractiveMode();