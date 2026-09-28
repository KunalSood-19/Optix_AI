import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useRef } from "react";
import { 
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert
 } from 'react-native';
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

// Double-check this path matches your project structure exactly
import { identifyObject } from "../services/geminiService"; 

export default function ObjectDetectionScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("Point your lens at target to execute");
  const cameraRef = useRef(null);

  // 1. Handle Camera Permissions
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C4C4C" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>SmartLens AI requires camera access to scan items.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Handle Live Scan Capture and Vision Dispatch
  async function handleLiveVisionScan() {
    if (loading) return;

    if (!cameraRef.current) {
      Alert.alert("Camera Error", "Target hardware viewfinder context was not found.");
      return;
    }

    try {
      setLoading(true);
      setResult("Analyzing target scene...");

      // Capture frame layout from hardware layer as base64 string bytes
      const options = { quality: 0.4, base64: true };
      const photo = await cameraRef.current.takePictureAsync(options);

      if (!photo || !photo.base64) {
        throw new Error("Failed to process local frame buffer stream.");
      }

      // Live Groq Vision API Call
      const dynamicAIResponse = await identifyObject(photo.base64);
      setResult(dynamicAIResponse);

    } catch (err) {
      console.log("Vision App Layer Processing Exception:", err);
      setResult("Object Spotted: Target Processing Error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060B1A" />
      
      {/* Dynamic Result Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>OBJECTDETECTION RESULT</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#4C4C4C" style={styles.spinnerStyle} />
        ) : (
          <Text style={styles.cardText}>{result}</Text>
        )}
      </View>

      {/* Hardware Camera Surface Window Area */}
      <View style={styles.scanTargetArea}>
        {/* ✅ FIXED: CameraView is kept self-closing to prevent children warnings */}
        <CameraView style={styles.cameraFeed} ref={cameraRef} />
        
        {/* ✅ FIXED: Scanner Box overlay layered cleanly using absolute positioning */}
        <View style={styles.scannerBoxOverlay} pointerEvents="none">
          <View style={styles.scannerBox} />
        </View>
      </View>

      <Text style={styles.hintText}>
        Point your lens at target to execute:{"\n"}
        <Text style={{ fontFamily: 'Rajdhani_700Bold' }}>OBJECTDETECTION</Text>
      </Text>

      {/* Scan Button Element */}
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLiveVisionScan}
        disabled={loading}
      >
        <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>{loading ? "Analyzing..." : "Scan Again"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginTop: 20,
    minHeight: 110,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Rajdhani_700Bold',
    color: "#4C4C4C",
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    fontFamily: 'Rajdhani_500Medium',
    color: "#F4F4F4",
    lineHeight: 22,
  },
  spinnerStyle: {
    alignSelf: 'flex-start',
    marginTop: 8
  },
  scanTargetArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative", // Required to map absolute children elements properly
  },
  cameraFeed: {
    width: "100%",
    height: "100%",
  },
  scannerBoxOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scannerBox: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: "#A3A3A3",
    borderStyle: "dashed",
    borderRadius: 24,
  },
  hintText: {
    color: "#A3A3A3",
    textAlign: "center",
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    lineHeight: 20,
    marginBottom: 20,
  },
  errorText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontFamily: 'Rajdhani_500Medium',
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#A3A3A3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "#4C4C4C",
    flexDirection: "row",
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 36,
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
  },
  buttonDisabled: {
    backgroundColor: "rgba(77, 77, 77, 0.5)",
  },
  buttonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
  },
});