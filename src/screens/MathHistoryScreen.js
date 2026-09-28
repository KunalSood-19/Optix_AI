import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMathHistory, deleteMathHistory } from '../services/historyService';

export default function MathHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const data = await getMathHistory();
      setHistory(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load math history.");
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    Alert.alert("Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await deleteMathHistory(id);
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
      onPress={() => navigation.navigate("MathSolver", {
        manualText: item.original_expression
      })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calculator-outline" size={20} color="#A3A3A3" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#A3A3A3" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.original_expression}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>Answer: {item.final_answer}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#F4F4F4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Math Vault</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A3A3A3" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="archive-outline" size={48} color="rgba(30,41,59,0.2)" />
              <Text style={styles.emptyText}>No solved math problems saved yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#050505" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "transparent" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginRight: 15 },
  headerTitle: { fontSize: 18, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4" },
  list: { padding: 16, gap: 12 },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, 
    backgroundColor: "rgba(255,255,255,0.12)", 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: "rgba(255,255,255,0.4)", 
    position: "relative",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardDate: { fontSize: 12,
    fontFamily: 'Rajdhani_500Medium', color: "#A3A3A3" },
  cardTitle: { fontSize: 16, fontFamily: 'Rajdhani_700Bold', color: "#F4F4F4", marginBottom: 6, paddingRight: 30 },
  cardDesc: { fontSize: 14, color: "#A3A3A3", fontFamily: 'Rajdhani_600SemiBold' },
  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#A3A3A3", marginTop: 16, fontSize: 15, fontFamily: 'Rajdhani_600SemiBold' }
});
