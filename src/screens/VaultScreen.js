import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getAllDocuments,
  deleteDocument,
  searchDocuments,
} from "../services/storageService";

const CATEGORIES = ["All", "Receipt", "General", "ID", "Certificate"];

const CATEGORY_COLORS = {
  Receipt: { text: "#FFB347", bg: "#FFB34733" },
  General: { text: "#D97757", bg: "#D9775733" },
  ID: { text: "#FF6584", bg: "#FF658433" },
  Certificate: { text: "#43D9AD", bg: "#43D9AD33" },
};

export default function VaultScreen({ navigation }) {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useFocusEffect(
    useCallback(() => {
      loadDocs();
    }, []),
  );

  async function loadDocs() {
    const all = await getAllDocuments();
    setDocs(all);
  }

  async function handleSearch(text) {
    setSearch(text);
    if (text.trim()) {
      const results = await searchDocuments(text);
      setDocs(results);
    } else {
      loadDocs();
    }
  }

  async function handleDelete(id) {
    Alert.alert("Delete", "Remove this document?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDocument(id);
          loadDocs();
        },
      },
    ]);
  }

  const filtered =
    category === "All" ? docs : docs.filter((d) => d.category === category);

  function getCategoryColors(cat) {
    return CATEGORY_COLORS[cat] || { text: "#888", bg: "#88888833" };
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PDF Vault</Text>
        <Text style={styles.count}>{docs.length} documents</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, category === cat && styles.activeCat]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[styles.catText, category === cat && styles.activeCatText]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No documents yet</Text>
          <Text style={styles.emptySubtext}>
            Scan something to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const colors = getCategoryColors(item.category);
            return (
              <TouchableOpacity
                style={styles.docCard}
                onPress={() =>
                  navigation.navigate("DocumentDetail", { doc: item })
                }
              >
                <Image source={{ uri: item.imageUri }} style={styles.thumb} />
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.docDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <View
                    style={[styles.catBadge, { backgroundColor: colors.bg }]}
                  >
                    <Text style={[styles.catBadgeText, { color: colors.text }]}>
                      {item.category}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6584" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#333" },
  count: { fontSize: 14, color: "#888" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  categories: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  activeCat: { backgroundColor: "#D97757", borderColor: "#D97757" },
  catText: { fontSize: 13, color: "#888" },
  activeCatText: { color: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 18, color: "#ccc", fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: "#ddd" },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
  },
  thumb: { width: 70, height: 80, backgroundColor: "#eee" },
  docInfo: { flex: 1, padding: 12, gap: 4 },
  docTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  docDate: { fontSize: 12, color: "#888" },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  catBadgeText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 16 },
});
