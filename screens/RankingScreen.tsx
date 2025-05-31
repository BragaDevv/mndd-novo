// screens/RankingScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FontAwesome5 } from "@expo/vector-icons";

interface Resultado {
  nome: string;
  pontuacao: number;
}

const RankingScreen = () => {
  const [ranking, setRanking] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarRanking = async () => {
      try {
        const q = query(
          collection(db, "quizResultados"),
          orderBy("pontuacao", "desc"),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const dados: Resultado[] = [];
        querySnapshot.forEach((doc) => {
          const { nome, pontuacao } = doc.data();
          dados.push({ nome, pontuacao });
        });
        setRanking(dados);
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarRanking();
  }, []);

  const renderItem = ({ item, index }: { item: Resultado; index: number }) => (
    <View style={styles.item}>
      <Text style={styles.posicao}>{index + 1}º</Text>
      <FontAwesome5
        name={index === 0 ? "medal" : index === 1 ? "medal" : "medal"}
        size={24}
        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}
        style={styles.icone}
      />
      <Text style={styles.nome}>{item.nome}</Text>
      <Text style={styles.pontos}>{item.pontuacao} pts</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🏆 Ranking Bíblico</Text>
      {carregando ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default RankingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
  },
  posicao: {
    width: 30,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  icone: {
    marginHorizontal: 8,
  },
  nome: {
    flex: 1,
    fontSize: 16,
  },
  pontos: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1976D2",
  },
});
