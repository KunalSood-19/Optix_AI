import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateMCQ } from '../services/geminiService';
import { saveQuizAttempt } from '../services/studyService';

export default function QuizScreen({ route, navigation }) {
  const { materialId, extractedText } = route.params;
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { questionIndex: selectedIndex }
  const [difficulty, setDifficulty] = useState("medium"); // adaptive

  useEffect(() => {
    initQuiz();
  }, []);

  async function initQuiz() {
    setLoading(true);
    try {
      const result = await generateMCQ(extractedText, 5, difficulty);
      if (!result.questions || result.questions.length === 0) {
        throw new Error("No valid questions generated");
      }
      setQuestions(result.questions);
      setCurrentIndex(0);
      setSelectedOptions({});
    } catch (error) {
      Alert.alert("Error", "Could not generate quiz. " + error.message);
      navigation.goBack();
    }
    setLoading(false);
  }

  function handleSelect(optionIndex) {
    setSelectedOptions({ ...selectedOptions, [currentIndex]: optionIndex });
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  async function handleSubmit() {
    if (Object.keys(selectedOptions).length < questions.length) {
      Alert.alert("Incomplete", "Please answer all questions before submitting.");
      return;
    }

    setLoading(true);
    let score = 0;
    const reviewData = [];
    
    questions.forEach((q, index) => {
      const userAns = selectedOptions[index];
      if (userAns === q.correctAnswer) {
        score++;
      } else {
        reviewData.push({
          question: q.question,
          userAnswer: q.options[userAns],
          correctAnswer: q.options[q.correctAnswer],
          explanation: q.explanation
        });
      }
    });

    try {
      if (materialId) {
        await saveQuizAttempt(materialId, score, questions.length, reviewData);
      }
      
      setLoading(false);
      navigation.navigate("QuizResult", {
        score,
        total: questions.length,
        reviewData,
        materialId,
        extractedText
      });
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", "Could not save quiz attempt");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4C4C4C" />
        <Text style={styles.loadingText}>Generating adaptive quiz...</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const selected = selectedOptions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#F4F4F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz</Text>
        <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionText}>{currentQ.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQ.options.map((opt, i) => (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.optionBtn,
                selected === i && styles.selectedOption
              ]}
              onPress={() => handleSelect(i)}
            >
              <View style={[styles.radio, selected === i && styles.radioSelected]}>
                {selected === i && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.optionText, selected === i && styles.selectedOptionText]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.navBtn, currentIndex === 0 && styles.disabledBtn]} onPress={prevQuestion} disabled={currentIndex === 0}>
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>
        
        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity style={[styles.navBtn, styles.submitBtn]} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Quiz</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
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
  progressText: { fontSize: 14, color: "#A3A3A3", fontFamily: 'Rajdhani_600SemiBold' },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.4)", width: "100%" },
  progressFill: { height: "100%", backgroundColor: "#4C4C4C" },
  content: { padding: 20 },
  questionText: { fontSize: 20, fontFamily: 'Rajdhani_600SemiBold', color: "#F4F4F4", lineHeight: 30, marginBottom: 30 },
  optionsContainer: { gap: 12 },
  optionBtn: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  selectedOption: { borderColor: "#4C4C4C", backgroundColor: "rgba(77, 77, 77, 0.2)" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", marginRight: 15, justifyContent: "center", alignItems: "center" },
  radioSelected: { borderColor: "#4C4C4C" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4C4C4C" },
  optionText: { fontSize: 16,
    fontFamily: 'Rajdhani_500Medium', color: "#E2E8F0", flex: 1 },
  selectedOptionText: { color: "#F4F4F4", fontFamily: 'Rajdhani_600SemiBold' },
  footer: { flexDirection: "row", padding: 20, backgroundColor: "transparent", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "space-between" },
  navBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)" },
  disabledBtn: { opacity: 0.5 },
  navBtnText: { color: "#F4F4F4", fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 },
  nextBtn: { backgroundColor: "rgba(255,255,255,0.5)" },
  nextBtnText: { color: "#FFF", fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 },
  submitBtn: { backgroundColor: "#4C4C4C" },
  submitBtnText: { color: "#FFF", fontFamily: 'Rajdhani_700Bold', fontSize: 16 },
});
