import { execa } from 'execa';
import { logger } from './logger.js';

export async function checkCloudflaredInstalled() {
  try {
    await execa('cloudflared', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function checkAuthenticated() {
  try {
    const { stdout } = await execa('cloudflared', ['tunnel', 'list'], { reject: false });
    return !stdout.includes('Please login');
  } catch {
    return false;
  }
}

export async function login() {
  const spinner = logger.spinner('Opening browser for Cloudflare authentication...');
  spinner.start();
  
  try {
    await execa('cloudflared', ['tunnel', 'login'], { stdio: 'inherit' });
    spinner.succeed('Successfully authenticated with Cloudflare');
    return true;
  } catch (error) {
    spinner.fail('Authentication failed');
    throw error;
  }
}

export async function createTunnel(name) {
  const spinner = logger.spinner(`Creating tunnel '${name}'...`);
  spinner.start();
  
  try {
    const { stdout } = await execa('cloudflared', ['tunnel', 'create', name]);
    spinner.succeed(`Tunnel '${name}' created successfully`);
    
    // Extract tunnel ID from output
    const match = stdout.match(/([a-f0-9-]{36})/);
    return match ? match[1] : null;
  } catch (error) {
    spinner.fail(`Failed to create tunnel '${name}'`);
    throw error;
  }
}

export async function deleteTunnel(name) {
  const spinner = logger.spinner(`Deleting tunnel '${name}'...`);
  spinner.start();
  
  try {
    await execa('cloudflared', ['tunnel', 'delete', name]);
    spinner.succeed(`Tunnel '${name}' deleted successfully`);
  } catch (error) {
    spinner.fail(`Failed to delete tunnel '${name}'`);
    throw error;
  }
}

export async function routeDns(tunnelName, hostname) {
  const spinner = logger.spinner(`Adding DNS route for ${hostname}...`);
  spinner.start();
  
  try {
    await execa('cloudflared', ['tunnel', 'route', 'dns', tunnelName, hostname]);
    spinner.succeed(`DNS route added for ${hostname}`);
  } catch (error) {
    spinner.fail(`Failed to add DNS route for ${hostname}`);
    throw error;
  }
}

export function runTunnel(config) {
  const args = ['tunnel', 'run'];
  
  if (config.url) {
    args.push('--url', config.url);
  }
  
  // Add SSL options for local development
  if (config.url && config.url.startsWith('http://')) {
    // For HTTP origins, no special SSL handling needed
  } else if (config.url && config.url.startsWith('https://')) {
    // For HTTPS origins with self-signed certs (like Local by Flywheel)
    args.push('--no-tls-verify');
  }
  
  args.push(config.name);
  
  const subprocess = execa('cloudflared', args, { 
    stdio: 'inherit',
    cleanup: true
  });
  
  return subprocess;
}

export async function listCloudflaredTunnels() {
  try {
    const { stdout } = await execa('cloudflared', ['tunnel', 'list']);
    return stdout;
  } catch (error) {
    throw new Error('Failed to list tunnels from Cloudflare');
  }
}

export async function parseCloudflaredTunnels() {
  try {
    const { stdout } = await execa('cloudflared', ['tunnel', 'list']);
    const lines = stdout.split('\n');
    const tunnels = [];
    
    // Skip header lines and find the data
    let dataStarted = false;
    for (const line of lines) {
      if (line.includes('ID') && line.includes('NAME') && line.includes('CREATED')) {
        dataStarted = true;
        continue;
      }
      
      if (dataStarted && line.trim()) {
        // Parse line format: ID NAME CREATED CONNECTIONS
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const [id, name, created, ...connectionParts] = parts;
          const connections = connectionParts.join(' ');
          
          tunnels.push({
            id: id.trim(),
            name: name.trim(),
            created: created.trim(),
            connections: connections.trim(),
            source: 'cloudflare'
          });
        }
      }
    }
    
    return tunnels;
  } catch (error) {
    console.error('Failed to parse Cloudflare tunnels:', error.message);
    return [];
  }
}

export async function getTunnelInfo(name) {
  try {
    const { stdout } = await execa('cloudflared', ['tunnel', 'info', name]);
    return stdout;
  } catch {
    return null;
  }
}