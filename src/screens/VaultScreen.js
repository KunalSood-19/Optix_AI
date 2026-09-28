import { SafeAreaView } from 'react-native-safe-area-context';
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
  StatusBar
   } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getAllDocuments,
  deleteDocument,
  searchDocuments,
} from "../services/storageService";

const CATEGORIES = ["All", "Receipt", "General", "ID", "Certificate"];

const CATEGORY_COLORS = {
  Receipt: { text: "#FFB347", bg: "rgba(255, 179, 71, 0.2)" },
  General: { text: "#A3A3A3", bg: "rgba(217, 119, 87, 0.2)" },
  ID: { text: "#FF6584", bg: "rgba(255, 101, 132, 0.2)" },
  Certificate: { text: "#43D9AD", bg: "rgba(67, 217, 173, 0.2)" },
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
    return CATEGORY_COLORS[cat] || { text: "#888", bg: "rgba(255,255,255,0.4)" };
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.header}>
        <Text style={styles.title}>PDF Vault</Text>
        <Text style={styles.count}>{docs.length} documents</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor="#64748B"
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
          <Ionicons name="folder-open-outline" size={64} color="rgba(30,41,59,0.2)" />
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
                  <Ionicons name="trash-outline" size={20} color="#A3A3A3" />
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
  container: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "transparent",
  },
  title: { fontSize: 24, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4" },
  count: { fontSize: 14,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    margin: 16,
    marginTop: 0,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15,
    fontFamily: 'Rajdhani_500Medium', color: "#F4F4F4" },
  categories: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  activeCat: { backgroundColor: "rgba(77, 77, 77, 0.2)", borderColor: "#4C4C4C" },
  catText: { fontSize: 13, color: "#A3A3A3", fontFamily: 'Rajdhani_600SemiBold' },
  activeCatText: { color: "#A3A3A3",
    fontFamily: 'Rajdhani_500Medium', },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 18, color: "#F4F4F4", fontFamily: 'Rajdhani_600SemiBold' },
  emptySubtext: { fontSize: 14,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  thumb: { width: 70, height: 80, backgroundColor: "rgba(0,0,0,0.3)" },
  docInfo: { flex: 1, padding: 16, gap: 6 },
  docTitle: { fontSize: 16, fontFamily: 'Rajdhani_600SemiBold', color: "#F4F4F4" },
  docDate: { fontSize: 12,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  catBadgeText: { fontSize: 11, fontFamily: 'Rajdhani_700Bold' },
  deleteBtn: { padding: 16 },
});
