export function validateTunnelName(name) {
  if (!name || typeof name !== 'string') {
    return 'Tunnel name is required';
  }
  
  if (name.length < 3) {
    return 'Tunnel name must be at least 3 characters long';
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    return 'Tunnel name can only contain letters, numbers, hyphens, and underscores';
  }
  
  return true;
}

export function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'tcp:', 'ssh:', 'rdp:'].includes(parsed.protocol)) {
      return 'URL must use http, https, tcp, ssh, or rdp protocol';
    }
    return true;
  } catch {
    return 'Invalid URL format';
  }
}

export function validateHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return 'Hostname is required';
  }
  
  const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  
  if (!hostnameRegex.test(hostname)) {
    return 'Invalid hostname format';
  }
  
  return true;
}

export function validatePort(port) {
  const portNum = parseInt(port, 10);
  
  if (isNaN(portNum)) {
    return 'Port must be a number';
  }
  
  if (portNum < 1 || portNum > 65535) {
    return 'Port must be between 1 and 65535';
  }
  
  return true;
}