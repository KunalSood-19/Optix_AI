// ==========================================
// OPTIX DOCUMENT OCR SCANNING ENGINE
// ==========================================
import * as FileSystem from 'expo-file-system';
import { identifyObject } from './geminiService';

async function withRetry(fn, retries = 2, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, i)));
    }
  }
}

export async function extractTextFromImage(imageUri, base64Image = null) {
  try {
    if (!imageUri) {
      throw new Error("No image target context reference URI provided.");
    }

    const parsedText = await withRetry(async () => {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "document_capture.jpg",
        type: "image/jpeg",
      });
      
      formData.append("apikey", process.env.EXPO_PUBLIC_OCR_SPACE_KEY || "helloworld");
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`OCR processing server returned status error code: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.OCRExitCode > 2) {
        throw new Error(data?.ErrorMessage?.[0] || "OCR internal processor error engine exception.");
      }

      const text = data?.ParsedResults?.[0]?.ParsedText;
      if (!text || !text.trim()) {
         throw new Error("No text extracted by primary engine.");
      }
      return text.trim();
    });

    return parsedText;

  } catch (error) {
    console.log("OCR SERVICE FAILED, falling back to Vision AI:", error.message);
    
    // Intelligent Fallback: Use Llama Vision to extract text if OCR.space is down or failing
    try {
      let b64 = base64Image;
      if (!b64) {
        b64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      }
      let aiText = await identifyObject(b64);
      aiText = aiText.replace(/\[CONFIDENCE:\s*(HIGH|MEDIUM|LOW)\]/gi, "").trim();
      return aiText;
    } catch (fallbackError) {
      console.log("Fallback Vision AI failed:", fallbackError);
      return "";
    }
  }
}