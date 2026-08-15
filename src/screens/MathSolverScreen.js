import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Markdown from 'react-native-markdown-display';
import { parseMathImage, explainMathSolution } from '../services/geminiService';
import { solveMathDeterministically } from '../services/mathService';
import { saveMathHistory } from '../services/historyService';

export default function MathSolverScreen({ route, navigation }) {
  // Params can come from Scanner (imageUri, base64) or direct text input (manualText)
  const { imageUri, base64, manualText } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("Detecting Expression..."); 
  
  const [expression, setExpression] = useState("");
  const [mathType, setMathType] = useState("");
  const [confidence, setConfidence] = useState("high");
  
  const [deterministicSteps, setDeterministicSteps] = useState([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    initSolver();
  }, []);

  async function initSolver() {
    setLoading(true);
    setExplanation("");
    try {
      let detectedExpr = "";
      if (manualText) {
        detectedExpr = manualText;
        setMathType("Manual Input");
      } else {
        setPhase("Extracting Problem with AI...");
        const result = await parseMathImage(base64);
        detectedExpr = result.expression;
        setMathType(result.type);
        setConfidence(result.confidence);
      }
      
      setExpression(detectedExpr);
      
      // Auto solve if confidence is high, else wait for user to confirm
      if (manualText || confidence !== "low") {
        await executeSolver(detectedExpr);
      }
      
    } catch (error) {
      Alert.alert("Error", "Could not detect mathematical problem. " + error.message);
    }
    setLoading(false);
  }

  async function executeSolver(exprToSolve) {
    setLoading(true);
    setPhase("Solving Deterministically...");
    try {
      const solverResult = solveMathDeterministically(exprToSolve);
      
      setDeterministicSteps(solverResult.steps || []);
      setFinalAnswer(solverResult.finalAnswer || "No direct answer found");
      
      if (solverResult.requiresAI) {
        setPhase("Offloading to AI Solver...");
        await fetchAIExplanation(exprToSolve, solverResult.steps, solverResult.finalAnswer);
      }
    } catch (error) {
      Alert.alert("Solver Error", error.message);
    }
    setLoading(false);
  }

  async function fetchAIExplanation(expr = expression, steps = deterministicSteps, ans = finalAnswer) {
    setExplaining(true);
    try {
      const expl = await explainMathSolution(expr, steps, ans);
      setExplanation(expl);
    } catch (e) {
      setExplanation("Unable to generate explanation. " + e.message);
    }
    setExplaining(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{phase}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        <BlurView intensity={30} tint="dark" style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Math Solver</Text>
        </BlurView>

        <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Problem</Text>
          {confidence === "low" && <Text style={styles.warning}>Identification may be uncertain.</Text>}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={expression}
              onChangeText={setExpression}
              multiline
            />
            <TouchableOpacity 
              style={styles.solveBtn}
              onPress={() => executeSolver(expression)}
            >
              <Text style={styles.solveBtnText}>Solve</Text>
            </TouchableOpacity>
          </View>
        </View>

        {deterministicSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deterministic Steps</Text>
            <BlurView intensity={20} tint="dark" style={styles.stepsCard}>
              {deterministicSteps.map((step, i) => (
                <Markdown key={i} style={markdownStyles}>{"• " + step}</Markdown>
              ))}
            </BlurView>
          </View>
        )}

        {finalAnswer ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Final Answer</Text>
            <BlurView intensity={20} tint="dark" style={styles.answerCard}>
              <Text style={styles.answerText}>{finalAnswer}</Text>
            </BlurView>
          </View>
        ) : null}

        {explanation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Explanation</Text>
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <Markdown style={markdownStyles}>{explanation}</Markdown>
            </BlurView>
          </View>
        ) : (
          finalAnswer ? (
            <TouchableOpacity 
              style={styles.aiBtn}
              onPress={() => fetchAIExplanation()}
              disabled={explaining}
            >
              {explaining ? <ActivityIndicator color="#FFF" /> : <Ionicons name="sparkles-outline" size={20} color="#FFCC00" />}
              <Text style={styles.aiBtnText}>Ask Optix for Explanation</Text>
            </TouchableOpacity>
          ) : null
        )}

        {finalAnswer ? (
          <TouchableOpacity 
            style={[styles.aiBtn, {backgroundColor: '#4CAF50', marginTop: 15}]}
            onPress={async () => {
              try {
                await saveMathHistory(expression, deterministicSteps, finalAnswer, mathType);
                Alert.alert("Success", "Saved to Math History!");
              } catch(e) {
                Alert.alert("Error", "Could not save to history.");
              }
            }}
          >
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={styles.aiBtnText}>Save to History</Text>
          </TouchableOpacity>
        ) : null}

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
                  imageText: expression || "",
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
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4, fontFamily: 'Inter_400Regular' },
  warning: { color: "#FF9800", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  inputContainer: { flexDirection: "row", gap: 10 },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 15, fontSize: 16, color: "#FFF", minHeight: 60 },
  solveBtn: { backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center", paddingHorizontal: 20, borderRadius: 16 },
  solveBtnText: { color: "#FFF", fontWeight: "700" },
  stepsCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", gap: 10 },
  stepText: { fontSize: 15, color: "#E2E8F0", lineHeight: 24 },
  answerCard: { backgroundColor: "rgba(76, 175, 80, 0.1)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(76, 175, 80, 0.3)", alignItems: "center" },
  answerText: { fontSize: 24, fontWeight: "700", color: "#4CAF50", fontFamily: 'Inter_400Regular' },
  card: { backgroundColor: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: 'hidden' },
  explanationText: { fontSize: 15, color: "#E2E8F0", lineHeight: 24 },
  aiBtn: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 },
  aiBtnText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
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
