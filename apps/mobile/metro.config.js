const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require('uniwind/metro'); 

const config = getDefaultConfig(__dirname);

const apiSrc = path.resolve(__dirname, "../../packages/api/src");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@galton/api": apiSrc,
};
config.watchFolders = [...(config.watchFolders ?? []), apiSrc];

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: "./src/global.css",
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: "./src/uniwind-types.d.ts",
});
