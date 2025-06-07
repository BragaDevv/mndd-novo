import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type Devocional = {
  titulo: string;
  subtitulo: string;
  imagem: string;
};

export default function DevocionalScreen() {
  const [devocionais, setDevocionais] = useState<Devocional[][]>([]);
  const [loading, setLoading] = useState(true);
  const [versiculoDia, setVersiculoDia] = useState<{
    texto: string;
    referencia: string;
  } | null>(null);

  useEffect(() => {
    const buscarVersiculo = async () => {
      try {
        const response = await fetch(
          "https://mndd-backend.onrender.com/api/versiculo-dia"
        );
        const data = await response.json();
        setVersiculoDia(data);
      } catch (error) {
        console.error("Erro ao buscar versículo:", error);
      }
    };

    buscarVersiculo();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "devocionais"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => doc.data() as Devocional);

      // Agrupar por titulo + subtitulo
      const agrupado: Record<string, Devocional[]> = {};
      dados.forEach((item) => {
        const chave = `${item.titulo}__${item.subtitulo}`;
        if (!agrupado[chave]) agrupado[chave] = [];
        agrupado[chave].push(item);
      });

      setDevocionais(Object.values(agrupado));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
    );
  }

  return (
    <LinearGradient colors={["#fdfcfb", "#e2d1c3"]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>

        {versiculoDia && (
          <View style={styles.cardVersiculo}>
            <Text style={styles.titulo}>Versículo do Dia</Text>
            <Text style={styles.subtitulo}>"{versiculoDia.texto}"</Text>
            <Text style={styles.referencia}>📖 {versiculoDia.referencia}</Text>
          </View>
        )}

        {devocionais.map((grupo, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.titulo}>{grupo[0].titulo}</Text>
            <Text style={styles.subtitulo}>{grupo[0].subtitulo}</Text>

            <FlatList
              data={grupo.slice().reverse()} // 🔄 inverte a ordem
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => idx.toString()}
              snapToInterval={width - 40}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View style={{ width: width - 40, alignItems: "center" }}>
                  <Image
                    source={{ uri: item.imagem }}
                    style={styles.imagem}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#ffff",
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: Platform.select({
      android: 5,
      ios: 5,
    }),
    marginBottom: Platform.select({
      android: 70,
      ios: 70,
    }),
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    color: "#333",
    marginBottom: 10,
    marginTop: 20,
  },
  subtitulo: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    color: "#666",
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 20,
  },
  imagem: {
    width: width - 80,
    height: width * 1.2, // proporção 3:4
    borderRadius: 16,
    backgroundColor: "#eee",
    marginRight: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  cardVersiculo: {
    backgroundColor: "#ffff",
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: Platform.select({
      android: 50,
      ios: 0,
    }),
  },
  referencia: {
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    fontStyle: "italic",
    color: "#999",
    marginBottom: 20,
  },
});
