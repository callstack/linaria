const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { join } = require('path'); // eslint-disable-line import/no-extraneous-dependencies
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { LinariaDebugPlugin } = require('@linaria/webpack5-loader');

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  entry: {
    app: './src/index',
  },
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  optimization: {
    emitOnErrors: false,
  },
  plugins: [
    new LinariaDebugPlugin({
      filename: 'linaria-debug.json',
      print: true,
    }),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
    new HtmlWebpackPlugin({
      title: 'Linaria – zero-runtime CSS in JS library',
      templateContent: `
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `,
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          {
            loader: require.resolve('@linaria/webpack5-loader'),
            options: { sourceMap: dev },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'css-hot-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: dev },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  devServer: {
    static: {
      directory: join(__dirname, 'dist'),
    },
    hot: true,
    historyApiFallback: {
      index: 'index.html',
    },
  },
};
