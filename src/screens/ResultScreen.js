import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, Modal, Linking
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from 'expo-linear-gradient';
import {
  summarizeText, chatWithDocument, extractReceiptData,
  extractBusinessCardData, solveMath, generateNotes, identifyObject, translateText
} from "../services/geminiService";
import { saveDocument } from "../services/storageService";
import * as Clipboard from "expo-clipboard";
import Markdown from "react-native-markdown-display";
import { generateAndSharePDF } from "../services/pdfService";
import * as Contacts from 'expo-contacts';

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
    return (
      <Markdown style={markdownStyles}>
        {displayedText}
      </Markdown>
    );
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
  const [businessCardData, setBusinessCardData] = useState(null);
  const [objectData, setObjectData] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [summaryConfidence, setSummaryConfidence] = useState("HIGH");
  const [isRateLimited, setIsRateLimited] = useState(false);

  const tabs =
    mode === "math" ? ["summary", "text", "chat"]
    : mode === "notes" ? ["summary", "text"]
    : mode === "objectDetection" ? ["summary", "chat"]
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
    setIsRateLimited(false);
    try {
      let rawText = "";
      if (mode === "ocr") {
        rawText = extractedText || "No text detected";
      } else if (mode === "summary") {
        rawText = await summarizeText(extractedText);
      } else if (mode === "receipt") {
        const data = await extractReceiptData(extractedText);
        setReceiptData(data);
        rawText = data
          ? `🏪 Merchant: ${data.merchant}\n\n📅 Date: ${data.date}\n\n💰 Total: ${data.total}\n\n📂 Category: ${data.category}`
          : "Unable to extract receipt details.";
      } else if (mode === "businessCard") {
        const data = await extractBusinessCardData(extractedText);
        setBusinessCardData(data);
        rawText = data 
          ? `Name: ${data.name || ""}\nCompany: ${data.company || ""}\nPhone: ${data.phone || ""}\nEmail: ${data.email || ""}` 
          : "Unable to extract business card details.";
      } else if (mode === "math") {
        const cleaned = extractedText?.replace(/\?/g, "²").replace(/™/g, "7").replace(/x\?/g, "x²");
        rawText = await solveMath(cleaned);
      } else if (mode === "notes") {
        rawText = await generateNotes(extractedText);
      } else if (mode === "objectDetection") {
        const objData = await identifyObject(base64);
        setObjectData(objData);
        setSummaryConfidence(objData.confidence?.toUpperCase() || "LOW");
        rawText = `**${objData.identifiedObject}**\n\n${objData.description}`; // For Ask Optix context
        setAiSummary(rawText);
        setLoading(false);
        return;
      } else {
        rawText = await summarizeText(extractedText);
      }

      if (mode !== "objectDetection") {
        const confMatch = rawText?.match(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/i);
        if (confMatch) {
          setSummaryConfidence(confMatch[1].toUpperCase());
          rawText = rawText.replace(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/gi, "").trim();
        } else {
          setSummaryConfidence("HIGH");
        }
        setAiSummary(rawText);
      }
    } catch (e) { 
      console.log("ERROR:", e); 
      if (e.message && e.message.includes("RATE_LIMIT")) {
        setIsRateLimited(true);
      }
      setAiSummary(mode === "objectDetection" ? "Object identification failed." : "Analysis failed.");
    }
    setLoading(false);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", text: question }]);
    setChatLoading(true);
    try {
      let answer = "";
      if (mode === "math") {
        answer = await solveMath(question);
      } else if (mode === "objectDetection") {
        const context = objectData ? JSON.stringify(objectData, null, 2) : aiSummary;
        answer = await chatWithDocument(context, question);
      } else {
        answer = await chatWithDocument(extractedText, question);
      }
        
      let confidence = "HIGH";
      const confMatch = answer?.match(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/i);
      if (confMatch) {
        confidence = confMatch[1].toUpperCase();
        answer = answer.replace(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/gi, "").trim();
      }

      setChatHistory((h) => [...h, { role: "ai", text: answer, confidence }]);
    } catch (error) {
      setChatHistory((h) => [...h, { role: "ai", text: `Error: ${error.message}`, confidence: "LOW" }]);
    }
    setChatLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const category = receiptData ? "Receipt" : (mode === "objectDetection" ? "Object" : "General");
      const savedText = mode === "objectDetection" ? (objectData ? JSON.stringify(objectData) : aiSummary) : extractedText;
      await saveDocument(imageUri, savedText, aiSummary, category);
      Alert.alert("Saved!", "Document saved to Vault", [
        { text: "Go to Vault", onPress: () => navigation.navigate("Vault") },
        { text: "OK" },
      ]);
    } catch {
      Alert.alert("Error", "Could not save document");
    }
    setSaving(false);
  }

  async function handleAddToContacts() {
    if (!businessCardData) return;
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const contact = {
          [Contacts.Fields.FirstName]: businessCardData.name || "Unknown",
          [Contacts.Fields.Company]: businessCardData.company || "",
          [Contacts.Fields.JobTitle]: businessCardData.designation || "",
          [Contacts.Fields.Emails]: businessCardData.email ? [{ email: businessCardData.email, isPrimary: true, label: "work" }] : [],
          [Contacts.Fields.PhoneNumbers]: businessCardData.phone ? [{ number: businessCardData.phone, isPrimary: true, label: "work" }] : [],
          [Contacts.Fields.Addresses]: businessCardData.address ? [{ street: businessCardData.address, label: "work" }] : [],
          [Contacts.Fields.UrlAddresses]: businessCardData.website ? [{ url: businessCardData.website, label: "work" }] : [],
        };
        const contactId = await Contacts.addContactAsync(contact);
        if (contactId) {
          Alert.alert("Success", "Contact saved successfully!");
        } else {
          Alert.alert("Error", "Could not save contact.");
        }
      } else {
        Alert.alert("Permission Denied", "We need contacts permission to save this.");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong saving the contact.");
    }
  }

  const modeLabel = {
    ocr: "Extracted Text", summary: "Summary", receipt: "Receipt",
    businessCard: "Contact Card", math: "Math Solver", notes: "Notes",
  }[mode] || "Scan Result";

  const handleGoogleSearch = () => {
    let query = extractedText;
    if (mode === "objectDetection" && objectData) {
      query = objectData.identifiedObject;
    }
    if (!query || query.trim() === "") return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query.substring(0, 150))}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const translation = await translateText(extractedText);
      setAiSummary(translation);
    } catch (e) {
      Alert.alert("Error", "Could not translate text");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <BlurView intensity={30} tint="dark" style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{modeLabel}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="bookmark-outline" size={20} color="#FFF" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => generateAndSharePDF(imageUri, extractedText, aiSummary)}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Preview */}
        <View style={{ position: "relative" }}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.viewOriginalBtn} onPress={() => setShowOriginal(true)}>
            <Ionicons name="expand-outline" size={16} color="#FFF" />
            <Text style={styles.viewOriginalText}>Expand</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* AI Result Section */}
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
              ) : isRateLimited ? (
                <View style={styles.loadingBox}>
                  <Ionicons name="cloud-offline-outline" size={56} color="#F44336" />
                  <Text style={[styles.loadingTitle, {marginTop: 16}]}>Service Busy</Text>
                  <Text style={styles.loadingSubtitle}>Object identification is temporarily busy due to high traffic. Please try again.</Text>
                  <TouchableOpacity style={[styles.actionBtn, {marginTop: 20, width: 120, height: 45, backgroundColor: "#6C63FF"}]} onPress={generateSummary}>
                    <Text style={{color: "#FFF", fontWeight: "700"}}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : mode === "objectDetection" && objectData ? (
                <LinearGradient
                  colors={['rgba(108, 99, 255, 0.2)', 'rgba(6, 11, 26, 0.8)']}
                  style={styles.cardGradientWrapper}
                >
                  <BlurView intensity={30} tint="dark" style={styles.objectCard}>
                  <View style={styles.objectHeader}>
                    <View style={styles.objectIconWrap}>
                      <Ionicons name="cube-outline" size={24} color="#6C63FF" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.objectTitle}>{objectData.identifiedObject}</Text>
                      <View style={styles.objectBadges}>
                        <Text style={styles.objectCategory}>{objectData.category}</Text>
                        <View style={[styles.confidenceBadge, 
                          objectData.confidence === 'HIGH' ? {backgroundColor: '#E8F5E9', borderColor: '#4CAF50'} : 
                          objectData.confidence === 'MEDIUM' ? {backgroundColor: '#FFF3E0', borderColor: '#FF9800'} : 
                          {backgroundColor: '#FFEBEE', borderColor: '#F44336'}]}>
                          <Text style={[styles.confidenceText, 
                            objectData.confidence === 'HIGH' ? {color: '#2E7D32'} : 
                            objectData.confidence === 'MEDIUM' ? {color: '#E65100'} : 
                            {color: '#C62828'}]}>{objectData.confidence} CONFIDENCE</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {objectData.confidence !== "HIGH" && (
                    <View style={styles.warningBanner}>
                      <Ionicons name="warning-outline" size={14} color="#FF9800" />
                      <Text style={styles.warningText}>Identification may be uncertain.</Text>
                    </View>
                  )}

                  <Text style={styles.objectDescLabel}>Description</Text>
                  <Markdown style={markdownStyles}>{objectData.description}</Markdown>

                  {objectData.visibleCharacteristics?.length > 0 && (
                    <>
                      <Text style={styles.objectDescLabel}>Visible Characteristics</Text>
                      <View style={styles.bulletList}>
                        {objectData.visibleCharacteristics.map((char, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <View style={styles.bulletPoint} />
                            <View style={{flex: 1, marginTop: -4}}><Markdown style={markdownStyles}>{char}</Markdown></View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {objectData.alternativePossibilities?.length > 0 && (
                    <>
                      <Text style={styles.objectDescLabel}>Alternative Possibilities</Text>
                      <View style={styles.bulletList}>
                        {objectData.alternativePossibilities.map((alt, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <View style={styles.bulletPoint} />
                            <View style={{flex: 1, marginTop: -4}}><Markdown style={markdownStyles}>{alt}</Markdown></View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                </BlurView>
                <TouchableOpacity style={styles.googleSearchBtnFull} onPress={handleGoogleSearch}>
                  <Ionicons name="logo-google" size={18} color="#FFF" />
                  <Text style={styles.googleSearchBtnText}>Search on Google</Text>
                </TouchableOpacity>
              </LinearGradient>
              ) : (
                <>
                  <View style={styles.rowHeader}>
                    <Text style={styles.label}>{mode === "ocr" ? "Extracted Text" : "Optix Analysis"}</Text>
                    <View style={{flexDirection: 'row', gap: 10}}>
                      {mode === "ocr" && (
                        <TouchableOpacity style={styles.copyBtn} onPress={handleTranslate}>
                          <Ionicons name="language" size={15} color="#D97757" />
                          <Text style={[styles.copyBtnText, { color: "#D97757" }]}>Translate</Text>
                        </TouchableOpacity>
                      )}
                      {mode !== "ocr" && (
                        <TouchableOpacity style={styles.copyBtn} onPress={handleGoogleSearch}>
                          <Ionicons name="logo-google" size={15} color="#D97757" />
                          <Text style={[styles.copyBtnText, { color: "#D97757" }]}>Search</Text>
                        </TouchableOpacity>
                      )}
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
                  </View>
                  <LinearGradient
                    colors={['rgba(108, 99, 255, 0.15)', 'rgba(6, 11, 26, 0.8)']}
                    style={styles.cardGradientWrapper}
                  >
                    <BlurView intensity={30} tint="dark" style={styles.card}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {summaryConfidence !== "HIGH" && (
                        <View style={styles.warningBanner}>
                          <Ionicons name="warning-outline" size={14} color="#FF9800" />
                          <Text style={styles.warningText}>
                            Low confidence result.
                          </Text>
                        </View>
                      )}
                      
                      {/* Hide redundant summary if we are already showing custom UI for these modes */}
                      {receiptData || businessCardData ? (
                         <Text style={[styles.summaryText, {color: "#888", fontStyle: "italic", textAlign: "center", paddingVertical: 20}]}>
                           Details have been extracted below.
                         </Text>
                      ) : (
                        <TypewriterText 
                          text={aiSummary} 
                          speed={10} 
                          style={styles.summaryText} 
                          isMarkdown={true}
                        />
                      )}
                      
                    </ScrollView>
                    </BlurView>
                  </LinearGradient>

                  {mode === "summary" && (
                    <TouchableOpacity 
                      style={[styles.primaryActionBtn, { marginTop: 15 }]} 
                      onPress={() => generateAndSharePDF(extractedText, aiSummary, modeLabel)}
                    >
                      <Ionicons name="document-text" size={18} color="#FFF" />
                      <Text style={styles.primaryActionText}>Generate PDF Report</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

          {/* Receipt Details (if applicable) */}
          {receiptData && (
            <View style={styles.section}>
              <LinearGradient colors={['rgba(108, 99, 255, 0.15)', 'rgba(6, 11, 26, 0.8)']} style={styles.cardGradientWrapper}>
              <BlurView intensity={20} tint="dark" style={styles.card}>
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
                  : <Text style={styles.noItems}>No line items</Text>}
                <View style={styles.receiptDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{receiptData.total || "N/A"}</Text>
                </View>
              </BlurView>
              </LinearGradient>
            </View>
          )}

          {/* Business Card Details */}
          {businessCardData && (
            <View style={styles.section}>
              <LinearGradient colors={['rgba(108, 99, 255, 0.25)', 'rgba(6, 11, 26, 0.9)']} style={styles.cardGradientWrapper}>
                <BlurView intensity={30} tint="dark" style={styles.card}>
                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <View style={styles.avatarWrap}>
                      <Ionicons name="person" size={40} color="#6C63FF" />
                    </View>
                    <Text style={styles.contactName}>{businessCardData.name || "Unknown Name"}</Text>
                    <Text style={styles.contactCompany}>{businessCardData.designation ? `${businessCardData.designation} at ` : ""}{businessCardData.company || "Unknown Company"}</Text>
                  </View>
                  
                  <View style={styles.contactRow}>
                    <Ionicons name="call" size={18} color="#A0AEC0" />
                    <Text style={styles.contactText}>{businessCardData.phone || "No Phone"}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail" size={18} color="#A0AEC0" />
                    <Text style={styles.contactText}>{businessCardData.email || "No Email"}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="location" size={18} color="#A0AEC0" />
                    <Text style={styles.contactText}>{businessCardData.address || "No Address"}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="globe" size={18} color="#A0AEC0" />
                    <Text style={styles.contactText}>{businessCardData.website || "No Website"}</Text>
                  </View>

                  <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAddToContacts}>
                    <Ionicons name="person-add" size={18} color="#FFF" />
                    <Text style={styles.primaryActionText}>Add to Contacts</Text>
                  </TouchableOpacity>
                </BlurView>
              </LinearGradient>
            </View>
          )}

          {/* Chat Section */}
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <Text style={styles.label}>Ask Optix</Text>
            </View>
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
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble, { marginBottom: msg.confidence && msg.confidence !== "HIGH" ? 4 : 0 }]}>
                    {msg.role === "user" ? (
                      <Text style={[styles.bubbleText, styles.userText]}>{msg.text}</Text>
                    ) : (
                      /* Uses standard character animation loop layout logic */
                      <TypewriterText 
                        text={msg.text} 
                        speed={12} 
                        style={styles.bubbleText} 
                        isMarkdown={true}
                      />
                    )}
                  </View>
                  {msg.role === "ai" && msg.confidence && msg.confidence !== "HIGH" && (
                    <Text style={styles.chatWarningText}>⚠️ Low confidence</Text>
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
          
          {/* Ask Optix Chat Input inside ScrollView */}
          <View style={styles.inlineChatWrapper}>
            <BlurView intensity={50} tint="dark" style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Ask Optix anything..."
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
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </TouchableOpacity>
            </BlurView>
          </View>

        </ScrollView>
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

        {/* Global Agent FAB is removed since we have inline chat now */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    paddingVertical: 15, gap: 12, overflow: 'hidden',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerActions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  preview: { width: "100%", height: 220, backgroundColor: "#111" },
  viewOriginalBtn: {
    position: "absolute", right: 14, bottom: 14, backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", gap: 5,
  },
  viewOriginalText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  content: { flexGrow: 1, paddingBottom: 40 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "800", color: "#FFF", letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8 },
  copyBtnText: { fontSize: 13, fontWeight: "600", color: "#6C63FF", fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  cardGradientWrapper: { borderRadius: 24, padding: 1, marginBottom: 20 },
  card: { padding: 24, borderRadius: 24, overflow: 'hidden' },
  summaryText: { fontSize: 16, color: "#E2E8F0", lineHeight: 28 },
  loadingBox: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  loadingTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  loadingSubtitle: { fontSize: 13, color: "#888", marginTop: 4, textAlign: "center" },
  suggestions: { gap: 10, marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap' },
  suggestion: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
  },
  suggestionText: { fontSize: 13, color: "#FFF" },
  bubble: { padding: 14, borderRadius: 20, marginBottom: 8, maxWidth: "85%" },
  userBubble: { backgroundColor: "#6C63FF", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: "#FFF", lineHeight: 24, fontFamily: 'Inter_400Regular' },
  userText: { color: "#FFFFFF" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  typingText: { fontSize: 13, color: "#888", fontFamily: 'Inter_400Regular' },
  inlineChatWrapper: {
    paddingHorizontal: 20,
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
    paddingVertical: 12, fontSize: 16, color: "#FFFFFF", maxHeight: 100,
    fontFamily: 'Inter_500Medium',
    fontWeight: '600', letterSpacing: 0.5,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: "rgba(255,255,255,0.2)" },
  receiptCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  receiptHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  receiptIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  receiptMerchant: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  receiptDate: { fontSize: 12, color: "#888", marginTop: 2 },
  categoryBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  categoryBadgeText: { fontSize: 11, color: "#FFF", fontWeight: "600" },
  receiptDivider: { borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginVertical: 15 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  receiptItemName: { fontSize: 15, color: "#CCC", flex: 1, fontFamily: 'Inter_400Regular' },
  receiptItemPrice: { fontSize: 15, color: "#FFF", fontWeight: "500", fontFamily: 'Inter_400Regular' },
  noItems: { fontSize: 14, color: "#888", textAlign: "center", paddingVertical: 8, fontFamily: 'Inter_400Regular' },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#888", letterSpacing: 1, textTransform: "uppercase" },
  totalAmount: { fontSize: 22, fontWeight: "700", color: "#FFF", fontFamily: 'Inter_400Regular' },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", justifyContent: "center" },
  fullImage: { width: "100%", height: "90%" },
  closeBtn: { position: "absolute", top: 52, right: 20, zIndex: 999 },
  closeBtnInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  warningBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 152, 0, 0.15)", padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
  warningText: { color: "#FF9800", fontSize: 13, fontWeight: "600", flex: 1 },
  chatWarningText: { color: "#FF9800", fontSize: 11, marginLeft: 8, marginTop: -4, marginBottom: 8 },
  
  googleSearchBtnFull: { flexDirection: "row", backgroundColor: "rgba(217, 119, 87, 0.9)", margin: 15, marginTop: 0, padding: 14, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 },
  googleSearchBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700", fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },

  // Business Card specific styles
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(108, 99, 255, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 15, borderWidth: 1, borderColor: "rgba(108, 99, 255, 0.3)" },
  contactName: { fontSize: 24, fontWeight: "800", color: "#FFF", marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  contactCompany: { fontSize: 14, color: "#CCC", fontWeight: "600", fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  contactText: { fontSize: 15, color: "#E2E8F0", flex: 1, fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  primaryActionBtn: { flexDirection: "row", backgroundColor: "#6C63FF", marginTop: 25, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 },
  primaryActionText: { color: "#FFF", fontSize: 16, fontWeight: "700", fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'sans-serif' },
  objectCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  objectHeader: { flexDirection: "row", gap: 15, marginBottom: 20, alignItems: "center" },
  objectIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  objectTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  objectBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  objectCategory: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, fontSize: 12, color: "#CCC", fontWeight: "600", overflow: 'hidden' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: "rgba(76, 175, 80, 0.15)", borderColor: "rgba(76, 175, 80, 0.3)" },
  confidenceText: { fontSize: 10, fontWeight: "800", color: "#4CAF50" },
  objectDescLabel: { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  bulletList: { marginTop: 6, gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6C63FF", marginTop: 8 },
  globalAgentFab: {
    position: "absolute",
    right: 20,
    bottom: 20, // Adjust depending on chat bar
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D97757",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100
  }
});
