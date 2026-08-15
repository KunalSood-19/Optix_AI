import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ScrollView  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuizResultScreen({ route, navigation }) {
  const { score, total, reviewData, materialId, extractedText } = route.params;
  const percentage = Math.round((score / total) * 100);
  
  const [showReview, setShowReview] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("StudyDashboard")}>
          <Ionicons name="close" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Accuracy</Text>
          <Text style={[styles.percentage, { color: percentage >= 80 ? '#4CAF50' : percentage >= 50 ? '#FF9800' : '#F44336' }]}>
            {percentage}%
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{score}</Text>
              <Text style={styles.statDesc}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{total - score}</Text>
              <Text style={styles.statDesc}>Incorrect</Text>
            </View>
          </View>
        </View>

        {reviewData.length > 0 && !showReview && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReview(true)}>
            <Ionicons name="alert-circle-outline" size={20} color="#FFF" />
            <Text style={styles.reviewBtnText}>Review Mistakes ({reviewData.length})</Text>
          </TouchableOpacity>
        )}

        {showReview && (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Weak Topics Detected</Text>
            {reviewData.map((item, i) => (
              <View key={i} style={styles.reviewCard}>
                <Text style={styles.qText}>Q: {item.question}</Text>
                
                <View style={styles.ansBox}>
                  <Text style={styles.wrongAns}>❌ Your Answer: {item.userAnswer}</Text>
                  <Text style={styles.correctAns}>✅ Correct: {item.correctAnswer}</Text>
                </View>
                
                <View style={styles.explanationBox}>
                  <Text style={styles.expTitle}>Explanation:</Text>
                  <Text style={styles.expText}>{item.explanation}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.askBtn}
                  onPress={() => navigation.navigate("Agent", { 
                    prefill: `Explain this to me: ${item.question}`,
                    context: extractedText
                  })}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color="#009688" />
                  <Text style={styles.askBtnText}>Explain differently in Chat</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={() => navigation.navigate("InteractiveQuiz", { materialId, extractedText })}
          >
            <Text style={styles.primaryBtnText}>Retry New Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={() => navigation.navigate("StudyDashboard")}
          >
            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  content: { padding: 20, paddingBottom: 40 },
  scoreCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 30, alignItems: "center", borderWidth: 1, borderColor: "#EBEBEB", marginBottom: 20 },
  scoreLabel: { fontSize: 16, color: "#9E9E9E", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  percentage: { fontSize: 64, fontWeight: "bold", marginVertical: 10 },
  statsRow: { flexDirection: "row", width: "100%", justifyContent: "center", gap: 30, marginTop: 10, borderTopWidth: 1, borderColor: "#F4F5F9", paddingTop: 20 },
  statBox: { alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  statDesc: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  reviewBtn: { flexDirection: "row", backgroundColor: "#F44336", padding: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  reviewBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  reviewSection: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 15 },
  reviewCard: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#EBEBEB", marginBottom: 15 },
  qText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E", marginBottom: 15 },
  ansBox: { backgroundColor: "#F4F5F9", padding: 12, borderRadius: 8, gap: 8, marginBottom: 15 },
  wrongAns: { color: "#F44336", fontWeight: "500" },
  correctAns: { color: "#4CAF50", fontWeight: "500" },
  explanationBox: { paddingLeft: 12, borderLeftWidth: 3, borderColor: "#EBEBEB" },
  expTitle: { fontSize: 12, fontWeight: "700", color: "#9E9E9E", marginBottom: 4, textTransform: "uppercase" },
  expText: { color: "#666", lineHeight: 22 },
  askBtn: { flexDirection: "row", alignItems: "center", marginTop: 15, gap: 5 },
  askBtnText: { color: "#009688", fontWeight: "600" },
  actions: { gap: 12, marginTop: 20 },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  primaryBtn: { backgroundColor: "#E91E8C" },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#EBEBEB" },
  secondaryBtnText: { color: "#1A1A2E", fontSize: 16, fontWeight: "600" },
});
