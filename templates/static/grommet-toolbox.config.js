import path from 'path';

export default {
  copyAssets: [
    'src/index.html',
    {
      asset: 'src/img/**',
      dist: 'dist/img/'
    }
  ],
  jsAssets: ['src/js/**/*.js'],
  mainJs: 'src/js/index.js',
  mainScss: 'src/scss/index.scss',
  devServerPort: 9000,
  webpack: {
    resolve: {
      root: [
        path.resolve(__dirname, './node_modules')
      ]
    },
    module: {
      loaders: [
        {test: /\.ejs$/, loader: 'ejs-compiled?htmlmin'}
      ]
    }
  },
  scssLoader: {
    test: /\.scss$/,
    loader: "file?name=assets/css/[name].css!sass?" +
      'includePaths[]=' +
      (encodeURIComponent(
        path.resolve('./node_modules')
      )) +
      '&includePaths[]=' +
      (encodeURIComponent(
        path.resolve('./node_modules/grommet/node_modules'))
      )
  }
};
