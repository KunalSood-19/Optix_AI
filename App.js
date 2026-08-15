import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import HomeScreen from "./src/screens/HomeScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import ResultScreen from "./src/screens/ResultScreen";
import VaultScreen from "./src/screens/VaultScreen";
import DocumentDetailScreen from "./src/screens/DocumentDetailScreen";
import QRScannerScreen from "./src/screens/QRScannerScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AgentScreen from "./src/screens/AgentScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import StudyDashboardScreen from "./src/screens/StudyDashboardScreen";
import StudySummaryScreen from "./src/screens/StudySummaryScreen";
import StudyNotesScreen from "./src/screens/StudyNotesScreen";
import FlashcardScreen from "./src/screens/FlashcardScreen";
import QuizScreen from "./src/screens/QuizScreen";
import QuizResultScreen from "./src/screens/QuizResultScreen";
import StudyHistoryScreen from "./src/screens/StudyHistoryScreen";
import MathSolverScreen from "./src/screens/MathSolverScreen";
import HandwritingEditorScreen from "./src/screens/HandwritingEditorScreen";
import MathHistoryScreen from "./src/screens/MathHistoryScreen";
import HandwritingHistoryScreen from "./src/screens/HandwritingHistoryScreen";

import { identifyObject } from "./src/services/geminiService";

import { supabase } from "./src/services/supabaseClient";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["optix://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

function VaultStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="VaultHome"
        component={VaultScreen}
      />
      <Stack.Screen
        name="DocumentDetail"
        component={DocumentDetailScreen}
      />
    </Stack.Navigator>
  );
}

function StudyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudyDashboard" component={StudyDashboardScreen} />
      <Stack.Screen name="StudySummary" component={StudySummaryScreen} />
      <Stack.Screen name="StudyNotes" component={StudyNotesScreen} />
      <Stack.Screen name="FlashcardReview" component={FlashcardScreen} />
      <Stack.Screen name="InteractiveQuiz" component={QuizScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="StudyHistory" component={StudyHistoryScreen} />
      <Stack.Screen name="MathSolver" component={MathSolverScreen} />
      <Stack.Screen name="HandwritingEditor" component={HandwritingEditorScreen} />
      <Stack.Screen name="MathHistory" component={MathHistoryScreen} />
      <Stack.Screen name="HandwritingHistory" component={HandwritingHistoryScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
      />
      <Stack.Screen
        name="HomeDashboard"
        component={HomeScreen}
      />

      <Stack.Screen
        name="Result"
        component={ResultScreen}
      />

      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
      />

      <Stack.Screen
        name="Vault"
        component={VaultStack}
      />

      <Stack.Screen
        name="Agent"
        component={AgentScreen}
      />

      <Stack.Screen
        name="Study"
        component={StudyStack}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
      />

      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setChecking(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4F5F9",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#D97757"
        />
      </View>
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="dark" />
        {session ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}