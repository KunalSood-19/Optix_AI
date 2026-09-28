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
          <Ionicons name="arrow-back" size={24} color="#F4F4F4" />
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
          <ActivityIndicator size="large" color="#4C4C4C" />
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
  container: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#A3A3A3", fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "transparent" },
  backBtn: { marginRight: 15, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4", flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: "transparent", borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#4C4C4C" },
  tabText: { fontSize: 14, color: "#A3A3A3", fontFamily: 'Rajdhani_600SemiBold' },
  activeTabText: { color: "#4C4C4C",
    fontFamily: 'Rajdhani_500Medium', },
  content: { padding: 20 },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, backgroundColor: "rgba(255,255,255,0.12)", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  summaryText: { fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', color: "#E2E8F0", lineHeight: 26 },
});
