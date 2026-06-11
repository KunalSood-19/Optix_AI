import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={80} color="#D97757" />

        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes
        </Text>

        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async ({ data }) => {
    if (scanned) return;

    setScanned(true);

    // Check if QR contains a website URL
    if (
      data.startsWith("http://") ||
      data.startsWith("https://")
    ) {
      try {
        const supported = await Linking.canOpenURL(data);

        if (supported) {
          await Linking.openURL(data);
        } else {
          Alert.alert(
            "Invalid URL",
            "Unable to open this website.",
            [
              {
                text: "Scan Again",
                onPress: () => setScanned(false),
              },
            ]
          );
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to open website.",
          [
            {
              text: "Scan Again",
              onPress: () => setScanned(false),
            },
          ]
        );
      }
    } else {
      Alert.alert(
        "QR Code Content",
        data,
        [
          {
            text: "Scan Again",
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <View style={styles.overlay}>
        <View style={styles.scanBox} />

        <Text style={styles.scanText}>
          Align the QR code within the frame
        </Text>
      </View>

      {scanned && (
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => setScanned(false)}
        >
          <Ionicons
            name="refresh"
            size={22}
            color="#fff"
          />

          <Text style={styles.scanAgainText}>
            Scan Again
          </Text>
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

  scanText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  scanAgainBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D97757",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },

  scanAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});