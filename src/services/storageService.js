import AsyncStorage from "@react-native-async-storage/async-storage";

const DOCS_KEY = "smartlens_documents";

export async function saveDocument(
  imageUri,
  extractedText,
  aiSummary,
  category,
) {
  const id = Date.now().toString();

  const doc = {
    id,
    imageUri,
    extractedText,
    aiSummary,
    category: category || "General",
    date: new Date().toISOString(),
    title: `Document ${new Date().toLocaleDateString()}`,
  };

  const existing = await getAllDocuments();
  existing.unshift(doc);
  await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(existing));
  return doc;
}

export async function getAllDocuments() {
  const raw = await AsyncStorage.getItem(DOCS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteDocument(id) {
  const docs = await getAllDocuments();
  const updated = docs.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(updated));
}

export async function searchDocuments(query) {
  const docs = await getAllDocuments();
  const q = query.toLowerCase();
  return docs.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.extractedText.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q),
  );
}

export async function updateDocumentTitle(id, title) {
  const docs = await getAllDocuments();
  const updated = docs.map((d) => (d.id === id ? { ...d, title } : d));
  await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(updated));
}
