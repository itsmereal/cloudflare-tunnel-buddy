import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { loadTunnels } from '../utils/config.js';
import { removeTunnel } from '../lib/tunnel-manager.js';
import { parseCloudflaredTunnels } from '../utils/cloudflare.js';
import { logger } from '../utils/logger.js';

export async function removeCommand(name) {
  try {
    // Load both local and external tunnels
    const [localTunnels, externalTunnels] = await Promise.all([
      loadTunnels(),
      parseCloudflaredTunnels()
    ]);
    
    // Create a combined list, prioritizing local configs
    const allTunnels = new Map();
    
    // Add external tunnels first
    for (const tunnel of externalTunnels) {
      allTunnels.set(tunnel.name, {
        ...tunnel,
        url: '-',
        hostname: '-',
        source: 'external',
        createdAt: tunnel.created
      });
    }
    
    // Override with local tunnels (they have more info)
    for (const tunnel of localTunnels) {
      allTunnels.set(tunnel.name, {
        ...tunnel,
        source: 'local',
        id: tunnel.id
      });
    }
    
    const tunnels = Array.from(allTunnels.values());
    
    if (tunnels.length === 0) {
      logger.info('No tunnels to remove.');
      return;
    }
    
    let tunnelName = name;
    
    // If no name provided, show selection
    if (!tunnelName) {
      tunnelName = await select({
        message: 'Select tunnel to remove:',
        choices: tunnels.map(t => ({
          value: t.name,
          name: `${t.name} (${t.url || 'no url'})${t.hostname ? ` → ${t.hostname}` : ''} [${t.source}]`
        })),
        loop: false,
        pageSize: Math.max(10, tunnels.length)
      });
    }
    
    // Check if tunnel exists
    const tunnel = tunnels.find(t => t.name === tunnelName);
    if (!tunnel) {
      logger.error(`Tunnel '${tunnelName}' not found`);
      return;
    }
    
    // Show tunnel details
    console.log();
    logger.warning('This will remove the following tunnel:');
    console.log(chalk.gray('  Name:'), tunnel.name);
    console.log(chalk.gray('  URL:'), tunnel.url || '-');
    if (tunnel.hostname) {
      console.log(chalk.gray('  Hostname:'), tunnel.hostname);
    }
    console.log(chalk.gray('  Source:'), tunnel.source);
    if (tunnel.source === 'external') {
      console.log(chalk.yellow('  Note: This will only remove from Cloudflare, not local config'));
    }
    console.log();
    
    const proceed = await confirm({
      message: chalk.red('Are you sure you want to remove this tunnel?'),
      default: false
    });
    
    if (!proceed) {
      logger.info('Removal cancelled');
      return;
    }
    
    // Remove the tunnel
    await removeTunnel(tunnelName);
    
    logger.success(`Tunnel '${tunnelName}' removed successfully`);
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Removal cancelled');
    } else {
      logger.error(`Failed to remove tunnel: ${error.message}`);
    }
  }
}