// ==========================================
// OPTIX DOCUMENT OCR SCANNING ENGINE
// ==========================================

export async function extractTextFromImage(imageUri) {
  try {
    if (!imageUri) {
      throw new Error("No image target context reference URI provided.");
    }

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: "document_capture.jpg",
      type: "image/jpeg",
    });
    
    // Optional parameter flags mapping for standard corporate parser APIs
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
    
    // Safety token checking structure for API output variants
    if (data?.OCRExitCode > 2) {
      throw new Error(data?.ErrorMessage?.[0] || "OCR internal processor error engine exception.");
    }

    const parsedText = data?.ParsedResults?.[0]?.ParsedText;
    return parsedText ? parsedText.trim() : "";

  } catch (error) {
    console.log("OCR SERVICE ERROR:", error);
    return ""; // Soft structural fallback returns an empty string block for the app context UI safely
  }
}