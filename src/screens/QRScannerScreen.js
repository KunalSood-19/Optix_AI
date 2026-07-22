import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

// --- Custom Typewriter Animation Component ---
function TypewriterText({ text, speed = 20, style }) {
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

  return <Text style={style}>{displayedText}</Text>;
}

// --- Dynamic Scanner Screen supporting Multi-Mode & Object ID ---
export default function QRScannerScreen({ route, navigation }) {
  // Read target operation parameters fallback seamlessly to default QR
  const mode = route?.params?.mode || "qr"; 
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={80} color="#D97757" />
        <Text style={styles.permissionText}>
          Camera permission is required to analyze items or code layouts.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle standard QR scans
  const handleQRScan = async (data) => {
    if (data.startsWith("http://") || data.startsWith("https://")) {
      try {
        const supported = await Linking.canOpenURL(data);
        if (supported) {
          await Linking.openURL(data);
        } else {
          Alert.alert("Invalid URL", "Unable to open this website.", [
            { text: "Scan Again", onPress: () => setScanned(false) },
          ]);
        }
      } catch {
        Alert.alert("Error", "Failed to open website.", [
          { text: "Scan Again", onPress: () => setScanned(false) },
        ]);
      }
    } else {
      Alert.alert("QR Code Content", data, [
        { text: "Scan Again", onPress: () => setScanned(false) },
      ]);
    }
  };

  // Mock processing function mimicking AI Pipeline workflows (Object Detection, Summaries)
  const processAICameraCapture = () => {
    if (scanned || processingAI) return;
    
    setScanned(true);
    setProcessingAI(true);
    setAiResponse("");

    // Simulate model request delays
    setTimeout(() => {
      setProcessingAI(false);
      if (mode === "objectDetection") {
        setAiResponse("Object Spotted: Premium Workspace Desk Setup (Monitor, Keyboard, Plant detected).");
      } else if (mode === "summary") {
        setAiResponse("Summary Output: Key items located highlight technical documentation frameworks.");
      } else {
        setAiResponse(`Processed request matching mode payload parameters: ${mode}`);
      }
    }, 1800);
  };

  const handleBarcodeScannedEvent = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    handleQRScan(data);
  };

  return (
    <View style={styles.container}>
      {/* Configure structural capture targeting barcode scanning variants exclusively */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={mode === "qr" ? { barcodeTypes: ["qr"] } : undefined}
        onBarcodeScanned={mode === "qr" && !scanned ? handleBarcodeScannedEvent : undefined}
      />

      {/* Overlay Frame Content Layouts */}
      <View style={styles.overlay}>
        <View style={[styles.scanBox, mode !== "qr" && styles.aiScanBox]} />

        {/* Dynamic Context Instructions */}
        <Text style={styles.scanText}>
          {mode === "qr" 
            ? "Align the QR code within the frame" 
            : `Point your lens at target to execute: ${mode.toUpperCase()}`}
        </Text>

        {/* Realtime AI Response Banner Component wrapper */}
        {(processingAI || aiResponse !== "") && (
          <View style={styles.aiResultOverlayCard}>
            {processingAI ? (
              <View style={styles.aiRowLoader}>
                <ActivityIndicator size="small" color="#D97757" />
                <Text style={styles.aiProcessingLabel}>AI computing matrix...</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.aiContextTag}>{mode.toUpperCase()} RESULT</Text>
                <TypewriterText text={aiResponse} speed={15} style={styles.aiTypewriterText} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Primary Capture Action Trigger for AI processing steps */}
      {mode !== "qr" && !scanned && (
        <TouchableOpacity style={styles.actionCaptureCircle} onPress={processAICameraCapture}>
          <View style={styles.actionCaptureInnerRing} />
        </TouchableOpacity>
      )}

      {/* Reset State Control elements */}
      {scanned && !processingAI && (
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => {
            setScanned(false);
            setAiResponse("");
          }}
        >
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.scanAgainText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#F8F9FA",
  },
  permissionText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 25,
  },
  permissionBtn: {
    backgroundColor: "#D97757",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#D97757",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  aiScanBox: {
    borderColor: "#673AB7", // Purple matching Object Identifier theme
    borderStyle: "dashed",
  },
  scanText: {
    color: "#fff",
    fontSize: 15,
    marginTop: 25,
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  actionCaptureCircle: {
    position: "absolute",
    bottom: 45,
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  actionCaptureInnerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  scanAgainBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D97757",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  aiResultOverlayCard: {
    backgroundColor: "rgba(26, 26, 46, 0.92)",
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  aiRowLoader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  aiProcessingLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  aiContextTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97757",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  aiTypewriterText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
});