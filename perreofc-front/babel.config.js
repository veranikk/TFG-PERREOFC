/**
 * Build configuration file for the frontend: babel.config.
 * It tunes the toolchain that compiles, bundles or styles the app.
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
