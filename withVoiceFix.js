const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withVoiceFix(config) {
  // 1. Add AndroidManifest <queries> for Speech Recognition (Android 11+)
  config = withAndroidManifest(config, async (config) => {
    let androidManifest = config.modResults;
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }
    
    const speechIntent = {
      intent: [
        {
          action: [{ $: { 'android:name': 'android.speech.RecognitionService' } }]
        }
      ]
    };
    
    const hasIntent = androidManifest.manifest.queries.some(q => 
      q.intent && q.intent.some(i => i.action && i.action[0].$['android:name'] === 'android.speech.RecognitionService')
    );
    
    if (!hasIntent) {
      androidManifest.manifest.queries.push(speechIntent);
    }
    
    return config;
  });

  // 2. Fix build.gradle namespace and appcompat version
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        '@react-native-voice',
        'voice',
        'android',
        'build.gradle'
      );
      
      if (fs.existsSync(buildGradlePath)) {
        let contents = fs.readFileSync(buildGradlePath, 'utf-8');
        
        // Add namespace if missing
        if (!contents.includes('namespace "com.wenkesj.voice"')) {
          contents = contents.replace(
            'android {',
            'android {\n    namespace "com.wenkesj.voice"'
          );
        }
        
        // Replace support library
        contents = contents.replace(
          /implementation "com\.android\.support:appcompat-v7:\$\{supportVersion\}"/g,
          'implementation "androidx.appcompat:appcompat:1.0.0"'
        );
        
        fs.writeFileSync(buildGradlePath, contents);
      }
      return config;
    },
  ]);

  return config;
};
