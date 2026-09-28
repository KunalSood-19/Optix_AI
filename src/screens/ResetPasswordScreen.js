import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from "react";
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
 } from 'react-native';
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
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          {/* Header Icon & Title */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={32} color="#A3A3A3" />
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
    backgroundColor: "#050505",
    paddingHorizontal: 20,
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
  iconContainer: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(163, 163, 163, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(163, 163, 163, 0.3)",
  },
  title: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: "#F4F4F4",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: "#A3A3A3",
    textAlign: "center",
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_700Bold',
    color: "#A3A3A3",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 52,
  },
  inputContainerError: {
    borderColor: "#A3A3A3",
    backgroundColor: "rgba(255, 0, 127, 0.05)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Rajdhani_500Medium',
    color: "#F4F4F4",
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium',
    color: "#A3A3A3",
    marginTop: -14,
    marginBottom: 14,
    marginLeft: 4,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: "#4C4C4C",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "rgba(77, 77, 77, 0.4)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
  },
});