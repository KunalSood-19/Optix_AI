import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
 } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { supabase } from "../services/supabaseClient";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing fields",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        "Please enter your email address first."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: Linking.createURL("reset-password"),
        }
      );

      setLoading(false);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Reset Link Sent",
          "Please check your email to reset your password."
        );
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#050505"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="scan-outline"
                size={32}
                color="#A3A3A3"
              />
            </View>

            <Text style={styles.logoText}>Optix</Text>

            <Text style={styles.logoSub}>
              See · Scan · Understand
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Welcome back
            </Text>

            <Text style={styles.cardSub}>
              Sign in to your account
            </Text>

            {/* Email */}
            <Text style={styles.fieldLabel}>Email</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9E9E9E"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A3A3A3"
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
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#9E9E9E"
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#A3A3A3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(!showPass)}
              >
                <Ionicons
                  name={
                    showPass
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={18}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && styles.primaryBtnDisabled,
              ]}
              disabled={loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Register")
              }
            >
              <Text style={styles.footerLink}>
                Create one
              </Text>
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
    backgroundColor: "#050505",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  logoBlock: {
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 36,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(163, 163, 163, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(163, 163, 163, 0.3)",
  },

  logoText: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: "#A3A3A3",
  },

  logoSub: {
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium',
    color: "#A3A3A3",
    marginTop: 4,
  },

  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  cardTitle: {
    fontSize: 20,
    fontFamily: 'Rajdhani_700Bold',
    color: "#F4F4F4",
    marginBottom: 4,
  },

  cardSub: {
    fontSize: 13,
    fontFamily: 'Rajdhani_500Medium',
    color: "#A3A3A3",
    marginBottom: 24,
  },

  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_700Bold',
    color: "#A3A3A3",
    marginBottom: 8,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 50,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: "#F4F4F4",
  },

  eyeBtn: {
    padding: 4,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 24,
  },

  forgotText: {
    fontSize: 12,
    color: "#4C4C4C",
    fontFamily: 'Rajdhani_600SemiBold',
  },

  primaryBtn: {
    backgroundColor: "#4C4C4C",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryBtnDisabled: {
    opacity: 0.7,
  },

  primaryBtnText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontFamily: 'Rajdhani_700Bold',
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  footerText: {
    color: "#A3A3A3",
    fontFamily: 'Rajdhani_500Medium',
  },

  footerLink: {
    color: "#4C4C4C",
    fontFamily: 'Rajdhani_700Bold',
  },
});