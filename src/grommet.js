#!/usr/bin/env node
require('babel-register');

/**
* NPM dependencies
**/
import vorpal from 'vorpal';

/**
* Local dependencies
**/
import versionCommand from './commands/version';
import newCommand from './commands/new';
import copyCommand from './commands/copy';

const cli = vorpal();
cli.use(copyCommand);
cli.use(newCommand);
cli.use(versionCommand);

if (process.argv.length === 2) {
  // this means that only 'grommet' has been typed
  // we should launch the CLI in this case
  cli
    .delimiter(cli.chalk.magenta('grommet~$'))
    .show();
} else {
  // this means that more than 'grommet' has been typed
  // we should execute the command instead
  cli.parse(process.argv);
}
