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

cli
  .delimiter(cli.chalk.magenta('grommet~$'))
  .show();
