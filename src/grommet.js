#!/usr/bin/env node

/**
* NPM dependencies
**/
import vorpal from 'vorpal';

/**
* Local dependencies
**/
import versionCommand from './commands/version';
import newCommand from './commands/new';

const cli = vorpal();
cli.use(versionCommand);
cli.use(newCommand);

if (process.argv.length === 2) {
  // this means that only "grommet" has been typed
  // we should launch the CLI in this case
  cli
    .delimiter(cli.chalk.magenta('grommet~$'))
    .show();
} else {
  // this means that more than "grommet" has been typed
  // we should execute the command instead
  cli.delimiter('').parse(process.argv);
}
