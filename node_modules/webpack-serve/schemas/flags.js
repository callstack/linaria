const chalk = require('chalk');

module.exports = {
  clipboard: {
    desc: chalk`Specify whether or not the server should copy the server URI to the clipboard {dim (default: true)}`,
    type: 'boolean',
  },
  config: {
    desc: 'The webpack config to serve. Alias for <config>',
    type: 'string',
  },
  content: {
    desc: chalk`The path from which static content will be served {dim (default: process.cwd)}`,
    type: 'string',
  },
  'dev-ware': {
    desc: 'Set options for webpack-dev-middleware. e.g. --dev-ware.publicPath /',
    type: 'object',
  },
  help: {
    desc: 'Show usage information and the options listed here.',
  },
  host: {
    desc: 'The host the app should bind to',
    type: 'string',
  },
  'hot-client': {
    desc: chalk`Set options for webpack-hot-client. e.g. --hot-client.host localhost
Use {dim --no-hot-client} to disable webpack-hot-client`,
    type: ['boolean', 'object'],
  },
  http2: {
    desc: 'Instruct the server to use HTTP2',
    type: 'boolean',
  },
  'https-cert': {
    desc:
      'Specify a filesystem path of an SSL certificate. Must be paired with a key',
    type: 'string',
  },
  'https-key': {
    desc: 'Specify a filesystem path of an SSL key. Must be paired with a cert',
    type: 'string',
  },
  'https-pass': {
    desc:
      'Specify a passphrase to enable https. Must be paired with a pfx file',
    type: 'string',
  },
  'https-pfx': {
    desc:
      'Specify a filesystem path of an SSL pfx file. Must be paired with a passphrase',
    type: 'string',
  },
  'log-level': {
    desc: chalk`Limit all process console messages to a specific level and above
{dim Levels: trace, debug, info, warn, error, silent}`,
    type: 'string',
  },
  'log-time': {
    desc:
      'Instruct the logger for webpack-serve and dependencies to display a timestamp',
    type: 'boolean',
  },
  hmr: {
    desc: chalk`Specify whether or not the client should apply Hot Module Replacement patches {dim (default: true)}`,
    type: 'boolean',
  },
  reload: {
    desc: chalk`Specify whether or not the middleware should reload the page for build errors {dim (default: true)}`,
    type: 'boolean',
  },
  open: {
    desc: 'Instruct the app to open in the default browser',
    type: 'boolean',
  },
  'open-app': {
    desc: `The name of the app to open the app within, or an array
containing the app name and arguments for the app`,
    type: 'string',
  },
  'open-path': {
    desc: 'The path with the app a browser should open to',
    type: 'string',
  },
  port: {
    desc: 'The port the app should listen on. Default: 8080',
    type: ['number', 'string'],
  },
  require: {
    alias: 'r',
    desc:
      'Preload one or more modules before loading the webpack configuration',
    type: 'string',
  },
  version: {
    desc: 'Display the webpack-command version',
  },
};
