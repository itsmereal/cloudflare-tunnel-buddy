import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile, access, rm } from 'fs/promises';
import { constants } from 'fs';

const CONFIG_DIR = join(homedir(), '.cf-tunnel-buddy');
const TUNNELS_FILE = join(CONFIG_DIR, 'tunnels.json');
const CREDENTIALS_FILE = join(CONFIG_DIR, 'credentials.json');

export async function ensureConfigDirectory() {
  try {
    await access(CONFIG_DIR, constants.F_OK);
  } catch {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

export async function loadTunnels() {
  try {
    const data = await readFile(TUNNELS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveTunnels(tunnels) {
  await writeFile(TUNNELS_FILE, JSON.stringify(tunnels, null, 2));
}

export async function loadCredentials() {
  try {
    const data = await readFile(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveCredentials(credentials) {
  await writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
}

export async function getTunnel(name) {
  const tunnels = await loadTunnels();
  return tunnels.find(t => t.name === name);
}

export async function addTunnel(tunnel) {
  const tunnels = await loadTunnels();
  const exists = tunnels.some(t => t.name === tunnel.name);
  
  if (exists) {
    throw new Error(`Tunnel '${tunnel.name}' already exists`);
  }
  
  tunnels.push(tunnel);
  await saveTunnels(tunnels);
}

export async function updateTunnel(name, updates) {
  const tunnels = await loadTunnels();
  const index = tunnels.findIndex(t => t.name === name);
  
  if (index === -1) {
    throw new Error(`Tunnel '${name}' not found`);
  }
  
  tunnels[index] = { ...tunnels[index], ...updates };
  await saveTunnels(tunnels);
}

export async function removeTunnel(name) {
  const tunnels = await loadTunnels();
  const filtered = tunnels.filter(t => t.name !== name);
  
  if (filtered.length === tunnels.length) {
    throw new Error(`Tunnel '${name}' not found`);
  }
  
  await saveTunnels(filtered);
}

export async function resetConfig(options = {}) {
  if (options.all) {
    await rm(CONFIG_DIR, { recursive: true, force: true });
  } else if (options.tunnelsOnly) {
    await rm(TUNNELS_FILE, { force: true });
  }
}

export function getConfigPaths() {
  return {
    configDir: CONFIG_DIR,
    tunnelsFile: TUNNELS_FILE,
    credentialsFile: CREDENTIALS_FILE
  };
}