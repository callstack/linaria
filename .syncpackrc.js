module.exports = {
  dev: true,
  filter: '.',
  indent: '  ',
  overrides: true,
  peer: false,
  pnpmOverrides: true,
  prod: true,
  resolutions: true,
  semverGroups: [],
  semverRange: '',
  sortAz: [
    'contributors',
    'dependencies',
    'devDependencies',
    'keywords',
    'peerDependencies',
    'resolutions',
    'scripts',
  ],
  sortFirst: ['name', 'description', 'version', 'author'],
  source: [],
  versionGroups: [
    {
      dependencies: [
        '@types/enhanced-resolve',
        'css-loader',
        'enhanced-resolve',
        'mini-css-extract-plugin',
        'webpack'
      ],
      packages: ['@linaria/webpack4-loader', 'webpack4-example'],
    },
  ],
  workspace: true,
};
