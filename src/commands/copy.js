/**
* NPM dependencies
**/
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import stream from 'stream';
import os from 'os';

/**
* NPM dependencies
**/
import { transform } from 'babel-core';
import chalk from 'chalk';
import mkdirp from 'mkdirp';
import glob from 'glob';
import globToRegExp from 'glob-to-regexp';
import emoji from 'node-emoji';
import prettyHrtime from 'pretty-hrtime';

/**
* Local dependencies
**/
import { getBabelConfig, loadConfig } from '../utils/cli';

const config = loadConfig();

const cpuCount = os.cpus().length;
const delimiter = chalk.magenta('[grommet:copy]');

function errorHandler(err) {
  console.log(
    `${delimiter}: ${chalk.red('failed')}`
  );
  console.error(err);
  process.exit(1);
}

class BabelTransform extends stream.Transform {
  _transform(chunk, enc, next) {
    if (!this._buffer) {
      this._buffer = '';
    }
    this._buffer += chunk.toString();
    next();
  }

  _flush(done) {
    this.push(transform(this._buffer, getBabelConfig()).code);
    this._buffer = undefined;
    done();
  }
}

function copyFile(file, destination, runBabel) {
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(destination), (err) => {
      if (err) {
        reject(err);
      } else {
        const readStream = fs.createReadStream(file);
        const writeStream = fs.createWriteStream(destination);

        if (runBabel) {
          readStream.pipe(new BabelTransform()).pipe(writeStream);
        } else {
          readStream.pipe(writeStream);
        }

        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      }
    });
  });
}

function copyPaths(paths, copy) {
  return new Promise((resolve, reject) => {
    const copyPromises = [];
    paths.forEach((currentPath) => {
      currentPath = currentPath;
      let destination = config.fullDestination;
      let runBabel = false;
      copy.some((asset) => {
        const pattern = asset.asset || asset;

        const srcPath = currentPath.replace(config.base, '').substring(1);

        const regex = globToRegExp(pattern, { globstar: true });
        if (regex.test(srcPath)) {
          // removing wildcards to create the basename
          const baseName = pattern.replace(/\*|\!/g, '');
          destination = path.join(
            path.resolve(asset.dist || destination),
            baseName !== srcPath ?
              srcPath.replace(baseName, '') : srcPath
            // make sure to remove the matching part out of the final path
          );
          runBabel = asset.babel;
          return true;
        }
      });

      copyPromises.push(copyFile(currentPath, destination, runBabel));
    });
    Promise.all(copyPromises).then(resolve, reject);
  });
}

function copyChunkExec(chunckedPaths) {
  return new Promise((resolve, reject) => {
    exec(
      `grommet copy -p ${chunckedPaths.join(',').replace(' ', '%20')}`,
      err => {
        if (err) {
          reject(err);
        }
        resolve();
      });
  });
}

function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getPathsByAsset (asset) {
  return new Promise((resolve, reject) => {
    const assetPath = path.join(
      config.base, asset.asset ? asset.asset : asset
    );
    const ignore = ['.DS_Store', '**/.DS_Store'].concat(asset.ignores || []);
    glob(assetPath, { nodir: true, dot: true, ignore },
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

function copyAssets(assets) {
  return new Promise((resolve, reject) => {
    const pathsPromises = [];
    let pathsArray = [];
    assets.forEach(
      (asset) => {
        const pathsPromise = getPathsByAsset(asset);
        pathsPromises.push(pathsPromise);
        pathsPromise.then(paths => {
          pathsArray = pathsArray.concat(paths);
        }, reject);
      }
    );
    Promise.all(pathsPromises).then(() => {
      if (pathsArray.length > 500 && cpuCount >= 2) {
        // too many items, need to spawn process (if machine has multi-core)
        const paths = shuffle(pathsArray);
        const chunckedPromises = [];
        const chunkSize = Math.ceil(paths.length / cpuCount);
        for (let i = 0; i < paths.length; i += chunkSize) {
          const chunkedPaths = paths.slice(i, i + chunkSize);
          const chunckedPromise = copyChunkExec(chunkedPaths);
          chunckedPromises.push(chunckedPromise);
        }
        Promise.all(chunckedPromises).then(resolve, reject);
      } else {
        copyPaths(pathsArray, assets).then(resolve, reject);
      }
    }, reject);
  });
}

export default function (vorpal) {
  vorpal
    .command(
      'copy',
      'Uses copy entry in local grommet configuration to move files to ' +
      'the distribution folder'
    )
    .option(
      '-p, --paths [paths]',
      `Comma-separated paths of content to copy.`
    )
    .action((args, cb) => {

      if (!config.copy) {
        console.warn(
          `${delimiter}: ${chalk.yellow('Nothing to copy, you need to specify copy entry inside grommet-toolbox.config.js.')}`
        );

        cb();
      } else {
        const sucessLabel = `${emoji.get('sparkles')}`;
        const timeId = process.hrtime();

        if (args.options && args.options.paths) {
          console.log(
            `${delimiter}: Copying paths to distribution folder...`
          );

          copyPaths(
             unescape(args.options.paths).split(','), config.copy
          ).then(() => {
            console.log(
              `${delimiter}: Paths successfully copied...`
            );
            const t = process.hrtime(timeId);
            console.log(`${sucessLabel} ${prettyHrtime(t)}`);
            cb();
          })
          .catch(errorHandler);
        } else {
          console.log(
            `${delimiter}: ${emoji.get('hourglass')} Copying files to distribution folder...`
          );

          copyAssets(
            config.copy
          ).then(() => {
            console.log(
              `${delimiter}: ${chalk.green('success')}`
            );
            const t = process.hrtime(timeId);
            console.log(`${sucessLabel} ${prettyHrtime(t)}`);
            cb();
          }).catch(errorHandler);
        }
      }
    });
};
