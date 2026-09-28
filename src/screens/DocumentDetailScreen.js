import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from "react";
import { 
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { chatWithDocument } from "../services/geminiService";
import { updateDocumentTitle } from "../services/storageService";

// --- Custom Typewriter Animation Component ---
function TypewriterText({ text, speed = 20, style, selectable }) {
  const [displayedText, setDisplayedText] = useState("");
  const currentTextRef = useRef("");
  const indexRef = useRef(0);
  const animationFrameRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    // Reset state whenever new text content arrives
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
          return; // Animation completes smoothly
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

  return (
    <Text selectable={selectable} style={style}>
      {displayedText}
    </Text>
  );
}

// --- Main Document Screen ---
export default function DocumentDetailScreen({ route, navigation }) {
  const { doc } = route.params;
  const [activeTab, setActiveTab] = useState("summary");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [summaryCopied, setSummaryCopied] = useState(false);

  async function copySummary() {
    await Clipboard.setStringAsync(doc.aiSummary || "");
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: question }]);
    setChatLoading(true);
    try {
      const answer = await chatWithDocument(doc.extractedText, question);
      setChatHistory((h) => [...h, { role: "ai", text: answer }]);
    } catch {
      setChatHistory((h) => [...h, { role: "ai", text: "Error. Try again." }]);
    }
    setChatLoading(false);
  }

  async function saveTitle() {
    await updateDocumentTitle(doc.id, title);
    setEditingTitle(false);
  }

  const TABS = ["summary", "text", "chat"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={20} color="#F4F4F4" />
          </TouchableOpacity>
          {editingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              onBlur={saveTitle}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingTitle(true)} style={styles.titleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
              <Ionicons name="pencil-outline" size={13} color="#9E9E9E" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{doc.category}</Text>
          </View>
        </View>

        {/* Image Preview */}
        <Image source={{ uri: doc.path }} style={styles.preview} resizeMode="contain" />

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab) => (
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
              <View style={styles.rowHeader}>
                <Text style={styles.label}>AI Summary</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copySummary}>
                  <Ionicons
                    name={summaryCopied ? "checkmark-outline" : "copy-outline"}
                    size={15}
                    color={summaryCopied ? "#A3A3A3" : "#4C4C4C"}
                  />
                  <Text style={[styles.copyBtnText, summaryCopied && { color: "#A3A3A3" }]}>
                    {summaryCopied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                {/* Replaced static Text with Animated Typewriter component */}
                <TypewriterText 
                  selectable 
                  text={doc.aiSummary || "No summary layout processed yet."} 
                  speed={15} 
                  style={styles.summaryText} 
                />
              </View>
              <Text style={styles.label}>Saved on</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={15} color="#9E9E9E" />
                <Text style={styles.dateText}>{new Date(doc.date).toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Text Tab */}
          {activeTab === "text" && (
            <View style={styles.section}>
              <Text style={styles.label}>Extracted Text</Text>
              <View style={styles.card}>
                <Text selectable style={styles.extractedText}>
                  {doc.extractedText || "No text extracted"}
                </Text>
              </View>
            </View>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <View style={styles.section}>
              <Text style={styles.label}>Ask about this document</Text>
              {chatHistory.length === 0 && (
                <View style={styles.suggestions}>
                  {[
                    "What is this document about?",
                    "What is the total amount?",
                    "When was this issued?",
                  ].map((q, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestion}
                      onPress={() => setChatInput(q)}
                    >
                      <Ionicons name="bulb-outline" size={14} color="#4C4C4C" style={{ marginRight: 6 }} />
                      <Text style={styles.suggestionText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {chatHistory.map((msg, i) => (
                <View
                  key={i}
                  style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}
                >
                  {msg.role === "user" ? (
                    <Text style={[styles.bubbleText, styles.userText]}>
                      {msg.text}
                    </Text>
                  ) : (
                    /* Uses dynamic rendering configuration across user inquiries */
                    <TypewriterText 
                      selectable 
                      text={msg.text} 
                      speed={10} 
                      style={styles.bubbleText} 
                    />
                  )}
                </View>
              ))}
              {chatLoading && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#4C4C4C" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {activeTab === "chat" && (
          <View style={styles.chatInputBar}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask anything about this document..."
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
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  titleWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 15, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4", flex: 1 },
  titleInput: {
    flex: 1, fontSize: 15, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4",
    borderBottomWidth: 1.5, borderColor: "#A3A3A3", paddingVertical: 2,
  },
  catBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(138,43,226,0.2)" },
  catText: { fontSize: 11, color: "#4C4C4C", fontFamily: 'Rajdhani_700Bold' },
  preview: { width: "100%", height: 200, backgroundColor: "rgba(0,0,0,0.5)" },
  tabs: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#A3A3A3" },
  tabText: { fontSize: 13, color: "#A3A3A3", fontFamily: 'Rajdhani_500Medium' },
  activeTabText: { color: "#A3A3A3", fontFamily: 'Rajdhani_700Bold' },
  content: { flex: 1 },
  section: { padding: 16 },
  rowHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  label: {
    fontSize: 11, color: "#A3A3A3", fontFamily: 'Rajdhani_700Bold',
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 4,
  },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  copyBtnText: { fontSize: 12, color: "#4C4C4C", fontFamily: 'Rajdhani_600SemiBold' },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", marginBottom: 16,
  },
  summaryText: { fontSize: 15,
    fontFamily: 'Rajdhani_500Medium', color: "#F4F4F4", lineHeight: 26 },
  extractedText: {
    fontSize: 14, color: "#E2E8F0", lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  suggestions: { gap: 8, marginBottom: 16 },
  suggestion: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)", padding: 13, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  suggestionText: { fontSize: 13,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3", flex: 1 },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: "82%" },
  userBubble: { backgroundColor: "#4C4C4C", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14,
    fontFamily: 'Rajdhani_500Medium', color: "#F4F4F4", lineHeight: 20 },
  userText: { color: "#F4F4F4",
    fontFamily: 'Rajdhani_500Medium', },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  typingText: { fontSize: 13,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  chatInputBar: {
    flexDirection: "row", alignItems: "flex-end",
    padding: 12, backgroundColor: "transparent", gap: 10,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.4)",
  },
  chatTextInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: "#F4F4F4", maxHeight: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#4C4C4C", alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "rgba(138,43,226,0.3)" },
});