import { useState } from "react";
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
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { chatWithDocument } from "../services/geminiService";
import { updateDocumentTitle } from "../services/storageService";

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1A1A2E" />
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
                    color={summaryCopied ? "#00C853" : "#6C63FF"}
                  />
                  <Text style={[styles.copyBtnText, summaryCopied && { color: "#00C853" }]}>
                    {summaryCopied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <Text selectable style={styles.summaryText}>{doc.aiSummary}</Text>
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
                      <Ionicons name="bulb-outline" size={14} color="#6C63FF" style={{ marginRight: 6 }} />
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
                  <Text style={[styles.bubbleText, msg.role === "user" && styles.userText]}>
                    {msg.text}
                  </Text>
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
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#EBEBEB",
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F4F5F9", alignItems: "center", justifyContent: "center",
  },
  titleWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", flex: 1 },
  titleInput: {
    flex: 1, fontSize: 15, fontWeight: "700", color: "#1A1A2E",
    borderBottomWidth: 1.5, borderColor: "#6C63FF", paddingVertical: 2,
  },
  catBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#EEF0FF" },
  catText: { fontSize: 11, color: "#6C63FF", fontWeight: "700" },
  preview: { width: "100%", height: 200, backgroundColor: "#EBEBEB" },
  tabs: {
    flexDirection: "row", backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderColor: "#EBEBEB",
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderColor: "#6C63FF" },
  tabText: { fontSize: 13, color: "#9E9E9E", fontWeight: "500" },
  activeTabText: { color: "#6C63FF", fontWeight: "700" },
  content: { flex: 1 },
  section: { padding: 16 },
  rowHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  label: {
    fontSize: 11, color: "#9E9E9E", fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 4,
  },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#EEF0FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  copyBtnText: { fontSize: 12, color: "#6C63FF", fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#EBEBEB", marginBottom: 16,
  },
  summaryText: { fontSize: 15, color: "#1A1A2E", lineHeight: 26 },
  extractedText: {
    fontSize: 14, color: "#444", lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, color: "#9E9E9E" },
  suggestions: { gap: 8, marginBottom: 16 },
  suggestion: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", padding: 13, borderRadius: 12,
    borderWidth: 1, borderColor: "#EBEBEB",
  },
  suggestionText: { fontSize: 13, color: "#6C63FF", flex: 1 },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 8, maxWidth: "82%" },
  userBubble: { backgroundColor: "#6C63FF", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: "#FFFFFF", alignSelf: "flex-start",
    borderWidth: 1, borderColor: "#EBEBEB", borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  typingText: { fontSize: 13, color: "#9E9E9E" },
  chatInputBar: {
    flexDirection: "row", alignItems: "flex-end",
    padding: 12, backgroundColor: "#FFFFFF", gap: 10,
    borderTopWidth: 1, borderColor: "#EBEBEB",
  },
  chatTextInput: {
    flex: 1, backgroundColor: "#F4F5F9", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: "#1A1A2E", maxHeight: 100, borderWidth: 1, borderColor: "#EBEBEB",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#C5C3F5" },
});