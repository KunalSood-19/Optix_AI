import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert, Platform  , StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { parseHandwriting } from '../services/geminiService';
import { saveHandwriting } from '../services/historyService';

export default function HandwritingEditorScreen({ route, navigation }) {
  const { base64Array, manualText } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [recognizedText, setRecognizedText] = useState("");
  const [isMath, setIsMath] = useState(false);

  useEffect(() => {
    if (manualText) {
      setRecognizedText(manualText);
      setLoading(false);
    } else {
      processHandwriting();
    }
  }, []);

  async function processHandwriting() {
    setLoading(true);
    try {
      const result = await parseHandwriting(base64Array);
      setRecognizedText(result.text || "");
      setIsMath(result.isMath === true);
    } catch (error) {
      Alert.alert("Error", "Could not process handwriting. " + error.message);
    }
    setLoading(false);
  }

  function handleRoute(destination) {
    if (destination === "StudyDashboard") {
      navigation.navigate("StudyDashboard", {
        extractedText: recognizedText,
      });
    } else if (destination === "MathSolver") {
      navigation.navigate("MathSolver", {
        manualText: recognizedText
      });
    }
  }

  async function handleExportTxt() {
    try {
      const fileUri = FileSystem.documentDirectory + 'Handwritten_Notes.txt';
      await FileSystem.writeAsStringAsync(fileUri, recognizedText, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      Alert.alert("Export Error", "Could not export as TXT.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A3A3A3" />
        <Text style={styles.loadingText}>Digitizing handwriting...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F4F4F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recognized Handwriting</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.editorCard}>
          {/* Lined paper effect */}
          <View style={styles.linedPaper}>
            {Array.from({length: 20}).map((_, i) => (
              <View key={i} style={styles.line} />
            ))}
          </View>
          <TextInput
            style={styles.editorInput}
            value={recognizedText}
            onChangeText={setRecognizedText}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#A3A3A3"
            placeholder="Edit your recognized notes here..."
          />
        </View>

        {isMath && (
          <View style={styles.mathAlert}>
            <Ionicons name="calculator-outline" size={20} color="#A3A3A3" />
            <Text style={styles.mathAlertText}>Mathematical content detected!</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isMath ? (
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: 'rgba(163, 163, 163, 0.2)', borderWidth: 1, borderColor: '#A3A3A3'}]} onPress={() => handleRoute("MathSolver")}>
              <Ionicons name="calculator" size={20} color="#A3A3A3" />
              <Text style={[styles.actionBtnText, {color: '#A3A3A3'}]}>Solve in Math Engine</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#4C4C4C'}]} onPress={() => handleRoute("StudyDashboard")}>
              <Ionicons name="school" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Open in Study Mode</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)'}]} 
            onPress={() => navigation.navigate("Agent", { imageText: recognizedText })}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#FFF" />
            <Text style={[styles.actionBtnText, {color: '#FFF'}]}>Ask Optix</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#4D4D4D'}]} 
            onPress={async () => {
              try {
                await saveHandwriting(recognizedText);
                Alert.alert("Success", "Saved to Handwriting Notes!");
              } catch(e) {
                Alert.alert("Error", "Could not save to notes.");
              }
            }}
          >
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Save Note</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#A3A3A3'}]} 
            onPress={handleExportTxt}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Export as .TXT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#050505" },
  loadingText: { marginTop: 12, color: "#A3A3A3", fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "transparent" },
  backBtn: { marginRight: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4" },
  content: { padding: 20 },
  editorCard: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", minHeight: 400, overflow: "hidden" },
  linedPaper: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 30 },
  line: { height: 28, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.4)" },
  editorInput: { flex: 1, fontSize: 18, color: "#F4F4F4", lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'MarkerFelt-Thin' : 'sans-serif-medium' },
  mathAlert: { flexDirection: "row", backgroundColor: "rgba(163, 163, 163, 0.1)", padding: 15, borderRadius: 12, alignItems: "center", gap: 10, marginTop: 20, borderWidth: 1, borderColor: "rgba(163, 163, 163, 0.3)" },
  mathAlertText: { color: "#A3A3A3", fontFamily: 'Rajdhani_700Bold' },
  actions: { marginTop: 20, gap: 12 },
  actionBtn: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 8 },
  actionBtnText: { color: "#FFF", fontFamily: 'Rajdhani_700Bold', fontSize: 16 },
});
