/**
* Node dependencies
**/
import { fork } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
* NPM dependencies
**/
import chalk from 'chalk';
import glob from 'glob';
import emoji from 'node-emoji';
import prettyHrtime from 'pretty-hrtime';

/**
* Local dependencies
**/
import { loadConfig } from '../utils/cli';
import eslint from './eslint-worker';
import { formatResults, formatTotal } from '../utils/eslint-formatter';

const config = loadConfig();

const cpuCount = os.cpus().length;
const delimiter = chalk.magenta('[grommet:eslint]');


function errorHandler(err) {
  console.log(
    `${delimiter}: ${chalk.red('failed')}`
  );
  console.error(err);
  process.exit(1);
}

function eslintPaths(paths) {
  return new Promise((resolve, reject) => {
    const eslintChild = fork(path.resolve(__dirname, 'eslint-worker'));
    eslintChild.on('message', (report) => {
      if (report.errorCount || report.warningCount) {
        console.log(formatResults(report.results));
      }
      resolve(report);
    });
    eslintChild.on('exit', (code) => {
      if (code !== 0) {
        reject('Linting failed');
      }
    });
    eslintChild.send(paths);
  });
}

let ignorePath = path.resolve(config.base, '.eslintignore');
try {
  fs.accessSync(ignorePath, fs.F_OK);
} catch (e) {
  ignorePath = path.resolve(__dirname, '../../.eslintignore');
}

const ignorePaths = fs.readFileSync(
  ignorePath, 'utf8'
).split('\n');

function getPathsByAsset(asset, ignores) {
  return new Promise((resolve, reject) => {
    const ignore = ['.DS_Store', '**/.DS_Store'].concat(
      ignorePaths
    ).concat(ignores || []);
    glob(asset, { cwd: config.base, nodir: true, dot: true, ignore },
      (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      }
    );
  });
}

function lintJsAssets(assets) {
  return new Promise((resolve, reject) => {
    const pathsPromises = [];
    let pathsArray = [];
    const ignores = [];
    assets.filter((asset) => {
      return asset.startsWith('!') ? ignores.push(asset.substring(1)) : true;
    }).forEach(
      (asset) => {
        const pathsPromise = getPathsByAsset(asset, ignores);
        pathsPromises.push(pathsPromise);
        pathsPromise.then(
          paths => pathsArray = pathsArray.concat(paths), reject
        );
      }
    );
    Promise.all(pathsPromises).then(() => {
      const totalCount = {
        errorCount: 0,
        warningCount: 0
      };

      if (pathsArray.length > 500 && cpuCount >= 2) {
        // too many items, need to spawn process (if machine has multi-core)
        const chunckedPromises = [];
        const chunkSize = Math.ceil(pathsArray.length / 2);
        for (let i = 0; i < pathsArray.length; i += chunkSize) {
          const chunkedPaths = pathsArray.slice(i, i + chunkSize);
          const chunckedPromise = eslintPaths(chunkedPaths);
          chunckedPromise.then((report) => {
            totalCount.errorCount += report.errorCount;
            totalCount.warningCount += report.warningCount;
          });
          chunckedPromises.push(chunckedPromise);
        }
        Promise.all(chunckedPromises).then(() => {
          resolve(totalCount);
        }, reject);
      } else {
        eslint(pathsArray).then((report) => {
          if (report.errorCount || report.warningCount) {
            console.log(formatResults(report.results));
          }
          resolve(report);
        }, reject);
      }
    }, reject);
  });
}

export default function (vorpal) {
  vorpal
    .command(
      'eslint',
      'Uses jsAssets entry in local grommet configuration to evaluate js ' +
      'linting issues'
    )
    .action((args, cb) => {

      if (!config.jsAssets) {
        console.warn(
          `${delimiter}: ${chalk.yellow('Nothing to lint, you need to specify jsAssets entry inside grommet-toolbox.config.js.')}`
        );

        cb();
      } else {
        const sucessLabel = `${emoji.get('sparkles')}`;
        const timeId = process.hrtime();

        console.log(
          `${delimiter}: ${emoji.get('hourglass')} Linting javascript files...`
        );

        lintJsAssets(
          config.jsAssets
        ).then((result) => {
          const failed = result.errorCount > 1 || result.warningCount > 1;
          if (failed) {
            console.log(formatTotal(result));
          }
          console.log(
            `${delimiter}: ${
              failed ? chalk.red('failed') : chalk.green('success')
            }`
          );

          if (failed) {
            process.exit(1);
          }

          const t = process.hrtime(timeId);
          console.log(`${sucessLabel} ${prettyHrtime(t)}`);
          cb();
        }).catch(errorHandler);
      }
    });
};
