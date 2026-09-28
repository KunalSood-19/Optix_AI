import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateStudyNotes } from '../services/geminiService';
import Markdown from 'react-native-markdown-display';

export default function StudyNotesScreen({ route, navigation }) {
  const { extractedText, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const result = await generateStudyNotes(extractedText);
      setNotes(result);
    } catch (error) {
      setNotes("Error generating notes. Please try again.");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F4F4F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes - {title}</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchNotes}>
          <Ionicons name="refresh-outline" size={20} color="#A3A3A3" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A3A3A3" />
          <Text style={styles.loadingText}>Structuring study notes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Markdown style={{ body: styles.mdBody, heading1: styles.mdH1, heading2: styles.mdH2 }}>
              {notes}
            </Markdown>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#A3A3A3", fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  backBtn: { marginRight: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4", flex: 1 },
  actionBtn: { padding: 8, backgroundColor: "rgba(163, 163, 163, 0.2)", borderRadius: 8 },
  content: { padding: 20 },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, backgroundColor: "rgba(255,255,255,0.12)", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  mdBody: { fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', color: "#E2E8F0", lineHeight: 26 },
  mdH1: { fontSize: 22, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4", marginBottom: 10, marginTop: 10 },
  mdH2: { fontSize: 18, fontFamily: 'Rajdhani_600SemiBold', color: "#F4F4F4", marginBottom: 8, marginTop: 12 },
});
