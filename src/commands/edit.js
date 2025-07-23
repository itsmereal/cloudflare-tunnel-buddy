import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { loadTunnels, updateTunnel } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { validateUrl, validateHostname } from '../utils/validation.js';
import { routeDns, parseCloudflaredTunnels } from '../utils/cloudflare.js';

export async function editCommand(name) {
  try {
    // Load both local and external tunnels, but only show local ones for editing
    const [localTunnels, externalTunnels] = await Promise.all([
      loadTunnels(),
      parseCloudflaredTunnels()
    ]);
    
    // For editing, we primarily work with local tunnels
    // External tunnels need to be synced first before they can be edited
    const editableTunnels = localTunnels;
    const externalNames = new Set(externalTunnels.map(t => t.name));
    const localNames = new Set(localTunnels.map(t => t.name));
    const externalOnlyTunnels = externalTunnels.filter(t => !localNames.has(t.name));
    
    if (editableTunnels.length === 0) {
      if (externalOnlyTunnels.length > 0) {
        logger.info('No local tunnels to edit.');
        console.log();
        console.log(`Found ${externalOnlyTunnels.length} external tunnel(s) that need to be imported first:`);
        for (const tunnel of externalOnlyTunnels) {
          console.log(`  • ${tunnel.name}`);
        }
        console.log();
        console.log('Use the "sync" command to import external tunnels before editing.');
      } else {
        logger.info('No tunnels to edit.');
      }
      return;
    }
    
    let tunnelName = name;
    
    // If no name provided, show selection
    if (!tunnelName) {
      const choices = editableTunnels.map(t => ({
        value: t.name,
        name: `${t.name} (${t.url || 'no url'})${t.hostname ? ` → ${t.hostname}` : ''}`
      }));
      
      if (externalOnlyTunnels.length > 0) {
        choices.push({ value: '__info__', name: chalk.gray(`--- ${externalOnlyTunnels.length} external tunnel(s) available via sync ---`) });
      }
      
      tunnelName = await select({
        message: 'Select tunnel to edit:',
        choices,
        loop: false,
        pageSize: Math.max(10, choices.length)
      });
      
      if (tunnelName === '__info__') {
        logger.info('External tunnels need to be imported first using the sync command.');
        return;
      }
    }
    
    // Find the tunnel
    const tunnel = editableTunnels.find(t => t.name === tunnelName);
    if (!tunnel) {
      logger.error(`Tunnel '${tunnelName}' not found`);
      return;
    }
    
    // Show current configuration
    console.log();
    logger.info('Current configuration:');
    console.log(chalk.gray('  Name:'), tunnel.name);
    console.log(chalk.gray('  URL:'), tunnel.url || '-');
    console.log(chalk.gray('  Hostname:'), tunnel.hostname || '-');
    console.log();
    
    // Select what to edit
    const editChoice = await select({
      message: 'What would you like to edit?',
      choices: [
        { value: 'url', name: 'Service URL' },
        { value: 'hostname', name: 'Hostname' },
        { value: 'both', name: 'Both URL and Hostname' }
      ],
      loop: false
    });
    
    const updates = {};
    
    // Edit URL
    if (editChoice === 'url' || editChoice === 'both') {
      const newUrl = await input({
        message: 'New service URL:',
        default: tunnel.url,
        validate: validateUrl
      });
      updates.url = newUrl;
    }
    
    // Edit hostname
    if (editChoice === 'hostname' || editChoice === 'both') {
      const currentHostname = tunnel.hostname || '';
      const newHostname = await input({
        message: 'New hostname (leave empty to remove):',
        default: currentHostname,
        validate: (value) => {
          if (!value) return true; // Allow empty
          return validateHostname(value);
        }
      });
      
      updates.hostname = newHostname || null;
      
      // If hostname changed and not empty, update DNS route
      if (newHostname && newHostname !== tunnel.hostname) {
        updates.hostnameChanged = true;
      }
    }
    
    // Show changes
    console.log();
    logger.info('Changes to apply:');
    if (updates.url && updates.url !== tunnel.url) {
      console.log(chalk.gray('  URL:'), chalk.red(tunnel.url), '→', chalk.green(updates.url));
    }
    if ('hostname' in updates && updates.hostname !== tunnel.hostname) {
      const oldHost = tunnel.hostname || '(none)';
      const newHost = updates.hostname || '(none)';
      console.log(chalk.gray('  Hostname:'), chalk.red(oldHost), '→', chalk.green(newHost));
    }
    console.log();
    
    const proceed = await confirm({
      message: 'Apply these changes?',
      default: true
    });
    
    if (!proceed) {
      logger.info('Edit cancelled');
      return;
    }
    
    // Apply updates
    const hostnameChanged = updates.hostnameChanged;
    delete updates.hostnameChanged;
    
    await updateTunnel(tunnelName, updates);
    
    // Update DNS route if hostname changed
    if (hostnameChanged) {
      try {
        await routeDns(tunnelName, updates.hostname);
        logger.success('DNS route updated');
      } catch (error) {
        logger.warning(`Could not update DNS route: ${error.message}`);
      }
    }
    
    logger.success(`Tunnel '${tunnelName}' updated successfully`);
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      logger.info('Edit cancelled');
    } else {
      logger.error(`Failed to edit tunnel: ${error.message}`);
    }
  }
}