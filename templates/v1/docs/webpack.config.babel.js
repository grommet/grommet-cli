import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import StaticSiteGeneratorPlugin from 'static-site-generator-webpack-plugin';
import reactRouterToArray from 'react-router-to-array';
import routes from './src/js/routes';

const env = process.env.NODE_ENV || 'production';

let plugins = [
  new CopyWebpackPlugin([{ from: './public' }]),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(env)
    }
  })
];

const loaderOptionsConfig = {
  options: {
    sassLoader: {
      includePaths: [
        './node_modules'
      ]
    }
  }
};

const devConfig = {};
if (env === 'production') {
  loaderOptionsConfig.minimize = true;
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
    new webpack.HotModuleReplacementPlugin()
  ]);
  devConfig.devtool = 'cheap-module-source-map';
  devConfig.entry = [
    require.resolve('react-dev-utils/webpackHotDevClient'),
    './src/js/index.js'
  ];
  devConfig.devServer = {
    compress: true,
    clientLogLevel: 'none',
    contentBase: path.resolve('./dist'),
    publicPath: '/',
    quiet: true,
    hot: true,
    watchOptions: {
      ignored: /node_modules/
    },
    historyApiFallback: true
  };
}

plugins.push(new webpack.LoaderOptionsPlugin(loaderOptionsConfig));

const baseConfig = Object.assign({
  entry: './src/js/index.js',
  output: {
    path: path.resolve('./dist'),
    filename: 'index.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.scss', '.css', '.json']
  },
  plugins,
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'file-loader', options: { name: '[name].css' } },
          { loader: 'sass-loader',
            options: {
              outputStyle: 'compressed',
              includePaths: [
                './node_modules'
              ]
            }
          }
        ]
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-compiled-loader',
        options: { htmlmin: '' }
      }
    ]
  }
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
