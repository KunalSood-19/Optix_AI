import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from "react-native";
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
    if (password.length < 6) return { label: "Too short", color: "#F44336", width: "25%" };
    if (password.length < 8) return { label: "Weak", color: "#FF9800", width: "50%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Fair", color: "#FFC107", width: "70%" };
    return { label: "Strong", color: "#00C853", width: "100%" };
  };

  const strength = passwordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={20} color="#1A1A2E" />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="scan-outline" size={32} color="#D97757" />
            </View>
            <Text style={styles.logoText}>Optix</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create account</Text>
            <Text style={styles.cardSub}>Start scanning smarter today</Text>

            {/* Full Name */}
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#BDBDBD"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#BDBDBD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor="#BDBDBD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#9E9E9E" />
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            {strength && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {/* Confirm Password */}
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirm Password</Text>
            <View style={[
              styles.inputWrap,
              confirmPass && password !== confirmPass && styles.inputError,
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Re-enter password"
                placeholderTextColor="#BDBDBD"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
            {confirmPass && password !== confirmPass && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled, { marginTop: 24 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
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
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },

  topRow: { paddingTop: 16, marginBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EBEBEB",
    alignItems: "center", justifyContent: "center",
  },

  logoBlock: { alignItems: "center", paddingVertical: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "#EEF0FF", alignItems: "center",
    justifyContent: "center", marginBottom: 12,
  },
  logoText: { fontSize: 22, fontWeight: "700", color: "#D97757", letterSpacing: -0.3 },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: "#EBEBEB",
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#9E9E9E", marginBottom: 24 },

  fieldLabel: {
    fontSize: 12, fontWeight: "700", color: "#555",
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F4F5F9", borderRadius: 12,
    borderWidth: 1, borderColor: "#EBEBEB",
    paddingHorizontal: 14, marginBottom: 16, height: 50,
  },
  inputError: { borderColor: "#F44336", backgroundColor: "#FFF5F5" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: "#1A1A2E" },
  eyeBtn: { padding: 4 },

  strengthWrap: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginTop: -10, marginBottom: 4,
  },
  strengthTrack: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: "#EBEBEB",
  },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "700", minWidth: 48 },

  errorText: { fontSize: 12, color: "#F44336", marginTop: -12, marginBottom: 8 },

  primaryBtn: {
    backgroundColor: "#D97757", borderRadius: 14,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  primaryBtnDisabled: { backgroundColor: "#C5C3F5" },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  terms: { fontSize: 11, color: "#9E9E9E", textAlign: "center", marginTop: 16, lineHeight: 18 },
  termsLink: { color: "#D97757", fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 13, color: "#9E9E9E" },
  footerLink: { fontSize: 13, color: "#D97757", fontWeight: "700" },
});