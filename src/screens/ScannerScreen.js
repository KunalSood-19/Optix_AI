import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { extractTextFromImage } from "../services/ocrService";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";

export default function ScannerScreen({ navigation, route }) {
  const mode = route?.params?.mode || "document";

  async function openCamera() {
    try {
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.3,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        const compressed = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }],
          {
            compress: 0.4,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const extractedText = await extractTextFromImage(compressed.uri);

        navigation.navigate("Result", {
          imageUri: compressed.uri,
          base64: result.assets[0].base64,
          extractedText,
          mode,
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to process image");
    }
  }

  async function pickFromGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.3,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        const compressed = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }],
          {
            compress: 0.4,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const extractedText = await extractTextFromImage(compressed.uri);

        navigation.navigate("Result", {
          imageUri: compressed.uri,
          base64: result.assets[0].base64,
          extractedText,
          mode,
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to process image");
    }
  }

  return (
    <LinearGradient
      colors={["#2B2457", "#060B1A", "#060B1A", "#342C70"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {mode === "document" ? (
        <Image
          source={require("../../assets/optix-logo-Photoroom.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.title}>
          {mode === "ocr" && "OCR Engine"}
          {mode === "summary" && "AI Summarizer"}
          {mode === "receipt" && "Receipt Reader"}
          {mode === "businessCard" && "Business Card Scanner"}
          {mode === "math" && "Math Solver"}
          {mode === "notes" && "Notes Generator"}
        </Text>
      )}
      
      <Text style={styles.subtitle}>
        {mode === "ocr" && "Extract text from any image"}
        {mode === "summary" && "Generate AI powered summaries"}
        {mode === "receipt" && "Extract receipt details instantly"}
        {mode === "businessCard" && "Save business cards as contacts"}
        {mode === "math" && "Solve maths problems step by step"}
        {mode === "notes" && "Generate study notes automatically"}
        {mode === "document" && "Scan any document with AI"}
      </Text>

      {/* Camera Operation Trigger */}
      <TouchableOpacity style={styles.btn} onPress={openCamera}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.btnText}>Open Camera</Text>
      </TouchableOpacity>

      {/* Gallery Picker Tool Element */}
      <TouchableOpacity style={styles.btnOutline} onPress={pickFromGallery}>
        <Ionicons name="images" size={24} color="#D97757" />
        <Text style={styles.btnOutlineText}>Pick from Gallery</Text>
      </TouchableOpacity>

      {/* QR & Live-View Intelligent Tracking Interface Trigger */}
      <TouchableOpacity
        style={styles.btnOutline}
        onPress={() => navigation.navigate("QRScanner", { mode })}
      >
        <Ionicons name="qr-code" size={24} color="#D97757" />
        <Text style={styles.btnOutlineText}>
          {mode === "qr" ? "Scan QR Code" : "Live Camera Mode"}
        </Text>
      </TouchableOpacity>

      {/* Floating System Navigation Interfaces */}
      <View style={styles.floatingContainer}>
        {/* Assistant Agent Panel Interface element */}
        <TouchableOpacity
          style={styles.agentFab}
          onPress={() => navigation.navigate("Agent")}
        >
          <Ionicons name="search" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Global Dashboard Return element */}
        <TouchableOpacity
          style={styles.homeFab}
          onPress={() => navigation.navigate("HomeDashboard")}
        >
          <Ionicons name="home" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: "#9AA4BF",
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#D97757",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "#D97757",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
  },
  btnOutlineText: {
    color: "#D97757",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingContainer: {
    position: "absolute",
    right: 20,
    bottom: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 250,
    height: 140,
    marginTop: 16,
  },
  agentFab: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#D97757",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  homeFab: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#D97757",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});