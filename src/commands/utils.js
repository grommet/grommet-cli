/**
* Node dependencies
**/
import path from 'path';
import { fork } from 'child_process';

/**
* NPM dependencies
**/
import chalk from 'chalk';
import jest from 'jest-cli';
import yargs from 'yargs';

export const delimiter = chalk.magenta('[grommet]');

export function errorHandler(err) {
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

export function runTests(options) {
  return new Promise((resolve, reject) => {
    const optionKeys = Object.keys(options).length;
    if (options.scsslint || options.jslint) {
      resolve();
    } else {
      process.env.NODE_ENV = 'test';
      console.log(
        `${delimiter}: Running Tests...`
      );
      let packageJSON = require(path.resolve(process.cwd(), 'package.json'));
      const config = Object.assign({
        rootDir: process.cwd()
      }, packageJSON.jest, yargs(process.argv.slice(optionKeys + 2)).argv);

      jest.runCLI(config, [process.cwd()], (result) => {
        if(result.numFailedTests || result.numFailedTestSuites) {
          reject('Tests Failed');
        } else {
          resolve();
        }
      });
    }
  });
}

export function runJsLint(options) {
  return new Promise((resolve, reject) => {
    const optionKeys = Object.keys(options).length;
    if (optionKeys > 0 && !options.jslint) {
      resolve();
    } else {
      console.log(
        `${delimiter}: Running Javascript linting...`
      );
      const eslintChild = fork(
        path.resolve(__dirname, 'eslint'), process.argv.slice(optionKeys + 2)
      );
      eslintChild.on('exit', (code) => {
        if (code !== 0) {
          reject('Js Linting failed');
        } else {
          resolve();
        }
      });
      eslintChild.send('**/*.{js,jsx}');
    }
    
  });
}

export function runSCSSLint(options) {
  return new Promise((resolve, reject) => {
    const optionKeys = Object.keys(options).length;
    if (optionKeys > 0 && !options.scsslint) {
      resolve();
    } else {
      console.log(
        `${delimiter}: Running SCSS linting...`
      );
      const scsslintChild = fork(
        path.resolve(__dirname, 'scsslint'), process.argv.slice(optionKeys + 2)
      );
      scsslintChild.on('exit', (code) => {
        if (code !== 0) {
          reject('SCSS Linting failed');
        } else {
          resolve();
        }
      });
      scsslintChild.send('**/*.scss');
    }
  });
}

export function runLinters(options) {
  return new Promise((resolve, reject) => {
    if (options.test) {
      resolve();
    } else {
      const errors = [];
      let scssLintCompleted = false;
      let jsLintCompleted = false;
      runJsLint(options).then(
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
      runSCSSLint(options).then(
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
    }
  });
}

export default { errorHandler, runJsLint, runLinters, runSCSSLint, runTests };
