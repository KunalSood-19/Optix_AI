const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAssistantManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application[0];
    
    application.service = application.service || [];
    
    const hasService = application.service.some(s => s.$['android:name'] === '.VoiceService');
    if (!hasService) {
      application.service.push({
        $: {
          'android:name': '.VoiceService',
          'android:permission': 'android.permission.BIND_VOICE_INTERACTION',
          'android:exported': 'true'
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.voice_interaction',
              'android:resource': '@xml/voice_interaction'
            }
          }
        ],
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.service.voice.VoiceInteractionService' } }]
          }
        ]
      });

      application.service.push({
        $: {
          'android:name': '.VoiceSessionService',
          'android:permission': 'android.permission.BIND_VOICE_INTERACTION',
          'android:exported': 'true'
        }
      });

      application.service.push({
        $: {
          'android:name': '.VoiceRecognitionService',
          'android:exported': 'true'
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.speech.RecognitionService' } }],
            category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }]
          }
        ]
      });
    }
    return config;
  });
};

const withAssistantFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = config.android.package;
      
      // 1. Create res/xml/voice_interaction.xml
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'voice_interaction.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<voice-interaction-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:sessionService="${packageName}.VoiceSessionService"
    android:recognitionService="${packageName}.VoiceRecognitionService"
    android:supportsAssist="true"
    android:supportsLaunchVoiceAssistFromKeyguard="true"
    android:supportsLocalInteraction="true" />`
      );

      // 2. Create Java files
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', ...packagePath.split('/'));
      
      const javaCodeVoiceService = `package ${packageName};

import android.service.voice.VoiceInteractionService;
import android.content.Intent;

public class VoiceService extends VoiceInteractionService {
    @Override
    public void onReady() {
        super.onReady();
    }
}
`;
      fs.writeFileSync(path.join(javaDir, 'VoiceService.java'), javaCodeVoiceService);

      const javaCodeSessionService = `package ${packageName};

import android.service.voice.VoiceInteractionSessionService;
import android.service.voice.VoiceInteractionSession;
import android.os.Bundle;
import android.content.Intent;
import android.content.Context;

import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

public class VoiceSessionService extends VoiceInteractionSessionService {
    @Override
    public VoiceInteractionSession onNewSession(Bundle args) {
        return new VoiceInteractionSession(this) {
            @Override
            public void onShow(Bundle args, int showFlags) {
                super.onShow(args, showFlags);
                
                // Show a Toast so we know this code actually ran!
                new Handler(Looper.getMainLooper()).post(() -> {
                    Toast.makeText(getContext(), "Optix Assistant Triggered!", Toast.LENGTH_SHORT).show();
                });

                Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("optix://assistant"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                try {
                    startAssistantActivity(intent);
                } catch (Exception e) {
                    // Fallback to launcher intent if deep link fails
                    Intent fallback = getPackageManager().getLaunchIntentForPackage(getPackageName());
                    if (fallback != null) {
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        startAssistantActivity(fallback);
                    }
                }
                
                // Delay hide() so the system has enough time to spawn the Activity 
                // before the VoiceSession overlay is destroyed.
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    hide();
                }, 1500);
            }
        };
    }
}
`;
      fs.writeFileSync(path.join(javaDir, 'VoiceSessionService.java'), javaCodeSessionService);

      const javaCodeRecognitionService = `package ${packageName};

import android.speech.RecognitionService;
import android.content.Intent;

public class VoiceRecognitionService extends RecognitionService {
    @Override
    protected void onStartListening(Intent recognizerIntent, Callback listener) {}
    @Override
    protected void onCancel(Callback listener) {}
    @Override
    protected void onStopListening(Callback listener) {}
}
`;
      fs.writeFileSync(path.join(javaDir, 'VoiceRecognitionService.java'), javaCodeRecognitionService);

      return config;
    },
  ]);
};

module.exports = function withAssistant(config) {
  config = withAssistantManifest(config);
  config = withAssistantFiles(config);
  return config;
};
