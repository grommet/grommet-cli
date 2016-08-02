/**
* Node core dependencies
**/
import path from 'path';

const cliInstance = require(path.join(__dirname, '../..', 'package.json'));

export default function (vorpal) {
  vorpal
    .command('version', 'Check the current version of this CLI')
    .action((args, cb) => {
      vorpal.activeCommand.log(
        cliInstance.version
      );
      cb();
    });
};
