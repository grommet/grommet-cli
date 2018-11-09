/**
* Node core dependencies
**/
import path from 'path';

/**
* NPM dependencies
**/
import mkdirp from 'mkdirp';
import shelljs from 'shelljs';

/**
* Local dependencies
**/
import {
  dependenciesSupported, fileExists, generateProject, runModulesInstall, themes
} from '../utils/cli';

export default function (vorpal) {
  const config = {
    appTypes: ['app', 'basic', 'docs', 'electron-basic', 'electron-app'],
    appThemes: Object.keys(themes),
    cliPath: path.join(__dirname, '../../'),
    delimiter: vorpal.chalk.magenta('grommet'),
    npmVersion: Number(
      shelljs.exec(
        'npm --version', { silent:true }
      ).stdout.toString().match(/^(\d+\.\d+)/)[1]
    ),
    nodeVersion: Number(process.version.match(/^v(\d+\.\d+)/)[1])
  };

  vorpal
    .command(
      'new [app]',
      `Create a new grommet app.
       Check type option for different ways to initialize an app.`
    )
    .option(
      '-t, --type [type]',
      `Type of the generated app (${config.appTypes.join()}). Defaults to app.
      (You can press tab for autocomplete)`,
      config.appTypes
    )
    .option(
      '--theme [theme]',
      `Theme of the generated app (${config.appThemes.join()}). Defaults to grommet.
      (You can press tab for autocomplete)`,
      config.appThemes
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
    .option(
      '-i, --noInstall',
      `Skip installing modules after generation is completed. Defaults to false.`
    )
    .validate((args) => {
      if (args.options.type && !config.appTypes.includes(args.options.type)) {
        return `Invalid type. Available types are: ${config.appTypes.join()}`;
      }

      if (args.options.theme && !config.appThemes.includes(args.options.theme)) {
        return `Invalid theme. Available themes are: ${config.appThemes.join()}`;
      }
      return true;
    })
    .action((args, cb) => {
      if (!dependenciesSupported(config)) {
        throw 'Unsupported version.';
      }
      const options = Object.assign({
        type: 'app',
        theme: 'grommet',
        app: args.app || 'app-name',
        description: '',
        repository: '',
        license: ''
      }, args.options);

      vorpal.activeCommand.prompt({
        type: 'input',
        name: 'basePath',
        default: process.cwd(),
        message: 'Destination folder (if empty, current folder will be used)?'
      }, (result) => {
        options.basePath = path.resolve(result.basePath);

        const newAppPath = path.join(options.basePath, options.app);

        if (fileExists(newAppPath)) {
          throw `[${config.delimiter}] Error while creating app. Directory "${newAppPath}" already exists.`;
        }
        mkdirp(newAppPath, (err) => {
          if (err) {
            throw err;
          }
          var templateFolder = path.join(config.cliPath, 'templates', options.type);

          try {
            generateProject(
              templateFolder, newAppPath, options, config
            ).then(() => {
              console.log(
                `[${config.delimiter}] App generation successfully completed`
              );
              if (options.noInstall) {
                console.log(
                  `[${config.delimiter}] Module installation has been skipped`
                );
                return Promise.resolve();
              } else {
                return runModulesInstall(newAppPath, config);
              }
            })
            .then(cb)
            // if something fails during the installation of modules the cli should NOT fail.
            .catch(() => process.exit(0));
          } catch(err) {
            shelljs.rm('-rf', newAppPath);
            throw err;
          }
        });
      });
    });
};
