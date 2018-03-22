#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const shelljs = require('shelljs');

const grommet = require('commander');

const { generateProject, runModulesInstall } = require('./utils/cli');

const fileExists = (filePath) => {
  /* eslint-disable no-empty */
  try {
    fs.statSync(filePath);
    return true;
  } catch (error) {
  }
  return false;
  /* eslint-enable no-empty */
};

grommet
  .version('6.0.0-beta.1')
  .command('new <app>')
  .action((app) => {
    const basePath = path.resolve(process.cwd());

    const newAppPath = path.join(basePath, app);

    if (fileExists(newAppPath)) {
      throw new Error(`[grommet] Error while creating app. Directory "${newAppPath}" already exists.`);
    }
    mkdirp(newAppPath, (err) => {
      if (err) {
        throw err;
      }
      const templateFolder = path.resolve(path.join('templates', 'basic'));

      try {
        generateProject(templateFolder, newAppPath, { app }).then(() => {
          console.log('[grommet] App generation successfully completed');
          runModulesInstall(newAppPath);
        })
        // if something fails during the installation of modules the cli should NOT fail.
          .catch(() => process.exit(0));
      } catch (unexpectedError) {
        shelljs.rm('-rf', newAppPath);
        throw unexpectedError;
      }
    });
  });

grommet.parse(process.argv);
