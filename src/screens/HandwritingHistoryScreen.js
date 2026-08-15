import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, TextInput  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHandwritingHistory, searchHandwriting, deleteHandwriting } from '../services/historyService';

export default function HandwritingHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const data = await getHandwritingHistory();
      setHistory(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load handwriting notes.");
    }
    setLoading(false);
  }

  async function handleSearch() {
    if (!query) {
      return fetchHistory();
    }
    setLoading(true);
    try {
      const data = await searchHandwriting(query);
      setHistory(data);
    } catch (e) {
      Alert.alert("Error", "Search failed.");
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    Alert.alert("Delete", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteHandwriting(id);
            setHistory(history.filter(m => m.id !== id));
          } catch (e) {
            Alert.alert("Error", "Could not delete.");
          }
      }}
    ])
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate("Study", {
        screen: "HandwritingEditor",
        params: { base64Array: [], manualText: item.text_content } // Passing empty array but adding manualText to simulate recognized text if we supported it directly. 
        // Note: I will need to update HandwritingEditor to accept manual text just in case.
      })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="document-text-outline" size={20} color="#4CAF50" />
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>{item.text_content}</Text>
      
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={18} color="#F44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Handwritten Notes</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9E9E9E" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search notes..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="journal-outline" size={48} color="#4CAF50" opacity={0.5} />
              <Text style={styles.emptyText}>No handwritten notes saved yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#EBEBEB" },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  searchBar: { flexDirection: "row", backgroundColor: "#FFF", margin: 16, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#EBEBEB" },
  searchInput: { flex: 1, fontSize: 16, color: "#1A1A2E" },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#EBEBEB", position: "relative" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardDate: { fontSize: 12, color: "#9E9E9E" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 4, paddingRight: 30 },
  cardDesc: { fontSize: 14, color: "#666", lineHeight: 20 },
  deleteBtn: { position: "absolute", top: 16, right: 16, padding: 4 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#9E9E9E", marginTop: 16, fontSize: 15 }
});
