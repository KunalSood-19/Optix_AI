import { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  summarizeText, chatWithDocument, extractReceiptData,
  extractBusinessCardData, solveMath, generateNotes,
} from "../services/geminiService";
import { saveDocument } from "../services/storageService";
import * as Clipboard from "expo-clipboard";
import Markdown from "react-native-markdown-display";
import { generateAndSharePDF } from "../services/pdfService";

// --- Custom Typewriter Animation Component ---
function TypewriterText({ text, speed = 15, style, isMarkdown = false }) {
  const [displayedText, setDisplayedText] = useState("");
  const currentTextRef = useRef("");
  const indexRef = useRef(0);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    setDisplayedText("");
    currentTextRef.current = "";
    indexRef.current = 0;
    lastUpdateTimeRef.current = Date.now();

    if (!text) return;

    const animate = () => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current >= speed) {
        if (indexRef.current < text.length) {
          currentTextRef.current += text.charAt(indexRef.current);
          setDisplayedText(currentTextRef.current);
          indexRef.current += 1;
          lastUpdateTimeRef.current = now;
        } else {
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text, speed]);

  if (isMarkdown) {
    return <Markdown style={{ body: style }}>{displayedText}</Markdown>;
  }

  return <Text style={style}>{displayedText}</Text>;
}

