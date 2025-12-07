import chalk from 'chalk';
import Table from 'cli-table3';
import { logger } from '../utils/logger.js';
import {
  checkCloudflaredInstalled,
  checkAuthenticated,
  getCloudflaredVersion,
  getAccountInfo,
  getActiveTunnels
} from '../utils/cloudflare.js';

export async function cloudflaredStatusCommand() {
  console.log();
  console.log(chalk.bold('Cloudflared Status'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  // Check if cloudflared is installed
  const spinner = logger.spinner('Checking cloudflared installation...');
  spinner.start();

  const installed = await checkCloudflaredInstalled();

  if (!installed) {
    spinner.fail('cloudflared is not installed');
    console.log();
    console.log(chalk.yellow('To install cloudflared:'));
    console.log(chalk.gray('  brew install cloudflared'));
    console.log(chalk.gray('  or visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation'));
    return;
  }

  spinner.succeed('cloudflared is installed');

  // Get version
  const version = await getCloudflaredVersion();
  if (version) {
    console.log(chalk.gray('  Version:'), version);
  }

  console.log();

  // Check authentication
  const authSpinner = logger.spinner('Checking authentication...');
  authSpinner.start();

  const authenticated = await checkAuthenticated();

  if (!authenticated) {
    authSpinner.fail('Not authenticated with Cloudflare');
    console.log();
    console.log(chalk.yellow('To authenticate:'));
    console.log(chalk.gray('  Run: cloudflared tunnel login'));
    console.log(chalk.gray('  Or use the "Create a new tunnel" option which will prompt for login'));
    return;
  }

  authSpinner.succeed('Authenticated with Cloudflare');

  // Get account info
  const accountInfo = await getAccountInfo();
  if (accountInfo) {
    console.log(chalk.gray('  Account ID:'), accountInfo.accountId);
    if (accountInfo.zoneId) {
      console.log(chalk.gray('  Zone ID:'), accountInfo.zoneId);
    }
    console.log(chalk.gray('  API Token:'), accountInfo.hasApiToken ? chalk.green('Configured') : chalk.yellow('Not configured'));
  }

  console.log();

  // Get active tunnels
  const tunnelSpinner = logger.spinner('Fetching tunnels from Cloudflare...');
  tunnelSpinner.start();

  const tunnels = await getActiveTunnels();
  tunnelSpinner.stop();

  if (tunnels.length === 0) {
    console.log(chalk.gray('No tunnels found in your Cloudflare account'));
  } else {
    console.log(chalk.bold(`Tunnels in Cloudflare Account (${tunnels.length}):`));
    console.log();

    const table = new Table({
      head: [
        chalk.cyan('Name'),
        chalk.cyan('Status'),
        chalk.cyan('Connections'),
        chalk.cyan('Created')
      ],
      style: {
        head: [],
        border: []
      }
    });

    for (const tunnel of tunnels) {
      const status = tunnel.isConnected
        ? chalk.green('● Connected')
        : chalk.gray('○ Disconnected');

      table.push([
        tunnel.name,
        status,
        tunnel.connections || '-',
        tunnel.created
      ]);
    }

    console.log(table.toString());

    // Summary
    const connectedCount = tunnels.filter(t => t.isConnected).length;
    console.log();
    console.log(chalk.gray(`Connected: ${connectedCount}/${tunnels.length}`));
  }

  console.log();
}
