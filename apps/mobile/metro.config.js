const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const apiSrc = path.resolve(__dirname, "../../packages/api/src");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@galton/api": apiSrc,
};
config.watchFolders = [...(config.watchFolders ?? []), apiSrc];

module.exports = config;
