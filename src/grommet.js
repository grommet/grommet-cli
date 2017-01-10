#!/usr/bin/env node
require('babel-register');
require('dotenv').config({silent: true});

/**
* NPM dependencies
**/
import vorpal from 'vorpal';

/**
* Local dependencies
**/
import checkCommand from './commands/check';
import newCommand from './commands/new';
import packCommand from './commands/pack';
import versionCommand from './commands/version';

const cli = vorpal();
cli.use(checkCommand);
cli.use(newCommand);
cli.use(packCommand);
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
