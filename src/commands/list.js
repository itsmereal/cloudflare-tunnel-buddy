import Table from 'cli-table3';
import chalk from 'chalk';
import { loadTunnels } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { isRunning } from '../lib/tunnel-manager.js';
import { parseCloudflaredTunnels } from '../utils/cloudflare.js';

export async function listCommand() {
  try {
    console.log('Loading tunnels...');
    
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
      console.log('No tunnels found.');
      console.log();
      console.log('To create a tunnel:');
      console.log('  cf-tunnel-buddy add');
      return;
    }
    
    const table = new Table({
      head: ['Name', 'URL', 'Hostname', 'Status', 'Source'],
      style: {
        head: [],
        border: []
      }
    });
    
    for (const tunnel of tunnels) {
      const running = isRunning(tunnel.name);
      const status = running ? '● Running' : '○ Stopped';
      const source = tunnel.source === 'local' ? 'Local' : 'External';
      
      table.push([
        tunnel.name,
        tunnel.url || '-',
        tunnel.hostname || '-',
        status,
        source
      ]);
    }
    
    console.log(table.toString());
    console.log();
    console.log(`Total: ${tunnels.length} tunnel${tunnels.length !== 1 ? 's' : ''}`);
    console.log(`Local: ${localTunnels.length}, External: ${externalTunnels.length - localTunnels.length}`);
    
  } catch (error) {
    console.log(`Failed to list tunnels: ${error.message}`);
  }
}