import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";
import { Image } from "react-native";

const features = [
 
  {
    icon: "qr-code-outline",
    label: "QR Scanner",
    desc: "Scan QR codes instantly",
    screen: "QRScanner",
    color: "#00C853",
    bg: "#E8F5E9",
  },
  {
    icon: "document-text-outline",
    label: "OCR Engine",
    desc: "Extract text from images",
    mode: "ocr",
    color: "#E91E8C",
    bg: "#FCE4F0",
  },
  {
    icon: "sparkles-outline",
    label: "AI Summarizer",
    desc: "Get key points instantly",
    mode: "summary",
    color: "#D97757",
    bg: "#EEF0FF",
  },
  {
    icon: "calculator-outline",
    label: "Math Solver",
    desc: "Step-by-step solutions",
    mode: "math",
    color: "#F44336",
    bg: "#FFEBEE",
  },
  {
    icon: "book-outline",
    label: "Notes Generator",
    desc: "Generate study notes",
    mode: "notes",
    color: "#009688",
    bg: "#E0F2F1",
  },
  {
    icon: "receipt-outline",
    label: "Receipt Reader",
    desc: "Extract amount & merchant",
    mode: "receipt",
    color: "#FF9800",
    bg: "#FFF3E0",
  },
  {
    icon: "card-outline",
    label: "Business Card",
    desc: "Save as contact directly",
    mode: "businessCard",
    color: "#2196F3",
    bg: "#E3F2FD",
  },
  {
    icon: "folder-outline",
    label: "PDF Vault",
    desc: "Store all your documents",
    screen: "Vault",
    color: "#7C4DFF",
    bg: "#EDE7F6",
  },
];export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  async function handleProfilePress() {
    Alert.alert(
      user?.email || "Profile",
      "What would you like to do?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  }

  return (
    
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
  <Image
    source={require("../../assets/optix-logo-Photoro.png")}
    style={styles.headerLogo}
    resizeMode="contain"
  />

  {/* <Text style={styles.tagline}>
    See · Scan · Understand
  </Text> */}
</View>
         <TouchableOpacity
  style={styles.avatarCircle}
  onPress={handleProfilePress}
>
  <Text style={styles.avatarText}>
    {user?.email?.charAt(0)?.toUpperCase() || "?"}
  </Text>
</TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Scan anything,{"\n"}understand instantly</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="scan-outline" size={52} color="#D97757" opacity={0.15} />
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.scanBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Scanner")}
        >
          <View style={styles.scanBtnInner}>
            <View style={styles.scanBtnIcon}>
              <Ionicons name="camera-outline" size={22} color="#D97757" />
            </View>
            <Text style={styles.scanBtnText}>Scan Now</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={20} color="#D97757" />
        </TouchableOpacity>

        {/* Features */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.grid}>
          {features.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => {
                if (f.screen) {
                  navigation.navigate(f.screen);
                } else {
                  navigation.navigate("Scanner", { mode: f.mode });
                }
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <Text style={styles.cardTitle}>{f.label}</Text>
              <Text style={styles.cardDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F9",
  },
  scrollContent: {
    paddingBottom: 24,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 27,
    paddingTop: 28,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
headerLogo: {
width: 200,
height: 50,
marginLeft: -75
},
  tagline: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  avatarCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#D97757",
  alignItems: "center",
  justifyContent: "center",
},
  avatarText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "700",
},

  /* Hero */
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 12,
    color: "#D97757",
    marginTop: 6,
    fontWeight: "500",
  },
  heroIconWrap: {
    marginLeft: 12,
  },

  /* Scan Button */
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF0FF",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8D6FF",
  },
  scanBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scanBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#D97757",
  },

  /* Section */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: -0.1,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  card: {
    width: "46.5%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: "#9E9E9E",
    lineHeight: 16,
  },

  bottomSpacer: { height: 12 },
});