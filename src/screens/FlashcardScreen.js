import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateFlashcards } from '../services/geminiService';
import { saveFlashcards, getFlashcards, updateFlashcardStatus } from '../services/studyService';

export default function FlashcardScreen({ route, navigation }) {
  const { materialId, extractedText, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [stats, setStats] = useState({ known: 0, review: 0 });

  useEffect(() => {
    initFlashcards();
  }, []);

  async function initFlashcards() {
    setLoading(true);
    try {
      if (!materialId) throw new Error("No material ID linked");
      
      let existing = await getFlashcards(materialId);
      
      if (!existing || existing.length === 0) {
        // Generate new flashcards
        const result = await generateFlashcards(extractedText);
        await saveFlashcards(materialId, result.flashcards);
        existing = await getFlashcards(materialId);
      }
      
      setFlashcards(existing);
      updateStats(existing);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not load flashcards. " + error.message);
    }
    setLoading(false);
  }

  function updateStats(cards) {
    const known = cards.filter(c => c.status === 'known').length;
    const review = cards.filter(c => c.status === 'review').length;
    setStats({ known, review });
  }

  async function handleMark(status) {
    const currentCard = flashcards[currentIndex];
    try {
      await updateFlashcardStatus(currentCard.id, status);
      
      const newCards = [...flashcards];
      newCards[currentIndex].status = status;
      setFlashcards(newCards);
      updateStats(newCards);
      
      nextCard();
    } catch (e) {
      Alert.alert("Error", "Could not save progress");
    }
  }

  function nextCard() {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert("Complete", "You've reviewed all cards!");
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Generating flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No flashcards generated.</Text>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <Text style={styles.progressText}>{currentIndex + 1} / {flashcards.length}</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statPill}><View style={[styles.dot, {backgroundColor: '#4CAF50'}]}/><Text>Known: {stats.known}</Text></View>
        <View style={styles.statPill}><View style={[styles.dot, {backgroundColor: '#F44336'}]}/><Text>Review: {stats.review}</Text></View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.flashcard}
          activeOpacity={0.9}
          onPress={() => setIsFlipped(!isFlipped)}
        >
          <Text style={styles.cardIndicator}>{isFlipped ? "Answer" : "Question"}</Text>
          <Text style={styles.cardText}>
            {isFlipped ? currentCard.answer : currentCard.question}
          </Text>
          <Text style={styles.tapPrompt}>Tap to flip</Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.navBtn} onPress={prevCard}>
            <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#F44336'}]} onPress={() => handleMark('review')}>
            <Ionicons name="close" size={24} color="#FFF" />
            <Text style={styles.actionBtnText}>Review</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]} onPress={() => handleMark('known')}>
            <Ionicons name="checkmark" size={24} color="#FFF" />
            <Text style={styles.actionBtnText}>Known</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navBtn} onPress={nextCard}>
            <Ionicons name="chevron-forward" size={24} color="#1A1A2E" />
          </TouchableOpacity>
        </View>
      </View>
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
  progressText: { fontSize: 14, color: "#9E9E9E", fontWeight: "600" },
  statsBar: { flexDirection: "row", justifyContent: "center", gap: 15, paddingVertical: 15 },
  statPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#EBEBEB" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  content: { flex: 1, padding: 20, alignItems: "center" },
  flashcard: { width: "100%", flex: 1, maxHeight: 400, backgroundColor: "#FFF", borderRadius: 24, padding: 30, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#EBEBEB", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardIndicator: { position: "absolute", top: 20, left: 20, color: "#FF9800", fontWeight: "700", textTransform: "uppercase", fontSize: 12 },
  cardText: { fontSize: 22, color: "#1A1A2E", textAlign: "center", fontWeight: "500", lineHeight: 32 },
  tapPrompt: { position: "absolute", bottom: 20, color: "#9E9E9E", fontSize: 12 },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 30, width: "100%", justifyContent: "space-between", paddingHorizontal: 10 },
  navBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFF", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#EBEBEB" },
  actionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 5 },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
