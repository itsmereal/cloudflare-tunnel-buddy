import { select, confirm } from '@inquirer/prompts';
import { parseCloudflaredTunnels } from '../utils/cloudflare.js';
import { loadTunnels, addTunnel } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function syncCommand() {
  try {
    console.log('Fetching tunnels from Cloudflare...');
    
    const [localTunnels, externalTunnels] = await Promise.all([
      loadTunnels(),
      parseCloudflaredTunnels()
    ]);
    
    // Find tunnels that exist in Cloudflare but not locally
    const localNames = new Set(localTunnels.map(t => t.name));
    const newTunnels = externalTunnels.filter(t => !localNames.has(t.name));
    
    if (newTunnels.length === 0) {
      console.log('All Cloudflare tunnels are already tracked locally.');
      return;
    }
    
    console.log();
    console.log(`Found ${newTunnels.length} tunnel(s) in Cloudflare that are not tracked locally:`);
    console.log();
    
    for (const tunnel of newTunnels) {
      console.log(`  • ${tunnel.name} (${tunnel.id})`);
    }
    
    console.log();
    const importAll = await confirm({
      message: 'Import all external tunnels?',
      default: true
    });
    
    if (importAll) {
      // Import all tunnels
      for (const tunnel of newTunnels) {
        const localTunnel = {
          name: tunnel.name,
          id: tunnel.id,
          url: null,
          hostname: null,
          createdAt: tunnel.created,
          imported: true,
          importedAt: new Date().toISOString()
        };
        
        await addTunnel(localTunnel);
        console.log(`Imported: ${tunnel.name}`);
      }
      
      console.log();
      console.log(`Successfully imported ${newTunnels.length} tunnel(s)!`);
      console.log();
      console.log('Note: Imported tunnels will show URL as "-" until you edit them.');
      console.log('Use "Edit tunnel" to add URL and hostname information.');
      
    } else {
      // Let user select which tunnels to import
      const choices = newTunnels.map(t => ({
        value: t.name,
        name: `${t.name} (ID: ${t.id.substring(0, 8)}...)`
      }));
      
      const selectedNames = await select({
        message: 'Select tunnels to import:',
        choices: [
          ...choices,
          { value: '__none__', name: 'None - cancel import' }
        ],
        loop: false,
        pageSize: Math.max(10, choices.length + 1)
      });
      
      if (selectedNames === '__none__') {
        console.log('Import cancelled.');
        return;
      }
      
      // Import selected tunnel
      const selectedTunnel = newTunnels.find(t => t.name === selectedNames);
      if (selectedTunnel) {
        const localTunnel = {
          name: selectedTunnel.name,
          id: selectedTunnel.id,
          url: null,
          hostname: null,
          createdAt: selectedTunnel.created,
          imported: true,
          importedAt: new Date().toISOString()
        };
        
        await addTunnel(localTunnel);
        console.log(`Imported: ${selectedTunnel.name}`);
      }
    }
    
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log('Sync cancelled');
    } else {
      console.log(`Failed to sync tunnels: ${error.message}`);
    }
  }
}