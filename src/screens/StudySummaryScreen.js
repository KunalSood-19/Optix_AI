import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateStudySummary } from '../services/geminiService';

export default function StudySummaryScreen({ route, navigation }) {
  const { extractedText, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [level, setLevel] = useState("Standard"); // Quick, Standard, Detailed

  useEffect(() => {
    fetchSummary(level);
  }, [level]);

  async function fetchSummary(targetLevel) {
    setLoading(true);
    setSummary("");
    try {
      const result = await generateStudySummary(extractedText, targetLevel);
      setSummary(result);
    } catch (error) {
      setSummary("Error generating summary. Please try again.");
    }
    setLoading(false);
  }

  const levels = ["Quick", "Standard", "Detailed"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summary - {title}</Text>
      </View>

      <View style={styles.tabs}>
        {levels.map((l) => (
          <TouchableOpacity 
            key={l} 
            style={[styles.tab, level === l && styles.activeTab]}
            onPress={() => setLevel(l)}
          >
            <Text style={[styles.tabText, level === l && styles.activeTabText]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#673AB7" />
          <Text style={styles.loadingText}>Synthesizing {level.toLowerCase()} summary...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.summaryText}>{summary}</Text>
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
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF" },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#673AB7" },
  tabText: { fontSize: 14, color: "#9E9E9E", fontWeight: "600" },
  activeTabText: { color: "#673AB7" },
  content: { padding: 20 },
  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#EBEBEB" },
  summaryText: { fontSize: 16, color: "#333", lineHeight: 26 },
});
