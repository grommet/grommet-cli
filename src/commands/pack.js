/**
* Node dependencies
**/
import path from 'path';
import del from 'del';

/**
* NPM dependencies
**/
import chalk from 'chalk';
import emoji from 'node-emoji';
import fs from 'fs-extra';
import cp from 'child_process';
import tarball from 'tarball-extract';
import prettyHrtime from 'pretty-hrtime';
import opener from 'opener';
import rimraf from 'rimraf';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

const delimiter = chalk.magenta('[grommet:pack]');

const ENV = process.env.NODE_ENV || 'production';
let port = process.env.PORT || 3000;

function deleteDistributionFolder() {
  if (ENV === 'production') {
    return new Promise((resolve, reject) => {
      console.log(
        `${delimiter}: Deleting previously generated distribution folder...`
      );
      rimraf(path.resolve('dist'), (err) => err ? reject(err) : resolve());
    });
  } else {
    // in dev mode, all resources are compiled and served from memory by
    // webpack-dev-server so there is no reason to delete the dist folder
    return Promise.resolve();
  }
}

function runDevServer(compiler, devServerConfig) {
  console.log(
    `${delimiter}: Starting dev server...`
  );
  const devServer = new WebpackDevServer(compiler, devServerConfig);
  if (!process.env.PORT && devServerConfig.port) {
    port = devServerConfig.port;
  }
  devServer.listen(port, (err, result) => {
    if (err) {
      throw err;
    }
  });
}

function build(config, options) {
  return new Promise((resolve, reject) => {
    let handleResponse;
    // only handle response for production mode
    if (ENV === 'production') {
      handleResponse = (err, stats) => {
        const statHandler = (stat) => {
          if (err) {
            reject(err);
          } else if (stat.compilation.errors.length) {
            reject(stat.compilation.errors);
          } else {
            console.log(stat.toString({
              chunks: false,
              colors: true
            }));
          }
        };

        if (stats.stats) { // multiple stats
          stats.stats.forEach(statHandler);
        } else {
          statHandler(stats);
        }
        resolve();
      };
    }
    const compiler = webpack(config, handleResponse);

    if (ENV === 'development') {
      const startServer = (devServerConfig) => {
        let firstCompilation = true;
        compiler.plugin('done', (stats) => {
          const statHandler = (stat) => {
            if (stat.compilation.errors.length) {
              errorHandler(stat.compilation.errors);
            } else {
              console.log(stat.toString({
                chunks: false,
                colors: true
              }));

              console.log(
                `${delimiter}: ${chalk.green('success')}`
              );

              if (!options['skip-open'] && firstCompilation) {
                // https can be an object or just a boolean but either way will
                // be truthy when it is turned on
                const protocol = devServerConfig.https ? 'https' : 'http';
                console.log(
                  `${delimiter}: Opening the browser at ${protocol}://localhost:${port}`
                );

                opener(`${protocol}://localhost:${port}`);
              }

              firstCompilation = false;
            }
          };

          if (stats.stats) { // multiple stats
            stats.stats.forEach(statHandler);
          } else {
            statHandler(stats);
          }
        });
        runDevServer(compiler, devServerConfig);
      };

      let devServerConfig = config.devServer;
      if (!devServerConfig && Array.isArray(config)) {
        config.some((c) => {
          if (c.devServer) {
            devServerConfig = c.devServer;
            return true;
          }
          return false;
        });
      }
      if (devServerConfig) {
        startServer(devServerConfig);
      } else {
        getDevServerConfig().then(startServer);
      }
    }
  });
}

function getWebpackConfig() {
  return new Promise((resolve, reject) => {
    let webpackConfig = path.resolve(process.cwd(), 'webpack.config.js');
    fs.exists(webpackConfig, (exists) => {
      if (exists) {
        resolve(require(webpackConfig));
      } else {
        webpackConfig = path.resolve(process.cwd(), 'webpack.config.babel.js');
        fs.exists(webpackConfig, (exists) => {
          if (exists) {
            resolve(require(webpackConfig).default);
          } else {
            reject('Webpack config not found');
          }
        });
      }
    });
  });
}

