// Signs Android release builds with the owner's Play upload key.
//
// The key never lives in this repository. Gradle reads these values from the
// user-level ~/.gradle/gradle.properties file or from environment variables:
//   SOUNDTRIP_UPLOAD_STORE_FILE      absolute path to the upload keystore
//   SOUNDTRIP_UPLOAD_STORE_PASSWORD
//   SOUNDTRIP_UPLOAD_KEY_ALIAS
//   SOUNDTRIP_UPLOAD_KEY_PASSWORD
// Without them, release builds keep the development key so emulator testing
// still works; scripts/build-android.mjs refuses to produce a Play bundle then.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARK = "// soundtrip-release-signing";
const HELPER = `${MARK}
def soundtripSigning = { String name -> findProperty(name) ?: System.getenv(name) }
def soundtripHasUploadKey = soundtripSigning('SOUNDTRIP_UPLOAD_STORE_FILE') != null
`;
const RELEASE_CONFIG = `
        release {
            if (soundtripHasUploadKey) {
                storeFile file(soundtripSigning('SOUNDTRIP_UPLOAD_STORE_FILE'))
                storePassword soundtripSigning('SOUNDTRIP_UPLOAD_STORE_PASSWORD')
                keyAlias soundtripSigning('SOUNDTRIP_UPLOAD_KEY_ALIAS')
                keyPassword soundtripSigning('SOUNDTRIP_UPLOAD_KEY_PASSWORD')
            }
        }`;

function apply(gradle) {
  if (gradle.includes(MARK)) return gradle;
  const debugConfig = /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/;
  const releaseUse =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!debugConfig.test(gradle) || !releaseUse.test(gradle))
    throw new Error(
      "with-android-release-signing: the generated app/build.gradle layout changed. Update the plugin before building a Play bundle.",
    );
  return gradle
    .replace(/^android\s*\{/m, `${HELPER}android {`)
    .replace(debugConfig, `$1${RELEASE_CONFIG}`)
    .replace(
      releaseUse,
      "$1signingConfig soundtripHasUploadKey ? signingConfigs.release : signingConfigs.debug",
    );
}

module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy")
      throw new Error(
        "with-android-release-signing expects a Groovy build.gradle.",
      );
    mod.modResults.contents = apply(mod.modResults.contents);
    return mod;
  });
module.exports.apply = apply;
