import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

export class NavigationError extends Error {
  constructor(action) {
    super(`Navigation: ${action}`);
    this.name = 'NavigationError';
    this.action = action;
  }
}

export async function selectWithNavigation(options) {
  const choices = [
    ...options.choices,
    { value: '__back__', name: '← Go back' },
    { value: '__cancel__', name: '✕ Cancel' }
  ];

  const answer = await select({
    ...options,
    choices,
    loop: false,
    pageSize: Math.max(10, choices.length)
  });

  if (answer === '__back__') {
    throw new NavigationError('back');
  }
  if (answer === '__cancel__') {
    throw new NavigationError('cancel');
  }

  return answer;
}

export async function confirmWithCancel(options) {
  const answer = await select({
    message: options.message,
    choices: [
      { value: true, name: options.default !== false ? 'Yes' : 'No' },
      { value: false, name: options.default !== false ? 'No' : 'Yes' },
      { value: '__cancel__', name: chalk.gray('✕ Cancel') }
    ],
    loop: false
  });

  if (answer === '__cancel__') {
    throw new NavigationError('cancel');
  }

  return answer;
}

export async function showMainMenu() {
  console.clear();
  console.log('Cloudflare Tunnel Buddy');
  console.log('Interactive CLI for managing Cloudflare tunnels');
  console.log();

  const choice = await select({
    message: 'What would you like to do?',
    choices: [
      { value: 'add', name: 'Create a new tunnel' },
      { value: 'list', name: 'List all tunnels' },
      { value: 'start', name: 'Start a tunnel' },
      { value: 'stop', name: 'Stop a tunnel' },
      { value: 'status', name: 'Check tunnel status' },
      { value: 'edit', name: 'Edit a tunnel' },
      { value: 'remove', name: 'Remove a tunnel' },
      { value: 'sync', name: 'Import external tunnels' },
      { value: 'reset', name: 'Reset configuration' },
      { value: 'exit', name: 'Exit' }
    ],
    loop: false,
    pageSize: 11
  });

  return choice;
}

export function handleNavigationError(error, context = '') {
  if (error instanceof NavigationError) {
    if (error.action === 'back') {
      return 'back';
    } else if (error.action === 'cancel') {
      return 'cancel';
    }
  }
  throw error;
}