import StaticSiteGeneratorPlugin from 'static-site-generator-webpack-plugin';
import reactRouterToArray from 'react-router-to-array';
import grommetBaseWebpack from 'grommet-toolbox/lib/webpack.dist.config';
import path from 'path';
import routes from './src/js/routes';

const staticConfig = {...grommetBaseWebpack};

grommetBaseWebpack.output = {
  filename: 'index.js',
  path: path.resolve('./dist')
};

staticConfig.entry = {
  'main': path.resolve('./src/js/static.js')
};

staticConfig.output = {
  filename: 'static.js',
  path: path.resolve('./dist'),
  libraryTarget: 'commonjs2'
};

staticConfig.plugins = [
  new StaticSiteGeneratorPlugin(
    'main', reactRouterToArray(routes)
  )
];

export default [grommetBaseWebpack, staticConfig];
module.exports = exports.default;
