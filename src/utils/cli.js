require('babel-register');

/**
* Node core dependencies
**/
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
* NPM dependencies
**/
import ejs from 'ejs';
import mkdirp from 'mkdirp';
import walk from 'walk';

const spawn = childProcess.spawn;

const supportedNodeVersion = '4.4';
const supportedNpmVersion = '3';

export const themes = {
  grommet: 'grommet/scss/vanilla/index',
  hpe: 'grommet/scss/hpe/index',
  aruba: 'grommet/scss/aruba/index',
  hpinc: 'grommet/scss/hpinc/index'
};

export function capitalize(str) {
  var words = str.split(' ');

  words = words.map((word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  return words.join(' ');
}

export function dependenciesSupported(config) {
  if (!nodeVersionSupported(config.nodeVersion) ||
    !npmVersionSupported(config.npmVersion)) {
    console.error(
      `[${config.delimiter}] Grommet requires Node v${supportedNodeVersion}+ and NPM v${supportedNpmVersion}+.`);
    console.error(
      `[${config.delimiter}] Currently you have Node ${process.version} and NPM ${config.npmVersion}`
    );
    return false;
  }

  return true;
}

export function fileExists(filePath) {
  try {
    fs.statSync(filePath);
    return true;
  } catch(error) {}
  return false;
}

export function generateProject(from, to, options, config) {
  return new Promise((resolve) => {
    const templateVars = {
      appName: options.name,
      appTitle: capitalize(options.name.replace(/-|_/g, ' ')),
      appDescription: options.description,
      appRepository: options.repository,
      appLicense: options.license,
      appTheme: themes[options.theme],
      appVersion: options.version
    };

    console.log(`[${config.delimiter}] Generating app at: ${to}`);
    const walker  = walk.walk(from, { followLinks: false });

    walker.on('file', (root, stat, next) => {
      const source = path.join(root, stat.name);
      const destinationFolder = path.join(to, root.split(from)[1]);
      const destinationFile = path.join(destinationFolder, stat.name);

      const isImageOrEjs = /\.(jpg|jpeg|png|gif|ejs)$/.test(stat.name);
      if (isImageOrEjs) {
        mkdirp(destinationFolder, (err) => {
          if (err) {
            throw err;
          }
          fs.createReadStream(source).pipe(
            fs.createWriteStream(destinationFile)
          );
          next();
        });
      } else {
        ejs.renderFile(source, templateVars, {}, (err, content) => {
          if (err) {
            throw err;
          }
          mkdirp(destinationFolder, (err) => {
            if (err) {
              throw err;
            }
            fs.writeFile(destinationFile, content, (err) => {
              if(err) {
                throw err;
              }
            });
            next();
          });
        });
      }
    });

    walker.on('end', resolve);
  });
}

export function runModulesInstall (cwd, config) {
  return new Promise((resolve) => {
    console.log(
      `[${config.delimiter}] Installing dependencies...`
    );
    console.log(
      `[${config.delimiter}] If the install fails, make sure to delete your node_modules and run 'npm/yarn install' again...`
    );

    // try yarn first
    let command = /^win/.test(os.platform()) ? 'yarn.cmd' : 'yarn';
    spawn(
      command, ['install'], { stdio: 'inherit', cwd: cwd }
    )
      .on('error', () => {
        console.log(
          `[${config.delimiter}] Installing can be faster if you install Yarn (https://yarnpkg.com/)...`
        );
        command = /^win/.test(os.platform()) ? 'npm.cmd' : 'npm';
        spawn(
          command, ['install'], { stdio: 'inherit', cwd: cwd }
        ).on('close', resolve);
      })
      .on('close', (code) => {
        if (code === 0) {
          resolve();
        }
      });
  });
}

export function nodeVersionSupported(nodeVersion) {
  return nodeVersion >= Number(supportedNodeVersion);
}

export function npmVersionSupported(npmVersion) {
  return npmVersion >= Number(supportedNpmVersion);
}

export function getBabelConfig() {
  let babelrcPath = path.resolve(process.cwd(), '.babelrc');
  try {
    fs.accessSync(babelrcPath, fs.F_OK);
  } catch (e) {
    babelrcPath = path.resolve(__dirname, '../../.babelrc');
  }

  return JSON.parse(fs.readFileSync(babelrcPath));
}

export default {
  capitalize, dependenciesSupported, fileExists, generateProject,
  getBabelConfig, nodeVersionSupported, npmVersionSupported,
  runModulesInstall, themes
};
