import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { loadTunnels } from '../utils/config.js';
import { startTunnel, isRunning } from '../lib/tunnel-manager.js';
import { parseCloudflaredTunnels } from '../utils/cloudflare.js';
import { logger } from '../utils/logger.js';

export async function startCommand(name) {
  try {
    // Load both local and external tunnels, but only start local ones
    const [localTunnels, externalTunnels] = await Promise.all([
      loadTunnels(),
      parseCloudflaredTunnels()
    ]);

    // For starting, we only work with local tunnels since they have URL config
    const startableTunnels = localTunnels;
    const localNames = new Set(localTunnels.map(t => t.name));
    const externalOnlyTunnels = externalTunnels.filter(t => !localNames.has(t.name));

    if (startableTunnels.length === 0) {
      if (externalOnlyTunnels.length > 0) {
        logger.info('No local tunnels configured to start.');
        console.log();
        console.log(`Found ${externalOnlyTunnels.length} external tunnel(s) that need to be imported first:`);
        for (const tunnel of externalOnlyTunnels) {
          console.log(`  • ${tunnel.name}`);
        }
        console.log();
        console.log('Use the "sync" command to import external tunnels, then edit them to add URL configuration.');
      } else {
        logger.info('No tunnels configured.');
        console.log();
        console.log(chalk.gray('To create a tunnel, run:'));
        console.log(chalk.cyan('  cf-tunnel-buddy add'));
      }
      return;
    }

    let tunnelName = name;

    // If no name provided, show selection
    if (!tunnelName) {
      const availableTunnels = startableTunnels.filter(t => !isRunning(t.name));

      if (availableTunnels.length === 0) {
        logger.info('All local tunnels are already running.');
        return;
      }

      tunnelName = await select({
        message: 'Select tunnel to start:',
        choices: availableTunnels.map(t => ({
          value: t.name,
          name: `${t.name} (${t.url || 'no url'})${t.hostname ? ` → ${t.hostname}` : ''}`
        })),
        loop: false,
        pageSize: Math.max(10, availableTunnels.length)
      });
    }

    // Check if tunnel exists
    const tunnel = startableTunnels.find(t => t.name === tunnelName);
    if (!tunnel) {
      logger.error(`Tunnel '${tunnelName}' not found`);
      return;
    }

    // Check if already running
    if (isRunning(tunnelName)) {
      logger.warning(`Tunnel '${tunnelName}' is already running`);
      return;
    }

    // Start the tunnel in background
    const spinner = logger.spinner(`Starting tunnel '${tunnelName}'...`);
    spinner.start();

    await startTunnel(tunnelName, { background: true });

    spinner.succeed(`Tunnel '${tunnelName}' started`);

    console.log();
    if (tunnel.hostname) {
      console.log(chalk.green('  Public URL:'), chalk.cyan(`https://${tunnel.hostname}`));
    }
    console.log(chalk.gray('  Service:'), tunnel.url);
    console.log();
    console.log(chalk.gray('Tunnel is running in the background.'));
    console.log(chalk.gray('Use "Stop a tunnel" from the menu to stop it.'));

  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Start cancelled');
    } else {
      logger.error(`Failed to start tunnel: ${error.message}`);
    }
  }
}
