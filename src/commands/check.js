/**
* NPM dependencies
**/
import chalk from 'chalk';
import emoji from 'node-emoji';
import prettyHrtime from 'pretty-hrtime';

import { delimiter, errorHandler, runLinters, runTests } from './utils';

export default function (vorpal) {
  vorpal
    .command(
      'check',
      'Runs Javascript/SASS linters and execute tests for your project'
    )
    .option(
      '-j, --jslint',
      `Whether to run only js lint.`
    )
    .option(
      '-s, --scsslint',
      `Whether to run only scss lint.`
    )
    .option(
      '-t, --test',
      `Whether to run only tests.`
    )
    .action((args, cb) => {
      const timeId = process.hrtime();

      runLinters(args.options)
        .then(() => runTests(args.options))
        .then(() => {
          console.log(
            `${delimiter}: ${chalk.green('success')}`
          );

          const t = process.hrtime(timeId);
          console.log(`${emoji.get('sparkles')} ${prettyHrtime(t)}`);
          cb();
        }).catch(err => {
          errorHandler(err);
          process.exit(1);
        });
    });
};
