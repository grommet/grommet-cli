#!/usr/bin/env node
import vorpal from 'vorpal';
import path from 'path';
import fs from 'fs';
import shelljs from 'shelljs';
import mkdirp from 'mkdirp';
import ejs from 'ejs';
import walk from 'walk';
import childProcess from 'child_process';
const spawn = childProcess.spawn;

const cli = vorpal();

const supportedNodeVersion = '4.4';
const supportedNpmVersion = '3';
const grommetDelimiter = cli.chalk.magenta('grommet');

const config = {
  cliPath: path.join(__dirname, '..'),
  cliInstance: require(path.join(__dirname, '..', 'package.json')),
  npmVersion: Number(
    shelljs.exec(
      'npm --version', { silent:true }
    ).stdout.toString().match(/^(\d+\.\d+)/)[1]
  ),
  nodeVersion: Number(process.version.match(/^v(\d+\.\d+)/)[1]),
  appTypes: ['empty', 'full']
};

String.prototype.capitalize = function() {
  var words = this.split(' ');

  words = words.map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return words.join(' ');
};

function fileExists(filePath) {
  try {
    fs.statSync(filePath);
    return true;
  } catch(error) {}
  return false;
}

function nodeVersionSupported(nodeVersion) {
  return nodeVersion >= Number(supportedNodeVersion);
}

function npmVersionSupported(npmVersion) {
  return npmVersion >= Number(supportedNpmVersion);
}

function dependenciesSupported(nodeVersion, npmVersion) {
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

function generateProject(from, to, options) {
  return new Promise((resolve) => {
    const templateVars = {
      appName: options.app,
      appTitle: options.app.replace(/-|_/g, ' ').capitalize(),
      appDescription: options.description,
      appRepository: options.repository,
      appLicense: options.license
    };

    cli.log(`[${grommetDelimiter}] Generating the app at: ${to}`);
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

cli
  .command('version', 'Check the current version of the Grommet CLI')
  .action((args, cb) => {
    cli.log(config.cliInstance.version);
    cb();
  });

cli
  .command(
    'new',
    `Create a new grommet app.
     Check type option for different ways to initialize an app.`
  )
  .option(
    '-t, --type [type]',
    `Type of the generated app (${config.appTypes.join()}). Defaults to empty.
    (You can press tab for autocomplete)`,
    config.appTypes
  )
  .option(
    '-a, --app [app]',
    `Name of the generated app. Defaults to app-name.`
  )
  .option(
    '-d, --description [description]',
    `Quick description of the app. Defaults to empty.`
  )
  .option(
    '-r, --repository [repository]',
    `Repository URL of the project. Defaults to empty.`
  )
  .option(
    '-l, --license [license]',
    `Project license. Defaults to empty.`
  )
  .validate((args) => {
    if (args.options.type && !config.appTypes.includes(args.options.type)) {
      return `Invalid type. Available types are: ${config.appTypes.join()}`;
    }
    return true;
  })
  .action((args, cb) => {
    if (!dependenciesSupported(config.nodeVersion, config.npmVersion)) {
      throw 'Unsupported version.';
    }
    const options = Object.assign({
      type: 'empty',
      app: 'app-name',
      description: '',
      repository: '',
      license: ''
    }, args.options);

    cli.activeCommand.prompt({
      type: 'input',
      name: 'basePath',
      default: process.cwd(),
      message: 'Destination folder (if empty, current folder will be used)?'
    }, (result) => {
      options.basePath = path.resolve(result.basePath);

      const newAppPath = path.join(options.basePath, options.app);

      if (fileExists(newAppPath)) {
        throw `[${grommetDelimiter}] Error while creating app. Directory "${newAppPath}" already exists.`;
      }
      mkdirp(newAppPath, (err) => {
        if (err) {
          throw err;
        }
        var templateFolder = path.join(config.cliPath, 'templates', options.type);

        try {
          generateProject(templateFolder, newAppPath, options).then(() => {
            cli.log(
              `[${grommetDelimiter}] App generation successfully completed`
            );
            cli.log(
              `[${grommetDelimiter}] Installing Grommet dependencies...`
            );
            cli.log(
              `[${grommetDelimiter}] If the install fails, make sure to delete your node_modules and run 'npm install' again...`
            );
            spawn(
              'npm', ['install'], { stdio: 'inherit', cwd: newAppPath }
            ).on('close', cb);
          });
        } catch(err) {
          shelljs.rm('-rf', newAppPath);
          throw err;
        }
      });
    });
  });

cli
  .delimiter(`${grommetDelimiter}~$`)
  .show();
