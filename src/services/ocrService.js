export async function extractTextFromImage(imageUri) {
  try {
    const formData = new FormData();

    formData.append("apikey", "K85037255188957");
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("OCREngine", "2");

    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "image.jpg",
    });

    const response = await fetch(
      "https://api.ocr.space/parse/image",
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    console.log(
      "OCR RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (data.IsErroredOnProcessing) {
      console.log("OCR ERROR:", data);
      return "";
    }

    const extractedText =
      data?.ParsedResults?.[0]?.ParsedText || "";

    return extractedText.trim();

  } catch (error) {
    console.log("OCR SERVICE ERROR:", error);
    return "";
  }
}