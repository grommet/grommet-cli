#!/usr/bin/env node
import vorpal from 'vorpal';
import path from 'path';

const cli = vorpal();
const cliPath = path.join(__dirname, '..');
const packageJSON = require(path.join(cliPath, 'package.json'));
const appTypes = ['empty', 'full', 'static'];

cli
  .command('version', 'Check the current version of the Grommet CLI')
  .action((args, cb) => {
    cli.log(packageJSON.version);
    cb();
  });

cli
  .command(
    'new',
    `Create a new grommet app.
     Check type option for different ways to initialize an app.`
  )
  .option(
    '-t, --type [type]',
    `Type of the generated app (${appTypes.join()}). Defaults to empty.
    (You can press tab for autocomplete)`,
    appTypes
  )
  .validate((args) => {
    if (args.options.type && !appTypes.includes(args.options.type)) {
      return `Invalid type. Available types are: ${appTypes.join()}.`;
    }
    return true;
  })
  .action((args, cb) => {
    cli.log('##' + args.options.type);
    cb();
  });

cli
  .delimiter(cli.chalk.magenta('grommet~$'))
  .show();
