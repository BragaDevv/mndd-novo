import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

type Log = {
  id: string;
  email: string;
  acao: string;
  timestamp: Timestamp;
};

const LogsScreen = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "logs_acesso"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Log[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, "id">),
      }));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const renderItem = ({ item }: { item: Log }) => {
    const data = item.timestamp.toDate().toLocaleString("pt-BR");
    return (
      <View style={styles.card}>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.acao}>{item.acao}</Text>
        <Text style={styles.timestamp}>{data}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logs de Acesso ADM</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar por email..."
        value={searchEmail}
        onChangeText={setSearchEmail}
        placeholderTextColor="#999"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default LogsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    color: "#000",
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  email: {
    fontWeight: "bold",
    color: "#000",
  },
  acao: {
    marginTop: 4,
    color: "#333",
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});
