/**
* Node dependencies
**/
import path from 'path';
import fs from 'fs';

/**
* NPM dependencies
**/
import chalk from 'chalk';
import emoji from 'node-emoji';
import prettyHrtime from 'pretty-hrtime';
import lint from 'sass-lint';

/**
* Local dependencies
**/
import { loadConfig } from '../utils/cli';

const config = loadConfig();

const delimiter = chalk.magenta('[grommet:scsslint]');

function errorHandler(err) {
  console.log(
    `${delimiter}: ${chalk.red('failed')}`
  );
  console.error(err);
  process.exit(1);
}

let scssLintPath = path.resolve(process.cwd(), '.sass-lint.yml');
try {
  fs.accessSync(scssLintPath, fs.F_OK);
} catch (e) {
  scssLintPath = path.resolve(__dirname, '../.sass-lint.yml');
}

function lintSCSSAssets (assets) {
  return new Promise((resolve) => {
    const result = lint.lintFiles(assets.join(', '), {}, scssLintPath);
    lint.outputResults(result, {}, scssLintPath);
    resolve(result);
  });
}

export default function (vorpal) {
  vorpal
    .command(
      'scsslint',
      'Uses scssAssets entry in local grommet configuration to evaluate your ' +
      'scss code'
    )
    .action((args, cb) => {

      if (!config.scssAssets) {
        console.warn(
          `${delimiter}: ${chalk.yellow('Nothing to lint, you need to specify scssAssets entry inside grommet-toolbox.config.js.')}`
        );

        cb();
      } else {
        const timeId = process.hrtime();

        console.log(
          `${delimiter}: ${emoji.get('hourglass')} Linting SCSS files...`
        );

        lintSCSSAssets(config.scssAssets).then(
          (result) => {
            const failed = lint.resultCount(result);
            console.log(
              `${delimiter}: ${
                failed ? chalk.red('failed') : chalk.green('success')
              }`
            );

            if (failed) {
              process.exit(1);
            }

            const t = process.hrtime(timeId);
            console.log(`${emoji.get('sparkles')} ${prettyHrtime(t)}`);
            cb();
          },
          (err) => {
            console.log(err);
            process.exit(1);
          }
        ).catch(errorHandler);
      }
    });
};
