const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  entry: {
    app: './app',
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'app.bundle.js',
  },
  optimization: {
    noEmitOnErrors: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) },
    }),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.mjs'],
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        type: 'javascript/auto',
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          {
            loader: '@linaria/webpack5-loader',
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
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
            },
          },
        ],
      },
    ],
  },
};
