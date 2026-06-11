import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { askAgent } from "../services/agentService";
import * as ImagePicker from "expo-image-picker";
import { extractTextFromImage } from "../services/ocrService";

export default function AgentScreen() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
const [imageText, setImageText] = useState("");
const [selectedImage, setSelectedImage] = useState(null);

 async function askQuestion() {
  if (!question.trim() || loading) return;

  Keyboard.dismiss();

  const userQuestion = question;

  setMessages((prev) => [
    ...prev,
    {
      type: "user",
      text: userQuestion,
    },
  ]);

  setQuestion("");
  setLoading(true);

  try {
    const prompt = imageText
      ? `
Image Content:
${imageText}

Question:
${userQuestion}

Answer ONLY using the image content. If the answer is not present in the image, say:
"The uploaded image does not contain enough information."
`
      : userQuestion;

    const response = await askAgent(prompt);

    setMessages((prev) => [
      ...prev,
      {
        type: "agent",
        text: response,
      },
    ]);

    // Clear image context after response
    setImageText("");
    setSelectedImage(null);
  } catch (error) {
    setMessages((prev) => [
      ...prev,
      {
        type: "agent",
        text: "❌ Failed to get response.",
      },
    ]);
  }

  setLoading(false);
}



async function handleAttachment() {
  try {
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

    if (!result.canceled) {
      setLoading(true);

      const uri = result.assets[0].uri;

      setMessages((prev) => [
  ...prev,
  {
    type: "image",
    uri,
  },
]);

setSelectedImage(uri);

      const text =
        await extractTextFromImage(uri);

      if (!text.trim()) {
        Alert.alert(
          "No Text Found",
          "The selected image doesn't contain readable text."
        );

        setSelectedImage(null);
      } else {
        setImageText(text);

        Alert.alert(
          "Image Selected",
          "Now ask a question related to this image."
        );
      }

      setLoading(false);
    }
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Error",
      "Failed to process image."
    );

    setLoading(false);
  }
}


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Optix</Text>

      <Text style={styles.subHeading}>
        Ask Optix Agent anything
       
      </Text>

      <ScrollView
        style={styles.chatContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        
        {messages.map((msg, index) => {
  if (msg.type === "image") {
    return (
      <View
        key={index}
        style={{
          alignSelf: "flex-end",
          marginBottom: 15,
        }}
      >
        <Image
          source={{ uri: msg.uri }}
          style={{
            width: 180,
            height: 180,
            borderRadius: 18,
          }}
        />
      </View>
    );
  }

  return (
    <View
      key={index}
      style={[
        styles.messageBubble,
        msg.type === "user"
          ? styles.userBubble
          : styles.agentBubble,
      ]}
    >
      <Text style={styles.messageText}>
        {msg.text}
      </Text>
    </View>
  );
})}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator
              size="small"
              color="#D97757"
            />

            <Text style={styles.loadingText}>
              Optix is thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor="#8D8FA5"
          multiline
          value={question}
          onChangeText={setQuestion}
        />

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleAttachment}>
            <Ionicons
              name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Voice support will be added soon."
                )
              }
            >
              <Ionicons
                name="mic-outline"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={askQuestion}
              disabled={loading}
            >
              <Ionicons
                name="arrow-up"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060B1A",
    padding: 20,
  },

  heading: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 30,
  },

  subHeading: {
    color: "#9AA4BF",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  chatContainer: {
    flex: 1,
  },

  messageBubble: {
    maxWidth: "85%",
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#D97757",
  },

  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#121826",
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
  },

  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121826",
    padding: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  loadingText: {
    color: "#FFFFFF",
    marginLeft: 10,
  },

  inputContainer: {
    backgroundColor: "#121826",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
  },

  input: {
    minHeight: 80,
    color: "#FFFFFF",
    fontSize: 17,
    textAlignVertical: "top",
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D97757",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  imagePreviewContainer: {
  marginBottom: 15,
  alignSelf: "flex-start",
},

imagePreview: {
  width: 120,
  height: 120,
  borderRadius: 16,
  marginBottom: 8,
},

imagePreviewText: {
  color: "#9AA4BF",
  fontSize: 12,
},
});