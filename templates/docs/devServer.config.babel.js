import webpackConfig from './webpack.config.babel.js';

export default {
  compress: true,
  clientLogLevel: 'none',
  contentBase: webpackConfig[0].output.path,
  publicPath: webpackConfig[0].output.publicPath,
  quiet: true,
  hot: true,
  watchOptions: {
    ignored: /node_modules/
  },
  historyApiFallback: true
};
