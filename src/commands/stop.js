import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { stopTunnel, getRunningTunnels } from '../lib/tunnel-manager.js';
import { logger } from '../utils/logger.js';

export async function stopCommand(name) {
  try {
    const runningTunnels = getRunningTunnels();
    
    if (runningTunnels.length === 0) {
      logger.info('No tunnels are currently running.');
      return;
    }
    
    let tunnelName = name;
    
    // If no name provided, show selection
    if (!tunnelName) {
      if (runningTunnels.length === 1) {
        tunnelName = runningTunnels[0];
      } else {
        tunnelName = await select({
          message: 'Select tunnel to stop:',
          choices: runningTunnels.map(name => ({
            value: name,
            name: name
          })),
          loop: false,
          pageSize: Math.max(10, runningTunnels.length)
        });
      }
    }
    
    // Check if running
    if (!runningTunnels.includes(tunnelName)) {
      logger.error(`Tunnel '${tunnelName}' is not running`);
      return;
    }
    
    // Stop the tunnel
    await stopTunnel(tunnelName);
    logger.success(`Tunnel '${tunnelName}' stopped`);
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Stop cancelled');
    } else {
      logger.error(`Failed to stop tunnel: ${error.message}`);
    }
  }
}