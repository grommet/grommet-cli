/**
* Node dependencies
**/
import path from 'path';
import { fork } from 'child_process';

/**
* NPM dependencies
**/
import chalk from 'chalk';
import emoji from 'node-emoji';
import prettyHrtime from 'pretty-hrtime';
import jest from 'jest-cli';

const delimiter = chalk.magenta('[grommet:check]');

function errorHandler(err) {
  console.log(
    `${delimiter}: ${chalk.red('failed')}`
  );
  const isArray = Array.isArray(err);
  if (isArray) {
    err.forEach(e => console.error(e.message ? e.message : e));
  } else {
    console.error(err.message ? err.message : err);
  }
}

function runJsLint() {
  return new Promise((resolve, reject) => {
    console.log(
      `${delimiter}: Running Javascript linting...`
    );
    const eslintChild = fork(path.resolve(__dirname, 'eslint'));
    eslintChild.on('exit', (code) => {
      if (code !== 0) {
        reject('Js Linting failed');
      } else {
        resolve();
      }
    });
    eslintChild.send('**/*.js');
  });
}

function runSCSSLint() {
  return new Promise((resolve, reject) => {
    console.log(
      `${delimiter}: Running SCSS linting...`
    );
    const scsslintChild = fork(path.resolve(__dirname, 'scsslint'));
    scsslintChild.on('exit', (code) => {
      if (code !== 0) {
        reject('SCSS Linting failed');
      } else {
        resolve();
      }
    });
    scsslintChild.send('**/*.scss');
  });
}

function runLinters() {
  return new Promise((resolve, reject) => {
    const errors = [];
    let scssLintCompleted = false;
    let jsLintCompleted = false;
    runJsLint().then(
      () => {
        jsLintCompleted = true;
        if (scssLintCompleted) {
          if (errors.length === 0) {
            resolve();
          } else {
            reject(errors);
          }
        }
      },
      (err) => {
        jsLintCompleted = true;
        errors.push(err);
        if (scssLintCompleted) {
          reject(errors);
        }
      }
    );
    runSCSSLint().then(
      () => {
        scssLintCompleted = true;
        if (jsLintCompleted) {
          if (errors.length === 0) {
            resolve();
          } else {
            reject(errors);
          }
        }
      },
      (err) => {
        scssLintCompleted = true;
        errors.push(err);
        if (jsLintCompleted) {
          reject(errors);
        }
      }
    );
  });
}

function runTests(updateSnapshot) {
  return new Promise((resolve, reject) => {
    process.env.NODE_ENV = 'test';
    console.log(
      `${delimiter}: Running Tests...`
    );
    let packageJSON = require(path.resolve(process.cwd(), 'package.json'));
    const config = Object.assign({
      rootDir: process.cwd(),
      updateSnapshot
    }, packageJSON.jest);

    jest.runCLI({
      config: config
    }, process.cwd(), (result) => {
      if(result.numFailedTests || result.numFailedTestSuites) {
        reject('Tests Failed');
      } else {
        resolve();
      }
    });
  });
}

export default function (vorpal) {
  vorpal
    .command(
      'check',
      'Runs Javascript/SASS linters and execute tests for your project'
    )
    .option(
      '-u, --updateSnapshot',
      `Whether test snapshots should be updated. Defaults to false.`
    )
    .action((args, cb) => {
      const timeId = process.hrtime();

      runLinters()
        .then(() => runTests(args.options.updateSnapshot))
        .then(() => {
          console.log(
            `${delimiter}: ${chalk.green('success')}`
          );

          const t = process.hrtime(timeId);
          console.log(`${emoji.get('sparkles')} ${prettyHrtime(t)}`);
          cb();
        }).catch(err => {
          errorHandler(err);
          process.exit(1);
        });
    });
};
