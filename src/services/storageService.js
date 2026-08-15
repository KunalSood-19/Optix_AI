import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabaseClient";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const DOCS_KEY = "smartlens_documents";

export async function saveDocument(
  imageUri,
  extractedText,
  aiSummary,
  category,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let uploadedImageUrl = imageUri;

    // Upload to Supabase Storage if it's a local file
    if (imageUri.startsWith('file://')) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      uploadedImageUrl = publicUrlData.publicUrl;
    }

    const doc = {
      user_id: user.id,
      image_uri: uploadedImageUrl,
      extracted_text: extractedText || "",
      ai_summary: aiSummary || "",
      category: category || "General",
      title: `Document ${new Date().toLocaleDateString()}`,
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([doc])
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      imageUri: data.image_uri,
      extractedText: data.extracted_text,
      aiSummary: data.ai_summary,
      category: data.category,
      date: data.created_at,
      title: data.title
    };
  } catch (error) {
    console.log("Supabase save failed, falling back to local storage:", error);
    // Fallback to local storage
    const id = Date.now().toString();
    const doc = {
      id, imageUri, extractedText, aiSummary,
      category: category || "General",
      date: new Date().toISOString(),
      title: `Document ${new Date().toLocaleDateString()}`,
    };
    const existing = await getAllDocuments();
    existing.unshift(doc);
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(existing));
    return doc;
  }
}

export async function getAllDocuments() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data.map(d => ({
      id: d.id,
      imageUri: d.image_uri,
      extractedText: d.extracted_text,
      aiSummary: d.ai_summary,
      category: d.category,
      date: d.created_at,
      title: d.title
    }));
  } catch (error) {
    console.log("Supabase fetch failed, falling back to local storage:", error);
    const raw = await AsyncStorage.getItem(DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function deleteDocument(id) {
  try {
    // Try UUID format delete (Supabase)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.log("Supabase delete failed, falling back to local storage:", error);
    const docs = await getAllDocuments();
    const updated = docs.filter((d) => d.id !== id);
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(updated));
  }
}

export async function searchDocuments(query) {
  const docs = await getAllDocuments();
  const q = query.toLowerCase();
  return docs.filter(
    (d) =>
      d.title?.toLowerCase().includes(q) ||
      d.extractedText?.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q),
  );
}

export async function updateDocumentTitle(id, title) {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    console.log("Supabase update failed, falling back to local storage:", error);
    const docs = await getAllDocuments();
    const updated = docs.map((d) => (d.id === id ? { ...d, title } : d));
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(updated));
  }
}
