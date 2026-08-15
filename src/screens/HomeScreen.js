import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";
import { Image } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const vaults = [
  {
    icon: "archive-outline",
    label: "Math Vault",
    desc: "Saved math problems",
    screen: "Study",
    nestedScreen: "MathHistory",
    color: "#4FC3F7",
    bg: "rgba(79, 195, 247, 0.15)",
  },
  {
    icon: "journal-outline",
    label: "Notes Vault",
    desc: "Saved handwritten notes",
    screen: "Study",
    nestedScreen: "HandwritingHistory",
    color: "#81C784",
    bg: "rgba(129, 199, 132, 0.15)",
  },
  {
    icon: "folder-outline",
    label: "PDF Vault",
    desc: "Store all documents",
    screen: "Vault",
    color: "#BA68C8",
    bg: "rgba(186, 104, 200, 0.15)",
  },
  {
    icon: "card-outline",
    label: "Business Cards",
    desc: "Saved business cards",
    screen: "Vault",
    color: "#FFB74D",
    bg: "rgba(255, 183, 77, 0.15)",
  },
  {
    icon: "time-outline",
    label: "Search History",
    desc: "All past searches",
    screen: "Study",
    nestedScreen: "StudyHistory",
    color: "#FF8A65",
    bg: "rgba(255, 138, 101, 0.15)",
  }
];

export default function HomeScreen({ navigation }) {
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#1c0c3a', '#080512', '#0e2b4d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("Scanner")}>
            <Image
              source={require("../../assets/optix-logo-Photoro.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
        <BlurView intensity={40} tint="dark" style={styles.heroBanner}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Scan anything,{"\n"}understand instantly</Text>
            <Text style={styles.heroSub}>Powered by Optix AI</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="scan-outline" size={52} color="#FFFFFF" opacity={0.25} />
          </View>
        </BlurView>

        {/* Scan Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Scanner")}
        >
          <BlurView intensity={40} tint="dark" style={styles.scanBtn}>
            <View style={styles.scanBtnInner}>
              <View style={styles.scanBtnIcon}>
                <Ionicons name="camera" size={20} color="#1A1A2E" />
              </View>
              <Text style={styles.scanBtnText}>Open Scanner</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" opacity={0.5} />
          </BlurView>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Vaults & History</Text>
        <View style={styles.grid}>
          {vaults.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={styles.cardContainer}
              activeOpacity={0.75}
              onPress={() => {
                if (f.label === "Business Card Vault") {
                  Alert.alert("Coming Soon", "Business Card Vault is coming in a future update!");
                  return;
                }
                if (f.nestedScreen) {
                  navigation.navigate(f.screen, { screen: f.nestedScreen });
                } else if (f.screen) {
                  navigation.navigate(f.screen);
                } else {
                  navigation.navigate("Scanner", { mode: f.mode });
                }
              }}
            >
              <BlurView intensity={40} tint="dark" style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: f.bg }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <Text style={styles.cardTitle}>{f.label}</Text>
                <Text style={styles.cardDesc}>{f.desc}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
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
    paddingTop: 48, // Added padding for translucent status bar
    paddingBottom: 16,
    backgroundColor: "transparent",
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
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 28,
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
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  scanBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scanBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* Section */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
    letterSpacing: -0.1,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  cardContainer: {
    width: "47%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  card: {
    padding: 18,
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)", // Extra darkness for Android where blur fails
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 16,
  },

  bottomSpacer: { height: 12 },
});