const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * Webpack config for Kavia React Template.
 * Sets devServer port to 3001 as per request.
 */
module.exports = {
  entry: path.resolve(__dirname, '../literarychatbot_frontend/src/index.js'),
  output: {
    path: path.resolve(__dirname, '../literarychatbot_frontend/build'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // Add support for images or other assets if needed in future
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../literarychatbot_frontend/public/index.html'),
      favicon: false,
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, '../literarychatbot_frontend/public'),
    },
    port: 3001, // <-- updated as per task
    historyApiFallback: true,
    open: false,
    hot: true,
  },
};
