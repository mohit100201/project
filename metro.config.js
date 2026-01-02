// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'cjs' to the list of source extensions
config.resolver.sourceExts.push('cjs');

module.exports = config;