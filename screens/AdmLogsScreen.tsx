import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipagem
type Log = {
  id: string;
  email: string;
  nome?: string;
  sobrenome?: string;
  acao: string;
  timestamp: Timestamp;
};

const categorias = [
  "Todas",
  "Aviso",
  "Notificação",
  "Culto",
  "Devocional",
  "Grupo",
  "Hora",
  "Hoje",
  "Ontem",
];

const LogsScreen = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState<string>("");

useEffect(() => {
  const carregarNomePorToken = async () => {
    try {
      const token = await AsyncStorage.getItem("expoPushToken");
      console.log("Expo Token recuperado:", token);

      if (token) {
        const usuariosRef = collection(db, "usuarios");
        const q = query(usuariosRef, where("expoToken", "==", token));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const usuarioDoc = querySnapshot.docs[0].data();
          const nomeCompleto = `${usuarioDoc.nome || ""} ${usuarioDoc.sobrenome || ""}`.trim();
          setNomeUsuario(nomeCompleto);
          console.log("Nome carregado via token:", nomeCompleto);
        } else {
          console.log("Nenhum usuário encontrado com esse expoToken.");
        }
      } else {
        console.log("expoPushToken não encontrado no AsyncStorage.");
      }
    } catch (error) {
      console.log("Erro ao carregar nome por token:", error);
    }
  };

  carregarNomePorToken();
}, []);


  useEffect(() => {
    const carregarLogs = async () => {
      try {
        const logsSnapshot = await getDocs(query(collection(db, "logs_acesso"), orderBy("timestamp", "desc")));
        const data: Log[] = logsSnapshot.docs.map((doc) => {
          const logData = doc.data() as Omit<Log, "id">;
          return {
            id: doc.id,
            ...logData,
          };
        });
        setLogs(data);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar logs:", error);
      }
    };

    carregarLogs();
  }, []);

  const filtrarPorCategoria = (log: Log) => {
    const acao = log.acao.toLowerCase();

    if (categoria === "Todas") return true;
    if (categoria === "Hoje") {
      const hoje = new Date();
      const dataLog = log.timestamp.toDate();
      return (
        dataLog.getDate() === hoje.getDate() &&
        dataLog.getMonth() === hoje.getMonth() &&
        dataLog.getFullYear() === hoje.getFullYear()
      );
    }
    if (categoria === "Ontem") {
      const hoje = new Date();
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);
      const dataLog = log.timestamp.toDate();
      return (
        dataLog.getDate() === ontem.getDate() &&
        dataLog.getMonth() === ontem.getMonth() &&
        dataLog.getFullYear() === ontem.getFullYear()
      );
    }

    return acao.includes(categoria.toLowerCase());
  };

  const filteredLogs = logs.filter((log) => {
    const termo = busca.toLowerCase();
    const nomeCompleto = `${log.nome || ""} ${log.sobrenome || ""}`.toLowerCase();
    return (
      filtrarPorCategoria(log) &&
      (log.email.toLowerCase().includes(termo) || nomeCompleto.includes(termo))
    );
  });

  const renderItem = ({ item }: { item: Log }) => {
    const data = item.timestamp.toDate().toLocaleString("pt-BR");
    const nomeCompleto = [item.nome, item.sobrenome].filter(Boolean).join(" ");

    return (
      <View style={styles.card}>
        <Text style={styles.email}>
          {nomeCompleto ? `${nomeCompleto}` : ""} - {item.email}
        </Text>
        <Text style={styles.acao}>{item.acao}</Text>
        <Text style={styles.timestamp}>{data}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logs de Acesso ADM</Text>
      {nomeUsuario ? (
        <Text style={styles.usuarioInfo}>Visualizando como: {nomeUsuario}</Text>
      ) : null}

      <TextInput
        style={styles.search}
        placeholder="Buscar por email ou nome..."
        value={busca}
        onChangeText={setBusca}
        placeholderTextColor="#999"
      />

      <View style={styles.chipContainer}>
        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategoria(cat)}
            style={[
              styles.chip,
              categoria === cat && styles.chipSelecionado,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                categoria === cat && styles.chipTextSelecionado,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
    marginBottom: 8,
    textAlign: "center",
  },
  usuarioInfo: {
    fontSize: 14,
    color: "#666",
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelecionado: {
    backgroundColor: "#000",
  },
  chipText: {
    color: "#333",
    fontWeight: "500",
  },
  chipTextSelecionado: {
    color: "#fff",
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
