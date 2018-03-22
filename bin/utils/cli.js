/**
* Node core dependencies
* */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const os = require('os');

/**
* NPM dependencies
* */
const ejs = require('ejs');
const mkdirp = require('mkdirp');
const walk = require('walk');

module.exports = {
  generateProject: (from, to, options) => new Promise((resolve) => {
    const templateVars = {
      appName: options.app,
    };

    console.log(`[grommet] Generating app at: ${to}`);
    console.log('$$$ from', from);
    const walker = walk.walk(from, { followLinks: false });

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
          fs.createReadStream(source).pipe(fs.createWriteStream(destinationFile));
          next();
        });
      } else {
        ejs.renderFile(source, templateVars, {}, (err, content) => {
          if (err) {
            throw err;
          }
          mkdirp(destinationFolder, (destFolderErr) => {
            if (destFolderErr) {
              throw destFolderErr;
            }
            fs.writeFile(destinationFile, content, (destFileError) => {
              if (destFileError) {
                throw destFileError;
              }
            });
            next();
          });
        });
      }
    });

    walker.on('end', resolve);
  }),
  runModulesInstall: cwd => new Promise((resolve) => {
    console.log('[grommet] Installing dependencies...');
    console.log('[grommet] If the install fails, make sure to delete your node_modules and run \'npm/yarn install\' again...');

    // try yarn first
    let command = /^win/.test(os.platform()) ? 'yarn.cmd' : 'yarn';
    spawn(command, ['install'], { stdio: 'inherit', cwd })
      .on('error', () => {
        command = /^win/.test(os.platform()) ? 'npm.cmd' : 'npm';
        spawn(command, ['install'], { stdio: 'inherit', cwd }).on('close', resolve);
      })
      .on('close', (code) => {
        if (code === 0) {
          resolve();
        }
      });
  }),
};

