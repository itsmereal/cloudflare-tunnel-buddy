import { 
  checkCloudflaredInstalled, 
  checkAuthenticated, 
  login,
  createTunnel as cfCreateTunnel,
  deleteTunnel as cfDeleteTunnel,
  routeDns,
  runTunnel as cfRunTunnel
} from '../utils/cloudflare.js';
import { 
  addTunnel, 
  removeTunnel as removeFromConfig, 
  updateTunnel,
  getTunnel 
} from '../utils/config.js';
import { logger } from '../utils/logger.js';

const runningTunnels = new Map();

export async function ensureAuthenticated() {
  const installed = await checkCloudflaredInstalled();
  if (!installed) {
    throw new Error('cloudflared is not installed. Please install it first: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation');
  }
  
  const authenticated = await checkAuthenticated();
  if (!authenticated) {
    logger.info('You need to authenticate with Cloudflare first.');
    await login();
  }
}

export async function createTunnel(name, config) {
  await ensureAuthenticated();
  
  // Create tunnel in Cloudflare
  const tunnelId = await cfCreateTunnel(name);
  
  // Add DNS route if hostname provided
  if (config.hostname) {
    await routeDns(name, config.hostname);
  }
  
  // Save to local config
  const tunnel = {
    name,
    id: tunnelId,
    ...config,
    createdAt: new Date().toISOString()
  };
  
  await addTunnel(tunnel);
  
  return tunnel;
}

export async function removeTunnel(name) {
  const tunnel = await getTunnel(name);
  if (!tunnel) {
    throw new Error(`Tunnel '${name}' not found in configuration`);
  }
  
  // Stop if running
  if (runningTunnels.has(name)) {
    await stopTunnel(name);
  }
  
  // Try to delete from Cloudflare
  try {
    await cfDeleteTunnel(name);
  } catch (error) {
    logger.warning(`Could not delete tunnel from Cloudflare: ${error.message}`);
  }
  
  // Remove from local config
  await removeFromConfig(name);
}

export async function startTunnel(name, options = {}) {
  const tunnel = await getTunnel(name);
  if (!tunnel) {
    throw new Error(`Tunnel '${name}' not found`);
  }

  if (runningTunnels.has(name)) {
    throw new Error(`Tunnel '${name}' is already running`);
  }

  await ensureAuthenticated();

  const subprocess = cfRunTunnel(tunnel, { background: options.background });
  const pid = subprocess.pid;

  // Store tunnel info
  runningTunnels.set(name, { subprocess, pid });

  // Handle process events
  subprocess.on('exit', () => {
    runningTunnels.delete(name);
  });

  subprocess.on('error', () => {
    runningTunnels.delete(name);
  });

  // For background processes, return immediately (don't await)
  // The subprocess is already running detached
  return { subprocess, pid };
}

export async function stopTunnel(name) {
  const tunnelInfo = runningTunnels.get(name);
  if (!tunnelInfo) {
    throw new Error(`Tunnel '${name}' is not running`);
  }

  // Kill the process
  const { subprocess, pid } = tunnelInfo;
  if (subprocess && subprocess.kill) {
    subprocess.kill('SIGTERM');
  } else if (pid) {
    // For background processes, kill by PID
    try {
      process.kill(pid, 'SIGTERM');
    } catch (e) {
      // Process may already be dead
    }
  }
  runningTunnels.delete(name);
}

export function isRunning(name) {
  return runningTunnels.has(name);
}

export function getRunningTunnels() {
  return Array.from(runningTunnels.keys());
}