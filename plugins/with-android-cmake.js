// Builds the app's native code with CMake 3.31.6 instead of the Android Gradle
// default (3.22.1).
//
// React Native compiles library codegen into the app with object paths that
// repeat the project's absolute path. In a folder such as
// "C:\Personal Project\SoundTrip" these exceed 260 characters. The ninja
// bundled with CMake 3.22.1 rejects them; the ninja 1.12 bundled with 3.31.6
// accepts them once Windows long paths are enabled (LongPathsEnabled = 1).
// Install it with: sdkmanager "cmake;3.31.6"
const { withAppBuildGradle } = require("expo/config-plugins");

const VERSION = "3.31.6";
const MARK = "// soundtrip-cmake-version";
const BLOCK = `
    ${MARK}
    externalNativeBuild {
        cmake {
            version "${VERSION}"
        }
    }
`;

function apply(gradle) {
  if (gradle.includes(MARK)) return gradle;
  const androidBlock = /^android\s*\{\n/m;
  if (!androidBlock.test(gradle))
    throw new Error(
      "with-android-cmake: no android block in app/build.gradle.",
    );
  return gradle.replace(androidBlock, (m) => `${m}${BLOCK}`);
}

module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy")
      throw new Error("with-android-cmake expects a Groovy build.gradle.");
    mod.modResults.contents = apply(mod.modResults.contents);
    return mod;
  });
module.exports.apply = apply;
module.exports.VERSION = VERSION;
