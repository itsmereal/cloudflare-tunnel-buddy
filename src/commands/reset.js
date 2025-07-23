import { confirm, select, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { stat } from 'fs/promises';
import { resetConfig, getConfigPaths } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { getRunningTunnels, stopTunnel } from '../lib/tunnel-manager.js';

export async function resetCommand(options) {
  try {
    const { configDir, tunnelsFile, credentialsFile } = getConfigPaths();
    
    // Check if config directory exists
    let dirExists = false;
    try {
      await stat(configDir);
      dirExists = true;
    } catch {
      logger.info('No configuration found to reset.');
      return;
    }
    
    // Stop all running tunnels first
    const runningTunnels = getRunningTunnels();
    if (runningTunnels.length > 0) {
      logger.warning(`${runningTunnels.length} tunnel(s) are currently running.`);
      const stopAll = await confirm({
        message: 'Stop all running tunnels before reset?',
        default: true
      });
      
      if (stopAll) {
        for (const tunnelName of runningTunnels) {
          try {
            await stopTunnel(tunnelName);
            logger.success(`Stopped tunnel '${tunnelName}'`);
          } catch (error) {
            logger.error(`Failed to stop tunnel '${tunnelName}': ${error.message}`);
          }
        }
      } else {
        logger.info('Reset cancelled. Please stop all tunnels before resetting.');
        return;
      }
    }
    
    // Determine reset scope
    let resetScope;
    if (options.all) {
      resetScope = 'all';
    } else if (options.tunnelsOnly) {
      resetScope = 'tunnels';
    } else if (!options.force) {
      // Show interactive menu
      resetScope = await select({
        message: 'What would you like to reset?',
        choices: [
          { value: 'all', name: 'Everything (complete reset)' },
          { value: 'tunnels', name: 'Tunnel configurations only' },
          { value: 'cancel', name: 'Cancel' }
        ],
        loop: false
      });
      
      if (resetScope === 'cancel') {
        logger.info('Reset cancelled');
        return;
      }
    } else {
      resetScope = 'all';
    }
    
    // Show what will be deleted
    console.log();
    logger.warning('The following will be deleted:');
    
    if (resetScope === 'all') {
      console.log(chalk.red('  •'), `Configuration directory: ${configDir}`);
      console.log(chalk.red('  •'), 'All tunnel configurations');
      console.log(chalk.red('  •'), 'Stored Cloudflare credentials');
      console.log(chalk.red('  •'), 'Any cached data');
    } else if (resetScope === 'tunnels') {
      console.log(chalk.red('  •'), `Tunnel configurations: ${tunnelsFile}`);
    }
    
    console.log();
    
    // Get confirmation
    let confirmed = options.force;
    if (!confirmed) {
      if (resetScope === 'all') {
        // For complete reset, require typing confirmation
        const confirmText = await input({
          message: 'Type "RESET" to confirm complete reset:',
          validate: (value) => {
            if (value.toUpperCase() === 'RESET') return true;
            return 'Please type RESET to confirm';
          }
        });
        confirmed = confirmText.toUpperCase() === 'RESET';
      } else {
        confirmed = await confirm({
          message: chalk.red('Are you sure you want to continue?'),
          default: false
        });
      }
    }
    
    if (!confirmed) {
      logger.info('Reset cancelled');
      return;
    }
    
    // Perform reset
    const spinner = logger.spinner('Resetting configuration...');
    spinner.start();
    
    try {
      await resetConfig({ 
        all: resetScope === 'all',
        tunnelsOnly: resetScope === 'tunnels'
      });
      
      spinner.succeed('Configuration reset successfully');
      
      if (resetScope === 'all') {
        console.log();
        logger.info('All configuration has been removed.');
        console.log(chalk.gray('Run'), chalk.cyan('cf-tunnel-buddy add'), chalk.gray('to create a new tunnel.'));
      } else {
        console.log();
        logger.info('Tunnel configurations have been removed.');
      }
      
    } catch (error) {
      spinner.fail('Failed to reset configuration');
      throw error;
    }
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Reset cancelled');
    } else {
      logger.error(`Failed to reset: ${error.message}`);
    }
  }
}