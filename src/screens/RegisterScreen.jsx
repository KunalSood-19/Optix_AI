import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPass.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPass) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Registration failed", error.message);
    } else {
      Alert.alert(
        "Account created!",
        "Check your email to verify your account, then sign in.",
        [{ text: "Go to Login", onPress: () => navigation.navigate("Login") }]
      );
    }
  }

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Too short", color: "#FF5252", width: "25%" };
    if (password.length < 8) return { label: "Weak", color: "#FF9800", width: "50%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Fair", color: "#FFD740", width: "70%" };
    return { label: "Strong", color: "#00E676", width: "100%" };
  };

  const strength = passwordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header Action Row */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={20} color="#F4F4F4" />
            </TouchableOpacity>
          </View>

          {/* Branding Logo Structure */}
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="scan-outline" size={32} color="#A3A3A3" />
            </View>
            <Text style={styles.logoText}>Optix</Text>
          </View>

          {/* Form Content Shell Card Layout */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSub}>Start scanning smarter today</Text>

            {/* Input Form Module: Full Name */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#64687A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Input Form Module: Email */}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#64687A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input Form Module: Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor="#64687A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#8D8FA5" />
              </TouchableOpacity>
            </View>

            {/* Password Verification Metrics Row Layout */}
            {strength && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {/* Input Form Module: Confirm Password */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirm Password</Text>
            <View style={[
              styles.inputWrap,
              confirmPass && password !== confirmPass && styles.inputWrapError,
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter password"
                placeholderTextColor="#64687A"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#8D8FA5" />
              </TouchableOpacity>
            </View>
            {confirmPass && password !== confirmPass && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}

            {/* Registration Execution Component Interface element */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled, { marginTop: 24 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#F4F4F4" />
                : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Navigation Redirection Layout Footer element */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#050505" 
  },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: 20, 
    paddingBottom: 32 
  },
  topRow: { 
    paddingTop: 16, 
    marginBottom: 8 
  },
  backBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)", 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", 
    justifyContent: "center",
  },
  logoBlock: { 
    alignItems: "center", 
    paddingVertical: 20 
  },
  logoCircle: {
    width: 72, 
    height: 72, 
    borderRadius: 22,
    backgroundColor: "rgba(163, 163, 163, 0.15)", 
    alignItems: "center",
    justifyContent: "center", 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 163, 163, 0.3)",
  },
  logoText: { 
    fontSize: 24, 
    fontFamily: 'Rajdhani_700Bold', 
    color: "#A3A3A3", 
    letterSpacing: -0.5 
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.12)", 
    borderRadius: 24,
    padding: 24, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.4)",
  },
  cardTitle: { 
    fontSize: 22, 
    fontFamily: 'Rajdhani_700Bold', 
    color: "#F4F4F4", 
    marginBottom: 4 
  },
  cardSub: { 
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium', 
    color: "#A3A3A3", 
    marginBottom: 24 
  },
  fieldLabel: {
    fontSize: 12, 
    fontFamily: 'Rajdhani_700Bold', 
    color: "#A3A3A3",
    letterSpacing: 0.5, 
    marginBottom: 8, 
    marginTop: 4,
    textTransform: "uppercase"
  },
  inputWrap: {
    flexDirection: "row", 
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)", 
    borderRadius: 14,
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 14, 
    marginBottom: 16, 
    height: 52,
  },
  inputWrapError: { 
    borderColor: "#A3A3A3", 
    backgroundColor: "rgba(255, 0, 127, 0.05)" 
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    fontSize: 15,
    fontFamily: 'Rajdhani_500Medium', 
    color: "#F4F4F4" 
  },
  eyeBtn: { 
    padding: 4 
  },
  strengthWrap: {
    flexDirection: "row", 
    alignItems: "center",
    gap: 10, 
    marginTop: -10, 
    marginBottom: 4,
  },
  strengthTrack: {
    flex: 1, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  strengthFill: { 
    height: 4, 
    borderRadius: 2 
  },
  strengthLabel: { 
    fontSize: 11, 
    fontFamily: 'Rajdhani_700Bold', 
    minWidth: 54, 
    textAlign: "right" 
  },
  errorText: { 
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium', 
    color: "#A3A3A3", 
    marginTop: -12, 
    marginBottom: 8,
    marginLeft: 4
  },
  primaryBtn: {
    backgroundColor: "#4C4C4C", 
    borderRadius: 14,
    height: 54, 
    alignItems: "center", 
    justifyContent: "center",
  },
  primaryBtnDisabled: { 
    backgroundColor: "rgba(77, 77, 77, 0.4)" 
  },
  primaryBtnText: { 
    color: "#F4F4F4", 
    fontSize: 16, 
    fontFamily: 'Rajdhani_700Bold' 
  },
  terms: { 
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium', 
    color: "#A3A3A3", 
    textAlign: "center", 
    marginTop: 18, 
    lineHeight: 18 
  },
  termsLink: { 
    color: "#4C4C4C", 
    fontFamily: 'Rajdhani_600SemiBold' 
  },
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 28 
  },
  footerText: { 
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium', 
    color: "#A3A3A3" 
  },
  footerLink: { 
    fontSize: 14, 
    color: "#4C4C4C", 
    fontFamily: 'Rajdhani_700Bold' 
  },
});