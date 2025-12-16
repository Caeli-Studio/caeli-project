const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add Node.js polyfills
config.resolver.extraNodeModules = {
  assert: require.resolve('assert'),
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
