/**
* NPM dependencies
**/
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import stream from 'stream';

/**
* NPM dependencies
**/
import { transform } from 'babel-core';
import chalk from 'chalk';
import mkdirp from 'mkdirp';
import recursive from 'recursive-readdir';
import emoji from 'node-emoji';

/**
* Local dependencies
**/
import { getBabelConfig, loadConfig, throwError } from '../utils/cli';

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

        writeStream.on('end', resolve);
        writeStream.on('error', reject);
      }
    });
  });
}

function copyPaths(paths, copy) {
  return new Promise((resolve, reject) => {
    const copyPromises = [];
    paths.split(',').forEach((currentPath) => {
      currentPath = unescape(currentPath);
      let destination = path.join(
        process.cwd(), 'dist'
      );
      let runBabel = false;
      copy.some((asset) => {
        const pattern = asset.asset || asset;

        const srcPath = currentPath.replace(process.cwd(), '').substring(1);
        if (srcPath.startsWith(pattern)) {
          destination = path.join(
            path.resolve(asset.dist || destination),
            pattern !== srcPath ? srcPath.replace(pattern, '') : srcPath
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
      (err, stdout) => {
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
      process.cwd(), asset.asset ? asset.asset : asset
    );
    if (fs.lstatSync(assetPath).isDirectory()) {
      recursive(assetPath, ['.DS_Store'].concat(asset.ignores || []),
        (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        }
      );
    } else {
      resolve([assetPath]);
    }
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
      if (pathsArray.length > 500) { // too many items, need to spawn process
        const paths = shuffle(pathsArray);
        const size = 250;
        const chunckedPromises = [];
        for (let i = 0; i < paths.length; i += size) {
          const chunkedPaths = paths.slice(i, i + size);
          const chunckedPromise = copyChunkExec(chunkedPaths);
          chunckedPromises.push(chunckedPromise);
        }
        Promise.all(chunckedPromises).then(resolve, reject);
      } else {
        copyPaths(pathsArray.join(','), assets).then(resolve, reject);
      }
    }, reject);
  });
}

export default function (vorpal) {
  const delimiter = chalk.magenta('[grommet:copy]');
  vorpal
    .command(
      'copy',
      'Uses copy entry in local toolbox configuration to move files to ' +
      'the distribution folder'
    )
    .option(
      '-p, --paths [paths]',
      `Comma-separated paths of content to copy.`
    )
    .action((args, cb) => {
      const config = loadConfig();

      if (!config.copy) {
        console.warn(
          `${delimiter}: ${chalk.yellow('Nothing to copy, you need to specify copy entry inside grommet-toolbox.config.js.')}`
        );

        cb();
      } else {
        console.time(emoji.get('sparkles'));

        if (args.options && args.options.paths) {
          console.log(
            `${delimiter}: Copying paths to distribution folder...`
          );

          copyPaths(
            args.options.paths, config.copy
          ).then(() => {
            console.log(
              `${delimiter}: Paths successfully copied...`
            );
            console.timeEnd(emoji.get('sparkles'));
            cb();
          }, throwError);
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
            console.timeEnd(emoji.get('sparkles'));
            cb();
          }, throwError);
        }
      }
    });
};
