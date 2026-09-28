const fs = require('fs');

let content = fs.readFileSync('src/screens/AssistantScreen.js', 'utf8');

// 1. Update imports
content = content.replace("import Voice from '@react-native-voice/voice';", "import { Audio } from 'expo-av';");
content = content.replace("import { askWithImage, generalChat } from '../services/geminiService';", "import { askWithImage, generalChat, transcribeAudio } from '../services/geminiService';");

// 2. Add recording state
content = content.replace(
  "const [isProcessing, setIsProcessing] = useState(false);",
  "const [isProcessing, setIsProcessing] = useState(false);\n  const [recording, setRecording] = useState();"
);

// 3. Update useEffect
const oldUseEffect = `  useEffect(() => {
    requestPermissions();

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.log('Voice Error:', e);
      setIsListening(false);
      setAiResponse("Microphone error. Please ensure permissions are granted.");
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInputText(e.value[0]);
        handleQuery(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      Speech.stop();
    };
  }, []);`;

const newUseEffect = `  useEffect(() => {
    requestPermissions();
    return () => {
      Speech.stop();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Update requestPermissions
const oldPerm = `  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "Optix needs access to your microphone to hear your voice commands.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Microphone permission denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };`;

const newPerm = `  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
         console.log("Microphone permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };`;

content = content.replace(oldPerm, newPerm);

// 5. Update toggleListening
const oldToggle = `  const toggleListening = async () => {
    if (isListening) {
      await Voice.stop();
      setIsListening(false);
    } else {
      Speech.stop();
      try {
        await Voice.start('en-US');
      } catch (e) {
        console.log('Voice start error:', e);
        setAiResponse("Microphone failed to start. Please check permissions.");
      }
    }
  };`;

const newToggle = `  const toggleListening = async () => {
    try {
      if (isListening) {
        setIsListening(false);
        setIsProcessing(true);
        setAiResponse("Transcribing audio...");
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        const transcribedText = await transcribeAudio(uri);
        setRecording(undefined);
        
        if (transcribedText) {
          setInputText(transcribedText);
          handleQuery(transcribedText);
        } else {
          setIsProcessing(false);
          setAiResponse("Could not transcribe audio. Please try again.");
        }
      } else {
        Speech.stop();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY );
        setRecording(recording);
        setIsListening(true);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setAiResponse("Microphone failed to start. Please check permissions.");
      setIsListening(false);
    }
  };`;

content = content.replace(oldToggle, newToggle);

fs.writeFileSync('src/screens/AssistantScreen.js', content);
console.log('AssistantScreen updated for expo-av');
