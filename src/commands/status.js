import Table from 'cli-table3';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { loadTunnels } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { isRunning, getRunningTunnels } from '../lib/tunnel-manager.js';
import { getTunnelInfo, listCloudflaredTunnels } from '../utils/cloudflare.js';

export async function statusCommand(name) {
  try {
    const tunnels = await loadTunnels();
    
    if (tunnels.length === 0) {
      logger.info('No tunnels configured.');
      return;
    }
    
    let tunnelName = name;
    
    // If no name provided, check all or select one
    if (!tunnelName) {
      const showAll = tunnels.length <= 5;
      
      if (!showAll) {
        const choices = [
          { value: '__all__', name: 'Show all tunnels' },
          ...tunnels.map(t => ({
            value: t.name,
            name: t.name
          }))
        ];
        
        tunnelName = await select({
          message: 'Select tunnel to check status:',
          choices,
          loop: false,
          pageSize: Math.max(10, choices.length)
        });
      }
      
      if (showAll || tunnelName === '__all__') {
        // Show status for all tunnels
        await showAllTunnelStatus();
        return;
      }
    }
    
    // Show status for specific tunnel
    const tunnel = tunnels.find(t => t.name === tunnelName);
    if (!tunnel) {
      logger.error(`Tunnel '${tunnelName}' not found`);
      return;
    }
    
    await showTunnelStatus(tunnel);
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Status check cancelled');
    } else {
      logger.error(`Failed to check status: ${error.message}`);
    }
  }
}

async function showTunnelStatus(tunnel) {
  console.log();
  console.log(chalk.bold(`Tunnel: ${tunnel.name}`));
  console.log(chalk.gray('─'.repeat(40)));
  
  // Local status
  const running = isRunning(tunnel.name);
  console.log(chalk.gray('Local Status:'), running ? chalk.green('● Running') : chalk.gray('○ Stopped'));
  console.log(chalk.gray('Service URL:'), tunnel.url || '-');
  console.log(chalk.gray('Hostname:'), tunnel.hostname || '-');
  console.log(chalk.gray('Created:'), new Date(tunnel.createdAt).toLocaleString());
  
  // Try to get Cloudflare status
  const spinner = logger.spinner('Checking Cloudflare status...');
  spinner.start();
  
  try {
    const info = await getTunnelInfo(tunnel.name);
    spinner.stop();
    
    if (info) {
      console.log();
      console.log(chalk.gray('Cloudflare Status:'));
      console.log(chalk.gray(info));
    } else {
      console.log(chalk.gray('Cloudflare Status:'), chalk.yellow('Not found in Cloudflare'));
    }
  } catch (error) {
    spinner.fail('Could not retrieve Cloudflare status');
  }
  
  console.log();
}

async function showAllTunnelStatus() {
  const tunnels = await loadTunnels();
  const runningTunnels = getRunningTunnels();
  
  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Status'),
      chalk.cyan('URL'),
      chalk.cyan('Hostname')
    ],
    style: {
      head: [],
      border: []
    }
  });
  
  for (const tunnel of tunnels) {
    const running = runningTunnels.includes(tunnel.name);
    const status = running ? chalk.green('● Running') : chalk.gray('○ Stopped');
    
    table.push([
      tunnel.name,
      status,
      tunnel.url || '-',
      tunnel.hostname || '-'
    ]);
  }
  
  console.log();
  console.log(table.toString());
  
  // Show summary
  console.log();
  console.log(chalk.gray(`Total: ${tunnels.length} tunnel${tunnels.length !== 1 ? 's' : ''}`));
  console.log(chalk.gray(`Running: ${runningTunnels.length}`));
  
  // Try to list Cloudflare tunnels
  if (tunnels.length > 0) {
    const spinner = logger.spinner('Fetching Cloudflare tunnel list...');
    spinner.start();
    
    try {
      const cfList = await listCloudflaredTunnels();
      spinner.stop();
      console.log();
      console.log(chalk.bold('Cloudflare Tunnels:'));
      console.log(chalk.gray(cfList));
    } catch (error) {
      spinner.fail('Could not fetch Cloudflare tunnel list');
    }
  }
}