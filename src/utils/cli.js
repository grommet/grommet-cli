/**
* Node core dependencies
**/
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

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

export function dependenciesSupported(nodeVersion, npmVersion) {
  if (!nodeVersionSupported(nodeVersion) || !npmVersionSupported(npmVersion)) {
    console.error(
      `[${grommetDelimiter}] Grommet requires Node v${supportedNodeVersion}+ and NPM v${supportedNpmVersion}+.`);
    console.error(
      `[${grommetDelimiter}] Currently you have Node ${process.version} and NPM ${npmVersion}`
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
      appName: options.app,
      appTitle: capitalize(options.app.replace(/-|_/g, ' ')),
      appDescription: options.description,
      appRepository: options.repository,
      appLicense: options.license,
      appTheme: themes[options.theme]
    };

    console.log(`[${config.delimiter}] Generating app at: ${to}`);
    const walker  = walk.walk(from, { followLinks: false });

    walker.on('file', (root, stat, next) => {
      const source = path.join(root, stat.name);
      const destinationFolder = path.join(to, root.split(from)[1]);
      const destinationFile = path.join(destinationFolder, stat.name);

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
    });

    walker.on('end', resolve);
  });
}

export function runNpmInstall (cwd, config) {
  return new Promise((resolve) => {
    console.log(
      `[${config.delimiter}] App generation successfully completed`
    );
    console.log(
      `[${config.delimiter}] Installing Grommet dependencies...`
    );
    console.log(
      `[${config.delimiter}] If the install fails, make sure to delete your node_modules and run 'npm install' again...`
    );
    spawn(
      'npm', ['install'], { stdio: 'inherit', cwd: cwd }
    ).on('close', resolve);
  });
}

export function nodeVersionSupported(nodeVersion) {
  return nodeVersion >= Number(supportedNodeVersion);
}

export function npmVersionSupported(npmVersion) {
  return npmVersion >= Number(supportedNpmVersion);
}

export default {
  capitalize, dependenciesSupported, fileExists, generateProject,
  nodeVersionSupported, npmVersionSupported, runNpmInstall, themes
};
