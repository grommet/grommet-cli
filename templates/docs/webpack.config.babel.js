import path from 'path';
import webpack from 'webpack';
import StaticSiteGeneratorPlugin from 'static-site-generator-webpack-plugin';
import reactRouterToArray from 'react-router-to-array';
import WatchMissingNodeModulesPlugin from 'react-dev-utils/WatchMissingNodeModulesPlugin';
import routes from './src/js/routes';

const env = process.env.NODE_ENV || 'production';

let plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(env)
    }
  }),
  new webpack.optimize.OccurrenceOrderPlugin()
  // new webpack.optimize.DedupePlugin()
];

const devConfig = {};
if (env === 'production') {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true,
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    })
  );
} else {
  plugins = plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new WatchMissingNodeModulesPlugin('./node_modules')
  ]);
  devConfig.devtool = 'cheap-module-source-map';
  devConfig.entry = [
    'react-hot-loader/patch',
    require.resolve('react-dev-utils/webpackHotDevClient'),
    './src/js/index.js'
  ];
}

const baseConfig = Object.assign({
  entry: './src/js/index.js',
  output: {
    path: path.resolve('./dist'),
    filename: 'index.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['', '.js', '.scss', '.css']
  },
  plugins,
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  module: {
    loaders: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        loaders: ['babel']
      },
      {
        test: /\.scss$/,
        loader: 'file?name=[name].css!sass?outputStyle=compressed'
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-compiled?htmlmin'
      }
    ]
  },
  sassLoader: {
    includePaths: [
      './node_modules'
    ]
  },
}, devConfig);

const webpackConfigs = [baseConfig];
if (env === 'production') {
  // add configuration specific to static site generation
  const staticConfig = { ...baseConfig };

  staticConfig.entry = {
    main: path.resolve('./src/js/static.js')
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

  webpackConfigs.push(staticConfig);
}

export default webpackConfigs;
