/* eslint-env node */
/* eslint-disable import/no-commonjs, import/no-extraneous-dependencies */

const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const PORT = 3000;

const entry = ['./src/index.js'];

module.exports = (env = { NODE_ENV: 'development' }) => ({
  devtool: 'source-map',
  entry:
    env.NODE_ENV === 'production'
      ? entry
      : [
          `webpack-dev-server/client?http://localhost:${PORT}`,
          'webpack/hot/only-dev-server',
          ...entry,
        ],
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/build/',
    filename: '[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(env.NODE_ENV) },
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({ resource }) => /node_modules/.test(resource),
    }),
  ].concat(
    env.NODE_ENV === 'production'
      ? [
          new webpack.LoaderOptionsPlugin({ minimize: true, debug: false }),
          new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            sourceMap: true,
          }),
          new ExtractTextPlugin('styles.css'),
          new webpack.optimize.CommonsChunkPlugin('manifest'),
        ]
      : [
          new webpack.HotModuleReplacementPlugin(),
          new webpack.NamedModulesPlugin(),
          new webpack.NoEmitOnErrorsPlugin(),
        ]
  ),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
    ].concat(
      env.NODE_ENV === 'production'
        ? {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: 'css-loader',
            }),
          }
        : {
            test: /\.css$/,
            use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
          }
    ),
  },
  devServer: {
    contentBase: 'static',
    hot: true,
    port: PORT,
  },
});
