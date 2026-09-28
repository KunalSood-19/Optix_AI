import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  TextInput, 
  Platform, 
  ScrollView,
  PermissionsAndroid,
  Image,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { askWithImage, generalChat, transcribeAudio } from '../services/geminiService';
import Markdown from 'react-native-markdown-display';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const markdownStyles = {
  body: { color: "#F4F4F4", fontSize: 16, lineHeight: 26, fontFamily: 'Rajdhani_500Medium' },
  strong: { fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4" },
  code_inline: { backgroundColor: "rgba(255,255,255,0.4)", color: "#94A3B8", padding: 4, borderRadius: 4 },
  code_block: { backgroundColor: "rgba(0,0,0,0.5)", color: "#94A3B8", padding: 10, borderRadius: 8 },
  heading1: { color: "#F4F4F4", fontSize: 24, fontFamily: 'Rajdhani_700Bold', marginVertical: 10 },
  paragraph: { marginVertical: 8 },
};

export default function AssistantScreen({ navigation }) {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState("What can I do for you today?");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState();
  const [selectedImage, setSelectedImage] = useState(null);
  
  const scrollViewRef = useRef();

  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.6);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.2);

  useEffect(() => {
    requestPermissions();
    return () => {
      Speech.stop();
      if (recording) {
        recording.stopAndUnloadAsync().catch(()=>{});
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      );
      orbOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.7, { duration: 500 })
        ),
        -1, true
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 500, easing: Easing.out(Easing.ease) }),
          withTiming(1.1, { duration: 500, easing: Easing.in(Easing.ease) })
        ),
        -1, true
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(0.1, { duration: 500 })
        ),
        -1, true
      );
    } else {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      );
      orbOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2500 }),
          withTiming(0.5, { duration: 2500 })
        ),
        -1, true
      );
      ringScale.value = 1;
      ringOpacity.value = 0.1;
    }
  }, [isListening]);

  const animatedOrbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));
  
  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
         console.log("Microphone permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleQuery = async (queryText) => {
    const textToAsk = queryText || inputText;
    if (!textToAsk.trim() && !selectedImage) return;
    
    Speech.stop();
    setIsProcessing(true);
    setInputText(''); 
    setAiResponse(''); 
    
    try {
      let response;
      if (selectedImage) {
        response = await askWithImage(textToAsk || "What is in this image?", selectedImage.base64);
        setSelectedImage(null); 
      } else {
        response = await generalChat(textToAsk);
      }

      let cleanResponse = response.replace(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/gi, "").trim();
      setAiResponse(cleanResponse);
      
      Speech.speak(cleanResponse.replace(/\*/g, ''), {
        rate: 1.0,
        pitch: 1.0,
      });
    } catch (error) {
      setAiResponse("Sorry, I'm having trouble connecting to my servers.");
    }
    setIsProcessing(false);
  };

  const toggleListening = async () => {
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
        const { recording: newRecording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY );
        setRecording(newRecording);
        setIsListening(true);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setAiResponse("Microphone failed to start. Please check permissions.");
      setIsListening(false);
    }
  };

  const handleActionPress = () => {
    if (inputText.length > 0) {
      handleQuery(inputText);
    } else {
      toggleListening();
    }
  };

  const closeAssistant = () => {
    Speech.stop();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.modalOverlay}
      behavior="padding"
    >
      <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={closeAssistant} />
      
      <View style={styles.sheetContainer}>
        <LinearGradient colors={['rgba(28,12,58,0.95)', 'rgba(8,5,18,0.95)']} style={StyleSheet.absoluteFill} />
        <BlurView intensity={100} tint="dark" style={styles.blurBackground}>
          
          <View style={styles.topActionsRow}>
            <TouchableOpacity style={styles.gridBtn} onPress={() => navigation.navigate("Scanner")}>
              <Ionicons name="grid-outline" size={22} color="#D97757" />
            </TouchableOpacity>
          </View>

          <View style={styles.orbContainer}>
            <Animated.View style={[styles.glowRing, animatedRingStyle]} />
            <Animated.View style={[styles.glowOrb, animatedOrbStyle]}>
              <LinearGradient 
                colors={['#D97757', '#E91E63']} 
                style={styles.orbGradient} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}} 
              />
            </Animated.View>
            <View style={styles.orbCore} />
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatArea} 
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {isProcessing ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#D97757" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <Markdown style={markdownStyles}>{aiResponse}</Markdown>
            )}
            {selectedImage && (
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            )}
          </ScrollView>

          <View style={styles.searchPillWrapper}>
            <View style={styles.searchPill}>
              <TouchableOpacity style={styles.plusBtn} onPress={pickImage}>
                <Feather name={selectedImage ? "image" : "plus"} size={22} color="#FFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Message Optix..."
                placeholderTextColor="#A3A3A3"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleQuery(inputText)}
              />
              <TouchableOpacity 
                style={[
                  styles.actionBtn, 
                  isListening && styles.micBtnActive,
                  inputText.length > 0 && styles.sendBtnActive
                ]} 
                onPress={handleActionPress}
              >
                {inputText.length > 0 ? (
                  <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 3 }} />
                ) : (
                  <Ionicons name={isListening ? "square" : "mic"} size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheetContainer: { height: '88%', width: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  blurBackground: { flex: 1, padding: 24, paddingTop: 16 },
  topActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  gridBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  orbContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 35, height: 140 },
  glowRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#D97757', position: 'absolute' },
  glowOrb: { width: 84, height: 84, borderRadius: 42, position: 'absolute', overflow: 'hidden', shadowColor: '#D97757', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  orbGradient: { flex: 1 },
  orbCore: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', position: 'absolute', shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15 },
  
  chatArea: { flex: 1, marginBottom: 20 },
  chatContent: { paddingBottom: 20 },
  loadingWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  loadingText: { color: '#D97757', marginTop: 10, fontFamily: 'Rajdhani_600SemiBold' },
  
  searchPillWrapper: { paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  searchPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 30, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  plusBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, fontFamily: 'Rajdhani_500Medium', paddingHorizontal: 16 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  micBtnActive: { backgroundColor: '#E91E63' },
  sendBtnActive: { backgroundColor: '#D97757' },
  
  previewImage: { width: 150, height: 150, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }
});