export default function ResultScreen({ route, navigation }) {
  const { imageUri, base64, extractedText, mode } = route.params;
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [saving, setSaving] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  const tabs =
    mode === "math" ? ["summary", "text", "chat"]
    : mode === "notes" ? ["summary", "text"]
    : receiptData ? ["summary", "text", "chat", "receipt"]
    : ["summary", "text", "chat"];

  useEffect(() => { generateSummary(); }, []);

  async function copySummary() {
    await Clipboard.setStringAsync(aiSummary || "");
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  }

  async function copyText() {
    await Clipboard.setStringAsync(extractedText || "");
    Alert.alert("Copied", "Text copied to clipboard");
  }

  async function generateSummary() {
    setLoading(true);
    try {
      if (mode === "ocr") {
        setAiSummary(extractedText || "No text detected");
      } else if (mode === "summary") {
        setAiSummary(await summarizeText(extractedText));
      } else if (mode === "receipt") {
        const data = await extractReceiptData(extractedText);
        setReceiptData(data);
        setAiSummary(data
          ? `🏪 Merchant: ${data.merchant}\n\n📅 Date: ${data.date}\n\n💰 Total: ${data.total}\n\n📂 Category: ${data.category}`
          : "Unable to extract receipt details.");
      } else if (mode === "businessCard") {
        setAiSummary(await extractBusinessCardData(extractedText));
      } else if (mode === "math") {
        const cleaned = extractedText?.replace(/\?/g, "²").replace(/™/g, "7").replace(/x\?/g, "x²");
        setAiSummary(await solveMath(cleaned));
      } else if (mode === "notes") {
        setAiSummary(await generateNotes(extractedText));
      } else {
        setAiSummary(await summarizeText(extractedText));
      }
    } catch (e) { console.log("ERROR:", e); }
    setLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: question }]);
    setChatLoading(true);
    try {
      const answer = mode === "math"
        ? await solveMath(question)
        : await chatWithDocument(extractedText, question);
      setChatHistory((h) => [...h, { role: "ai", text: answer }]);
    } catch (error) {
      setChatHistory((h) => [...h, { role: "ai", text: `Error: ${error.message}` }]);
    }
    setChatLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const category = receiptData ? "Receipt" : "General";
      await saveDocument(imageUri, extractedText, aiSummary, category);
      Alert.alert("Saved!", "Document saved to PDF Vault", [
        { text: "Go to Vault", onPress: () => navigation.navigate("Vault") },
        { text: "OK" },
      ]);
    } catch {
      Alert.alert("Error", "Could not save document");
    }
    setSaving(false);
  }

  const modeLabel = {
    ocr: "OCR", summary: "Summary", receipt: "Receipt",
    businessCard: "Business Card", math: "Math Solver", notes: "Notes",
  }[mode] || "Scan Result";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1A1A2E" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Scan Result</Text>
            <Text style={styles.headerSub}>{modeLabel} mode</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#6C63FF" />
                : <Ionicons name="bookmark-outline" size={20} color="#6C63FF" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => generateAndSharePDF(imageUri, extractedText, aiSummary)}
            >
              <Ionicons name="share-social-outline" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview */}
        <View style={{ position: "relative" }}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.viewOriginalBtn} onPress={() => setShowOriginal(true)}>
            <Ionicons name="expand-outline" size={16} color="#6C63FF" />
            <Text style={styles.viewOriginalText}>View Original</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>

          {/* Summary Tab */}
          {activeTab === "summary" && (
            <View style={styles.section}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <View style={styles.loadingIconWrap}>
                    <Ionicons name="scan-circle-outline" size={56} color="#6C63FF" />
                  </View>
                  <Text style={styles.loadingTitle}>Analyzing...</Text>
                  <Text style={styles.loadingSubtitle}>Optix is processing your scan</Text>
                  <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 16 }} />
                </View>
              ) : (
                <>
                  <View style={styles.rowHeader}>
                    <Text style={styles.label}>AI Summary</Text>
                    <TouchableOpacity style={styles.copyBtn} onPress={copySummary}>
                      <Ionicons
                        name={summaryCopied ? "checkmark-outline" : "copy-outline"}
                        size={15}
                        color={summaryCopied ? "#00C853" : "#6C63FF"}
                      />
                      <Text style={[styles.copyBtnText, summaryCopied && { color: "#00C853" }]}>
                        {summaryCopied ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.card}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {/* Integrated animated Markdown via TypewriterText component */}
                      <TypewriterText 
                        text={aiSummary} 
                        speed={10} 
                        style={styles.summaryText} 
                        isMarkdown={true}
                      />
                    </ScrollView>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Text Tab */}
          {activeTab === "text" && (
            <View style={styles.section}>
              <View style={styles.rowHeader}>
                <Text style={styles.label}>Extracted Text</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyText}>
                  <Ionicons name="copy-outline" size={15} color="#6C63FF" />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <Text selectable style={styles.extractedText}>
                  {extractedText || "No text found"}
                </Text>
              </View>
            </View>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <View style={styles.section}>
              <Text style={styles.label}>Chat with Document</Text>
              {chatHistory.length === 0 && (
                <View style={styles.suggestions}>
                  {["What is this document about?", "Give me a brief summary", "What are the key points?"].map((q, i) => (
                    <TouchableOpacity key={i} style={styles.suggestion} onPress={() => setChatInput(q)}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6C63FF" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {chatHistory.map((msg, i) => (
                <View key={i} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
                  {msg.role === "user" ? (
                    <Text style={[styles.bubbleText, styles.userText]}>{msg.text}</Text>
                  ) : (
                    /* Uses standard character animation loop layout logic */
                    <TypewriterText 
                      text={msg.text} 
                      speed={12} 
                      style={styles.bubbleText} 
                    />
                  )}
                </View>
              ))}
              {chatLoading && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#6C63FF" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              )}
            </View>
          )}

          {/* Receipt Tab */}
          {activeTab === "receipt" && receiptData && (
            <View style={styles.section}>
              <Text style={styles.label}>Receipt Details</Text>
              <View style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIconWrap}>
                    <Ionicons name="receipt-outline" size={22} color="#FF9800" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptMerchant}>{receiptData.merchant || "Receipt"}</Text>
                    <Text style={styles.receiptDate}>{receiptData.date || "N/A"}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{receiptData.category || "General"}</Text>
                  </View>
                </View>
                <View style={styles.receiptDivider} />
                {receiptData.items?.length > 0
                  ? receiptData.items.map((item, index) => (
                      <View key={index} style={styles.receiptRow}>
                        <Text style={styles.receiptItemName}>{item.name}</Text>
                        <Text style={styles.receiptItemPrice}>{item.price}</Text>
                      </View>
                    ))
                  : <Text style={styles.noItems}>No line items detected</Text>}
                <View style={styles.receiptDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{receiptData.total || "N/A"}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {activeTab === "chat" && (
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask about this document..."
              placeholderTextColor="#BDBDBD"
              value={chatInput}
              onChangeText={setChatInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
              onPress={sendChat}
              disabled={!chatInput.trim()}
            >
              <Ionicons name="send" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={showOriginal} animationType="fade" transparent>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowOriginal(false)}>
              <View style={styles.closeBtnInner}>
                <Ionicons name="close" size={22} color="#1A1A2E" />
              </View>
            </TouchableOpacity>
            <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 25,
    paddingVertical: 29, backgroundColor: "#FFFFFF", borderBottomWidth: 1,
    borderColor: "#EBEBEB", gap: 13,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#F4F5F9",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  headerSub: { fontSize: 11, color: "#9E9E9E", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF0FF",
    alignItems: "center", justifyContent: "center",
  },
  preview: { width: "100%", height: 180, backgroundColor: "#EBEBEB" },
  viewOriginalBtn: {
    position: "absolute", right: 14, bottom: 14, backgroundColor: "#FFFFFF",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#EBEBEB", gap: 5,
  },
  viewOriginalText: { color: "#6C63FF", fontSize: 12, fontWeight: "600" },
  tabs: { flexDirection: "row", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#6C63FF" },
  tabText: { fontSize: 12, color: "#9E9E9E", fontWeight: "500" },
  activeTabText: { color: "#6C63FF", fontWeight: "700" },
  content: { flex: 1 },
  section: { padding: 16 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  label: {
    fontSize: 11, color: "#9E9E9E", fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10,
  },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EEF0FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  copyBtnText: { fontSize: 12, color: "#6C63FF", fontWeight: "600" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#EBEBEB" },
  summaryText: { fontSize: 15, color: "#1A1A2E", lineHeight: 26 },
  extractedText: {
    fontSize: 14, color: "#444", lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  loadingBox: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  loadingIconWrap: {
    width: 88, height: 88, borderRadius: 24, backgroundColor: "#EEF0FF",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  loadingTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  loadingSubtitle: { fontSize: 13, color: "#9E9E9E", marginTop: 4, textAlign: "center" },
  suggestions: { gap: 8, marginBottom: 16 },
  suggestion: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    padding: 13, borderRadius: 12, borderWidth: 1, borderColor: "#EBEBEB",
  },
  suggestionText: { fontSize: 13, color: "#6C63FF" },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: "82%" },
  userBubble: { backgroundColor: "#6C63FF", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: "#FFFFFF", alignSelf: "flex-start", borderWidth: 1, borderColor: "#EBEBEB", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  typingText: { fontSize: 13, color: "#9E9E9E" },
  chatInputBar: {
    flexDirection: "row", alignItems: "flex-end", padding: 12,
    backgroundColor: "#FFFFFF", gap: 10, borderTopWidth: 1, borderColor: "#EBEBEB",
  },
  chatTextInput: {
    flex: 1, backgroundColor: "#F4F5F9", borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, color: "#1A1A2E", maxHeight: 100,
    borderWidth: 1, borderColor: "#EBEBEB",
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "#C5C3F5" },
  receiptCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#EBEBEB" },
  receiptHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  receiptIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center" },
  receiptMerchant: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  receiptDate: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  categoryBadge: { backgroundColor: "#F4F5F9", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, color: "#888", fontWeight: "600" },
  receiptDivider: { borderBottomWidth: 1, borderColor: "#EBEBEB", borderStyle: "dashed", marginVertical: 12 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  receiptItemName: { fontSize: 14, color: "#444", flex: 1 },
  receiptItemPrice: { fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  noItems: { fontSize: 13, color: "#9E9E9E", textAlign: "center", paddingVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, fontWeight: "700", color: "#9E9E9E", letterSpacing: 0.8, textTransform: "uppercase" },
  totalAmount: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", justifyContent: "center" },
  fullImage: { width: "100%", height: "90%" },
  closeBtn: { position: "absolute", top: 52, right: 20, zIndex: 999 },
  closeBtnInner: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
});