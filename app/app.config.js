const { homedir } = require('os');
const { join } = require('path');

// Everything else is in app.json; this file only adds the shared build cache.
//
// The ios folder is generated, so each new task folder used to compile the
// whole app from zero. With this, `expo run:ios` looks for a finished
// simulator build with the same native code before compiling, and installs
// that instead. The folder is under the home directory because Expo's default
// is inside the project, which is per task folder and so shares nothing.
//
// OPT-IN: set SHARED_BUILD_CACHE=1 on the command line only, never in a
// package.json script or an env file. The config is part of the native
// fingerprint, so always on it would change what a store build and an
// over-the-air update are matched by (AFC-14).
module.exports = ({ config }) => ({
  ...config,
  ...(process.env.SHARED_BUILD_CACHE === '1' && {
    buildCacheProvider: {
      plugin: './scripts/dev/shared-build-cache.js',
      options: { cacheDir: join(homedir(), 'Library/Caches/prince-conversions/build-cache') },
    },
  }),
});
