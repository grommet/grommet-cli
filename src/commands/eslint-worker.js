/**
* NPM dependencies
**/
import path from 'path';
import fs from 'fs';

/**
* NPM dependencies
**/
import { CLIEngine } from 'eslint';

/**
* Local dependencies
**/
import { loadConfig } from '../utils/cli';

const config  = loadConfig();

let eslintrcPath = path.resolve(config.base, '.eslintrc');
try {
  fs.accessSync(eslintrcPath, fs.F_OK);
} catch (e) {
  eslintrcPath = path.resolve(__dirname, '../../.eslintrc');
}

const eslint = new CLIEngine({
  configFile: eslintrcPath,
  cache: true,
  cwd: config.base
});

process.on('message', (paths) => {
  process.send(eslint.executeOnFiles(paths));
});

export default (paths) => {
  return new Promise((resolve) => {
    resolve(eslint.executeOnFiles(paths));
  });
};
