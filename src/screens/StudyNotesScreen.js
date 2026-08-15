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
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes - {title}</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={fetchNotes}>
          <Ionicons name="refresh-outline" size={20} color="#009688" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#009688" />
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
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#9E9E9E", fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  actionBtn: { padding: 8, backgroundColor: "#E0F2F1", borderRadius: 8 },
  content: { padding: 20 },
  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#EBEBEB" },
  mdBody: { fontSize: 16, color: "#333", lineHeight: 26 },
  mdH1: { fontSize: 22, fontWeight: "bold", color: "#1A1A2E", marginBottom: 10, marginTop: 10 },
  mdH2: { fontSize: 18, fontWeight: "600", color: "#1A1A2E", marginBottom: 8, marginTop: 12 },
});