function getDevServerConfig() {
  return new Promise((resolve, reject) => {
    let devServerConfig = path.resolve(process.cwd(), 'devServer.config.js');
    fs.exists(devServerConfig, (exists) => {
      if (exists) {
        console.warn(
          `${delimiter}: devServerConfig has been deprecated. Move your configuration to webpack.config devServer entry.`
        );
        resolve(require(devServerConfig));
      } else {
        devServerConfig = path.resolve(
          process.cwd(), 'devServer.config.babel.js'
        );
        fs.exists(devServerConfig, (exists) => {
          if (exists) {
            console.warn(
              `${delimiter}: devServerConfig has been deprecated. Move your configuration to webpack.config devServer entry.`
            );
            resolve(require(devServerConfig).default);
          } else {
            reject('devServer config not found');
          }
        });
      }
    });
  });
}

function packProject(options) {
  return new Promise((resolve, reject) => {
    console.log(
      `${delimiter}: Running webpack...`
    );
    getWebpackConfig().then(
      (config) => build(config, options).then(resolve, reject), reject
    );
  });
}

function projectLicenses(options) {
  return new Promise((resolve, reject) => {
    console.log(
      `${delimiter}: Evaluating licenses...`
    );
    const packageJSON = path.resolve('package.json');
    const packageJSONAsString = fs.readFileSync(packageJSON);
    const json = JSON.parse(packageJSONAsString);
    if (json.dependencies) {
      json.bundledDependencies = Object.keys(json.dependencies);
      fs.writeFileSync(packageJSON, JSON.stringify(json, null, 2));
    }

    try {
      cp.exec('npm pack', (packErr, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);

        if (packErr) {
          throw packErr;
        }
        const licenseMap = {
          name: json.name,
          version: json.version,
          dependencies: { licenseNotFound: [] }
        };

        const tarballName = `${json.name}-${json.version}.tgz`;
        tarball.extractTarball(tarballName, './tmp', (err) => {
          if (err) {
            throw err;
          }

          fs.renameSync(
            path.resolve(tarballName),
            path.resolve(`${json.name}-${json.version}-src-with-dependecies.tgz`)
          );

          const dependencies = fs.readdirSync('./tmp/package/node_modules');

          dependencies.forEach((dependency) => {
            const dependencyPackageJSON = path.resolve(
              `node_modules/${dependency}/package.json`
            );
            const contents = fs.readFileSync(dependencyPackageJSON);
            const instance = JSON.parse(contents);
            let license = instance.license;
            if (!license && instance.licenses) {
              license = instance.licenses[0];
            }

            if (!license) {
              licenseMap.dependencies.licenseNotFound.push(dependency);
            } else if (license.type) {
              licenseMap.dependencies[dependency] = license.type;
            } else {
              licenseMap.dependencies[dependency] = license;
            }
          });

          const dependencyLicense = path.resolve(
            `${json.name}-${json.version}-licenses.json`
          );

          // write dependency license map
          fs.writeFileSync(dependencyLicense, JSON.stringify(
            licenseMap, null, 2)
          );

          // revert original package.json
          fs.writeFileSync(packageJSON, JSON.stringify(
            JSON.parse(packageJSONAsString), null, 2)
          );

          del.sync(['./tmp']);

          resolve();
        });
      });
    } catch (e) {
      console.log(e);

      // revert original package.json
      fs.writeFileSync(packageJSON, JSON.stringify(
        JSON.parse(packageJSONAsString), null, 2)
      );

      reject(e);
    }
  });
}

function errorHandler(err = {}) {
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

export default function (vorpal) {
  vorpal
    .command(
      'pack',
      'Builds a grommet application for development and/or production'
    )
    .option('--skip-open', 'Skip browser opening on first compilation')
    .option('--licenses', 'Generate license information')
    .action((args, cb) => {
      const timeId = process.hrtime();

      deleteDistributionFolder()
        .then(() => packProject(args.options))
        .then(() => {
          if (args.options.licenses) {
            return projectLicenses();
          }
          return Promise.resolve();
        })
        .then(() => {
          console.log(
            `${delimiter}: ${chalk.green('success')}`
          );
          const t = process.hrtime(timeId);
          console.log(`${emoji.get('sparkles')} ${prettyHrtime(t)}`);
        }).catch((err) => {
          errorHandler(err);
          process.exit(1);
        });
    });
};
