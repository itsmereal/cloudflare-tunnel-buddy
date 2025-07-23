import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { createTunnel } from '../lib/tunnel-manager.js';
import { logger } from '../utils/logger.js';
import { selectWithNavigation, confirmWithCancel, NavigationError } from '../utils/navigation.js';
import { 
  validateTunnelName, 
  validateUrl, 
  validateHostname,
  validatePort 
} from '../utils/validation.js';

async function getTunnelName() {
  return await input({
    message: 'Tunnel name:',
    validate: validateTunnelName
  });
}

async function getServiceType() {
  return await selectWithNavigation({
    message: 'Service type:',
    choices: [
      { value: 'http', name: 'HTTP/HTTPS web service' },
      { value: 'tcp', name: 'TCP service (SSH, database, etc.)' },
      { value: 'custom', name: 'Custom URL' }
    ]
  });
}

async function getHttpConfig() {
  const protocol = await selectWithNavigation({
    message: 'Protocol:',
    choices: [
      { value: 'http', name: 'HTTP' },
      { value: 'https', name: 'HTTPS' }
    ]
  });
  
  const host = await input({
    message: 'Host (e.g., localhost or 127.0.0.1):',
    default: 'localhost'
  });
  
  const port = await input({
    message: 'Port:',
    default: protocol === 'https' ? '443' : '80',
    validate: validatePort
  });
  
  return `${protocol}://${host}:${port}`;
}

async function getTcpConfig() {
  const tcpType = await selectWithNavigation({
    message: 'TCP service type:',
    choices: [
      { value: 'ssh', name: 'SSH' },
      { value: 'rdp', name: 'RDP (Remote Desktop)' },
      { value: 'tcp', name: 'Generic TCP' }
    ]
  });
  
  const host = await input({
    message: 'Host:',
    default: 'localhost'
  });
  
  const port = await input({
    message: 'Port:',
    default: tcpType === 'ssh' ? '22' : tcpType === 'rdp' ? '3389' : '8080',
    validate: validatePort
  });
  
  return `${tcpType}://${host}:${port}`;
}

async function getCustomUrl() {
  return await input({
    message: 'Service URL:',
    validate: validateUrl
  });
}

async function getHostname() {
  const useHostname = await confirmWithCancel({
    message: 'Do you want to assign a hostname?',
    default: true
  });
  
  if (!useHostname) return null;
  
  return await input({
    message: 'Hostname (e.g., app.example.com):',
    validate: validateHostname
  });
}

export async function addCommandInteractive() {
  const steps = [
    { name: 'Tunnel Name', fn: getTunnelName },
    { name: 'Service Type', fn: getServiceType },
    { name: 'Service Configuration', fn: null }, // Dynamic based on service type
    { name: 'Hostname', fn: getHostname },
    { name: 'Confirmation', fn: null }
  ];
  
  let currentStep = 0;
  const answers = {};
  
  try {
    console.clear();
    console.log('Create a new Cloudflare tunnel');
    console.log('Use "Go back" to navigate between steps');
    console.log();
    
    while (currentStep < steps.length) {
      const step = steps[currentStep];
      
      try {
        console.log(`Step ${currentStep + 1} of ${steps.length}: ${step.name}`);
        console.log();
        
        switch (currentStep) {
          case 0: // Tunnel name
            answers.name = await getTunnelName();
            break;
            
          case 1: // Service type
            answers.serviceType = await getServiceType();
            break;
            
          case 2: // Service configuration
            if (answers.serviceType === 'http') {
              answers.url = await getHttpConfig();
            } else if (answers.serviceType === 'tcp') {
              answers.url = await getTcpConfig();
            } else {
              answers.url = await getCustomUrl();
            }
            break;
            
          case 3: // Hostname
            answers.hostname = await getHostname();
            break;
            
          case 4: // Confirmation
            console.log('Review your tunnel configuration:');
            console.log();
            console.log('Name:', answers.name);
            console.log('URL:', answers.url);
            if (answers.hostname) {
              console.log('Hostname:', answers.hostname);
            }
            console.log();
            
            const proceed = await confirmWithCancel({
              message: 'Create this tunnel?',
              default: true
            });
            
            if (proceed) {
              // Create the tunnel
              const tunnel = await createTunnel(answers.name, { 
                url: answers.url, 
                hostname: answers.hostname 
              });
              
              console.log();
              console.log(`Tunnel '${answers.name}' created successfully!`);
              console.log();
              console.log('To start the tunnel, run:');
              console.log(`  cf-tunnel-buddy start ${answers.name}`);
              return;
            } else {
              currentStep--; // Go back to previous step
            }
            break;
        }
        
        currentStep++;
        
      } catch (error) {
        const result = handleNavigationError(error);
        if (result === 'back') {
          if (currentStep > 0) {
            currentStep--;
            console.clear();
            console.log('Create a new Cloudflare tunnel');
            console.log('Use "Go back" to navigate between steps');
            console.log();
          } else {
            throw new NavigationError('back'); // Go back to main menu
          }
        } else if (result === 'cancel') {
          throw new NavigationError('cancel');
        }
        // If not a navigation error, re-throw
        throw error;
      }
    }
    
  } catch (error) {
    if (error instanceof NavigationError) {
      throw error; // Let parent handle navigation
    } else {
      logger.error(`Failed to create tunnel: ${error.message}`);
    }
  }
}

function handleNavigationError(error) {
  if (error instanceof NavigationError) {
    return error.action;
  }
  throw error;
}