// The build cache `expo run:ios` uses when SHARED_BUILD_CACHE=1 (app.config.js).
//
// It is Expo's own local provider, with the build's name computed here so a
// file that compiling rewrites can be left out of it. Expo names a build by
// the project fingerprint, taken once before compiling (to look a build up)
// and once after (to save it); a file that changes in between means a fresh
// folder never finds the saved build.
const { createFingerprintAsync } = require('expo/fingerprint');
const local = require('expo/local-build-cache-provider');

const provider = local.default ?? local;

module.exports = {
  ...provider,
  calculateFingerprintHash: async ({ projectRoot, platform }) => {
    const fingerprint = await createFingerprintAsync(projectRoot, {
      platforms: [platform],
      // Files that compiling rewrites. None found in this app (AFC-14).
      ignorePaths: [],
    });
    return fingerprint.hash;
  },
};
