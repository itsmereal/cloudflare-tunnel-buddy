import chalk from 'chalk';
import ora from 'ora';

export const logger = {
  info: (message) => console.log(chalk.blue('ℹ'), message),
  success: (message) => console.log(chalk.green('✓'), message),
  error: (message) => console.log(chalk.red('✗'), message),
  warning: (message) => console.log(chalk.yellow('⚠'), message),
  
  table: (data) => {
    console.log(data);
  },
  
  spinner: (text) => {
    const spinner = ora({
      text,
      spinner: 'dots'
    });
    
    return {
      start: () => spinner.start(),
      succeed: (text) => spinner.succeed(text),
      fail: (text) => spinner.fail(text),
      stop: () => spinner.stop(),
      text: (text) => { spinner.text = text; }
    };
  }
};