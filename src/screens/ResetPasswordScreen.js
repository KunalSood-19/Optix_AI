import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabaseClient";

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Password updated successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ]
      );
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060B1A" />
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          {/* Header Icon & Title */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={32} color="#D97757" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your secure new account credentials below</Text>

          {/* New Password Input Field */}
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#64687A"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8D8FA5"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input Field */}
          <Text style={styles.fieldLabel}>Confirm New Password</Text>
          <View style={[
            styles.inputContainer,
            confirmPassword && password !== confirmPassword && styles.inputContainerError
          ]}>
            <Ionicons name="lock-closed-outline" size={18} color="#8D8FA5" style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#64687A"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8D8FA5"
              />
            </TouchableOpacity>
          </View>
          {confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorText}>Passwords don't match</Text>
          )}

          {/* Submission Action Component Button element */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={handleResetPassword}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060B1A",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.15)",
  },
  iconContainer: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(219, 119, 87, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(219, 119, 87, 0.2)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#9AA4BF",
    textAlign: "center",
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9AA4BF",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#060B1A",
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 52,
  },
  inputContainerError: {
    borderColor: "#FF5252",
    backgroundColor: "rgba(255, 82, 82, 0.05)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 12,
    color: "#FF5252",
    marginTop: -14,
    marginBottom: 14,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#D97757",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#D97757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "rgba(217, 119, 87, 0.4)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});