import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StatusBar, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Markdown from 'react-native-markdown-display';
import { generateStudyDashboard } from '../services/geminiService';
import { saveStudyMaterial } from '../services/studyService';

export default function StudyDashboardScreen({ route, navigation }) {
  const { extractedText, imageUri, base64 } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [materialId, setMaterialId] = useState(route.params?.materialId || null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (materialId && route.params?.title) {
      // Loading existing material
      setDashboardData({ title: route.params.title, overview: route.params.summary });
      setLoading(false);
    } else if (extractedText) {
      // Generating new material
      generateDashboard();
    }
  }, []);

  async function generateDashboard() {
    try {
      const response = await generateStudyDashboard(extractedText);
      
      const titleMatch = response.match(/TITLE:\s*(.*)/i);
      const overviewMatch = response.match(/OVERVIEW:\s*([\s\S]*)/i);
      
      const title = titleMatch ? titleMatch[1].trim() : "Study Material";
      const overview = overviewMatch ? overviewMatch[1].trim() : "Generated overview.";
      
      setDashboardData({ title, overview });
      
      // Save to Supabase automatically
      const saved = await saveStudyMaterial(title, extractedText, overview);
      if (saved) {
        setMaterialId(saved.id);
      }
    } catch (error) {
      Alert.alert("Error", "Could not analyze study material. " + error.message);
    }
    setLoading(false);
  }

  const features = [
    { icon: 'document-text-outline', label: 'Summary', screen: 'StudySummary', color: '#673AB7', bg: 'rgba(103, 58, 183, 0.15)' },
    { icon: 'book-outline', label: 'Notes', screen: 'StudyNotes', color: '#009688', bg: 'rgba(0, 150, 136, 0.15)' },
    { icon: 'albums-outline', label: 'Flashcards', screen: 'FlashcardReview', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' },
    { icon: 'help-circle-outline', label: 'Quiz', screen: 'InteractiveQuiz', color: '#E91E8C', bg: 'rgba(233, 30, 140, 0.15)' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Understanding concepts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        <BlurView intensity={30} tint="dark" style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("HomeDashboard")}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Dashboard</Text>
        </BlurView>

        <ScrollView contentContainerStyle={styles.content}>
          <BlurView intensity={20} tint="dark" style={styles.overviewCard}>
            <Text style={styles.title}>{dashboardData?.title}</Text>
            <Markdown style={markdownStyles}>{dashboardData?.overview}</Markdown>
          </BlurView>

        <Text style={styles.sectionTitle}>Study Tools</Text>
        <View style={styles.grid}>
          {features.map((f, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate(f.screen, { 
                  materialId, 
                  extractedText: extractedText || route.params?.originalText,
                  title: dashboardData?.title 
                });
              }}
              style={{ width: "48%", marginBottom: 15 }}
            >
              <BlurView intensity={30} tint="dark" style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={28} color={f.color} />
                </View>
                <Text style={styles.cardTitle}>{f.label}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating Chat Input inside ScrollView */}
        <View style={styles.inlineChatWrapper}>
          <BlurView intensity={50} tint="dark" style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask Optix anything..."
              placeholderTextColor="#BDBDBD"
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
              onPress={() => {
                if (!chatInput.trim()) return;
                navigation.navigate("Agent", { 
                  imageUri: route.params?.imageUri, 
                  imageText: extractedText || route.params?.originalText || dashboardData?.overview,
                  initialQuery: chatInput
                });
                setChatInput("");
              }}
              disabled={!chatInput.trim()}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        </View>

      </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0A" },
  loadingText: { marginTop: 12, color: "#888", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12, overflow: 'hidden' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  overviewCard: { backgroundColor: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: 'hidden' },
  title: { fontSize: 24, fontWeight: "800", color: "#FFF", marginBottom: 12 },
  overview: { fontSize: 15, color: "#E2E8F0", lineHeight: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { padding: 24, borderRadius: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: 'hidden' },
  iconBox: { width: 56, height: 56, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  inlineChatWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  chatInputContainer: {
    borderRadius: 30, overflow: 'hidden',
    padding: 8, paddingLeft: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  chatTextInput: {
    flex: 1, backgroundColor: "transparent", paddingHorizontal: 8,
    paddingVertical: 12, fontSize: 16, color: "#FFFFFF",
    fontFamily: 'Inter_500Medium',
    fontWeight: '600', letterSpacing: 0.5,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.2)" },
});

const markdownStyles = {
  body: {
    color: "#E2E8F0",
    fontSize: 16,
    lineHeight: 28, textAlign: 'justify',
    fontFamily: 'Inter_400Regular',
  },
  strong: {
    fontWeight: "bold",
    color: "#FFFFFF",
    backgroundColor: "rgba(108, 99, 255, 0.35)",
  },
  em: {
    fontStyle: "italic",
    color: "#D9D9D9",
  },
  heading1: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  heading2: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  paragraph: {
    marginTop: 5,
    marginBottom: 10,
  },
  bullet_list: {
    marginTop: 5,
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 5,
    lineHeight: 28, textAlign: 'justify',
  }
};
