/**
 * Build configuration file for the frontend: metro.config.
 * It tunes the toolchain that compiles, bundles or styles the app.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Force transpilation of packages that use private class fields (#field)
// which older Hermes versions don't support natively
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

const defaultBlockList = config.resolver.blockList || [];
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|expo-router|@unimodules|unimodules|nativewind|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-navigation|moti|@motify|react-native-worklets|lucide-react-native|react-native-calendars|react-native-markdown-display)/)',
];

module.exports = withNativeWind(config, { input: './global.css' });
