import path from 'path';
import webpack from 'webpack';
import WatchMissingNodeModulesPlugin from
  'react-dev-utils/WatchMissingNodeModulesPlugin';

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
    require.resolve('react-dev-utils/webpackHotDevClient'),
    './src/js/index.js'
  ];
}

export default Object.assign({
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
      }
    ]
  },
  sassLoader: {
    includePaths: [
      './node_modules'
    ]
  }
}, devConfig);
