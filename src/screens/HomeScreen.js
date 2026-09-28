import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const vaults = [
  {
    icon: "archive-outline",
    label: "Math Vault",
    desc: "Saved math problems",
    screen: "Study",
    nestedScreen: "MathHistory",
  },
  {
    icon: "journal-outline",
    label: "Notes Vault",
    desc: "Saved handwritten notes",
    screen: "Study",
    nestedScreen: "HandwritingHistory",
  },
  {
    icon: "folder-outline",
    label: "PDF Vault",
    desc: "Store all documents",
    screen: "Vault",
  },
  {
    icon: "card-outline",
    label: "Business Cards",
    desc: "Saved business cards",
    screen: "Vault",
  },
  {
    icon: "time-outline",
    label: "Search History",
    desc: "All past searches",
    screen: "Study",
    nestedScreen: "StudyHistory",
  }
];

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function handleProfilePress() {
    Alert.alert(
      user?.email || "Profile",
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
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
      
      {/* Background Glow */}
      <View style={styles.glowCircle} />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.heroTitle}>You're on a wave{"\n"}of productivity!</Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle} onPress={handleProfilePress}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0)?.toUpperCase() || "K"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.searchContainer}
            onPress={() => navigation.navigate("Assistant")}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Ask Optix Assistant..."
              placeholderTextColor="#A3A3A3"
              editable={false}
              pointerEvents="none"
            />
            <View style={styles.micButton}>
              <Ionicons name="mic" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionPill} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Scanner", { mode: "document" })}
            >
              <Ionicons name="scan-outline" size={16} color="#FFF" />
              <Text style={styles.actionPillText}>Scan Document</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionPill} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate("Scanner", { mode: "qr" })}
            >
              <Ionicons name="qr-code-outline" size={16} color="#FFF" />
              <Text style={styles.actionPillText}>QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* Activity Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <Ionicons name="chevron-forward" size={18} color="#A3A3A3" />
          </View>

          {/* Grid Vaults */}
          <View style={styles.grid}>
            {vaults.map((f, i) => (
              <TouchableOpacity
                key={i}
                style={styles.cardContainer}
                activeOpacity={0.75}
                onPress={() => {
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
                  <View style={styles.iconBox}>
                    <Ionicons name={f.icon} size={22} color="#FFF" />
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
    backgroundColor: "#050505",
  },
  glowCircle: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: "#F4F4F4",
    lineHeight: 32,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Rajdhani_500Medium',
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  actionPillText: {
    color: '#F4F4F4',
    fontSize: 13,
    fontFamily: 'Rajdhani_600SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Rajdhani_700Bold',
    color: "#F4F4F4",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: "48%",
    marginBottom: 14,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    height: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Rajdhani_700Bold',
    color: "#F4F4F4",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "#A3A3A3",
    fontFamily: 'Rajdhani_500Medium',
    lineHeight: 16,
  },
  bottomSpacer: { height: 40 },
});