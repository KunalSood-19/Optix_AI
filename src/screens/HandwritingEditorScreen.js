import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert, Platform  } from 'react-native';
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
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Digitizing handwriting...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
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
            placeholder="Edit your recognized notes here..."
          />
        </View>

        {isMath && (
          <View style={styles.mathAlert}>
            <Ionicons name="calculator-outline" size={20} color="#2E7D32" />
            <Text style={styles.mathAlertText}>Mathematical content detected!</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isMath ? (
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]} onPress={() => handleRoute("MathSolver")}>
              <Ionicons name="calculator" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Solve in Math Engine</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#673AB7'}]} onPress={() => handleRoute("StudyDashboard")}>
              <Ionicons name="school" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Open in Study Mode</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EBEBEB'}]} 
            onPress={() => navigation.navigate("Agent", { imageText: recognizedText })}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#1A1A2E" />
            <Text style={[styles.actionBtnText, {color: '#1A1A2E'}]}>Ask Optix</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, {backgroundColor: '#2196F3'}]} 
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
            style={[styles.actionBtn, {backgroundColor: '#FF9800'}]} 
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
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#9E9E9E", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  content: { padding: 20 },
  editorCard: { backgroundColor: "#FFFDE7", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#EBEBEB", minHeight: 400, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: "hidden" },
  linedPaper: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: 30 },
  line: { height: 28, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,255,0.1)" },
  editorInput: { flex: 1, fontSize: 18, color: "#1A1A2E", lineHeight: 28, fontFamily: Platform.OS === 'ios' ? 'MarkerFelt-Thin' : 'sans-serif-medium' },
  mathAlert: { flexDirection: "row", backgroundColor: "#E8F5E9", padding: 15, borderRadius: 12, alignItems: "center", gap: 10, marginTop: 20, borderWidth: 1, borderColor: "#4CAF50" },
  mathAlertText: { color: "#2E7D32", fontWeight: "700" },
  actions: { marginTop: 20, gap: 12 },
  actionBtn: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 8 },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
