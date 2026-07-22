import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
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
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
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
                color="#D97757"
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
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#9E9E9E"
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#BDBDBD"
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
    backgroundColor: "#F4F5F9",
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
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#D97757",
  },

  logoSub: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },

  cardSub: {
    fontSize: 13,
    color: "#9E9E9E",
    marginBottom: 24,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F5F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
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
    color: "#1A1A2E",
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
    color: "#D97757",
    fontWeight: "600",
  },

  primaryBtn: {
    backgroundColor: "#D97757",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryBtnDisabled: {
    opacity: 0.7,
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  footerText: {
    color: "#9E9E9E",
  },

  footerLink: {
    color: "#D97757",
    fontWeight: "700",
  },
});