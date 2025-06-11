import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { registrarAcaoADM } from "@services/logAction";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const DevocionalAdminScreen = () => {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
   const { user } = useAuth();

  type DevocionalResumo = {
    id: string;
    titulo: string;
    subtitulo: string;
    imagem: string;
  };

  const [devocionaisSalvos, setDevocionaisSalvos] = useState<
    DevocionalResumo[]
  >([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "devocionais")),
      (snapshot) => {
        const dados = snapshot.docs.map((doc) => {
          const { titulo, subtitulo, imagem } = doc.data() as Omit<
            DevocionalResumo,
            "id"
          >;
          return {
            id: doc.id,
            titulo,
            subtitulo,
            imagem,
          };
        });

        const agrupados: { [key: string]: any[] } = {};
        dados.forEach((item) => {
          const chave = `${item.titulo}__${item.subtitulo}`;
          if (!agrupados[chave]) agrupados[chave] = [];
          agrupados[chave].push(item);
        });

        const resultado = Object.entries(agrupados).map(([chave, imagens]) => {
          const [titulo, subtitulo] = chave.split("__");
          return {
            id: chave,
            titulo,
            subtitulo,
            imagem: imagens[0].imagem,
          };
        });

        setDevocionaisSalvos(resultado);
      }
    );

    return () => unsubscribe();
  }, []);

  const selecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      const novasImagens = result.assets.map((asset) => asset.uri);
      setImagens((prev) => [...prev, ...novasImagens]);
    }
  };

  const removerImagem = (index: number) => {
    const novas = [...imagens];
    novas.splice(index, 1);
    setImagens(novas);
  };

  const cancelarCriacao = () => {
    Alert.alert("Cancelar", "Deseja realmente cancelar este devocional?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim",
        style: "destructive",
        onPress: () => {
          setTitulo("");
          setSubtitulo("");
          setImagens([]);
        },
      },
    ]);
  };

  const excluirDevocional = async (titulo: string, subtitulo: string) => {
    Alert.alert("Excluir", "Deseja remover este devocional completo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const q = query(
              collection(db, "devocionais"),
              where("titulo", "==", titulo),
              where("subtitulo", "==", subtitulo)
            );
            const snapshot = await getDocs(q);
            const batchDeletions = snapshot.docs.map((docSnap) =>
              deleteDoc(docSnap.ref)
            );
            await Promise.all(batchDeletions);
             if (user?.email) {
              await registrarAcaoADM(user.email, "Excluiu um Devocional");
            }
          } catch (err) {
            console.error("Erro ao excluir:", err);
          }
        },
      },
    ]);
  };

  const salvarDevocional = async () => {
    if (!titulo.trim() || !subtitulo.trim()) {
      Alert.alert("Erro", "Preencha o título e o subtítulo.");
      return;
    }

    if (imagens.length === 0) {
      Alert.alert("Erro", "Adicione ao menos uma imagem.");
      return;
    }

    setLoading(true);

    try {
      for (const uri of imagens) {
        let compressLevel = 0.5;

        let manipulada = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: compressLevel, format: ImageManipulator.SaveFormat.JPEG }
        );

        let base64 = await FileSystem.readAsStringAsync(manipulada.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        let base64Length = base64.length * (3 / 4);

        while (base64Length > 1000000 && compressLevel > 0.1) {
          compressLevel -= 0.1;
          manipulada = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],
            {
              compress: compressLevel,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );
          base64 = await FileSystem.readAsStringAsync(manipulada.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          base64Length = base64.length * (3 / 4);
        }

        if (base64Length > 1000000) {
          throw new Error("Imagem excede o tamanho permitido após compressão.");
        }

        await addDoc(collection(db, "devocionais"), {
          titulo: titulo.trim(),
          subtitulo: subtitulo.trim(),
          imagem: `data:image/jpeg;base64,${base64}`,
          createdAt: serverTimestamp(),
        });
      }

      setTitulo("");
      setSubtitulo("");
      setImagens([]);
      if (user?.email) {
              await registrarAcaoADM(user.email, "Adicionou um Devocional");
            }
      Alert.alert("Sucesso", "Devocional salvo com sucesso!");

      setTimeout(async () => {
        try {
          const q = query(
            collection(db, "devocionais"),
            where("titulo", "==", titulo.trim()),
            where("subtitulo", "==", subtitulo.trim())
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            await fetch("https://mndd-backend.onrender.com/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "📚 Novo Devocional",
                body: "Veja o devocional de hoje na tela inicial!",
              }),
            });
          }
        } catch (err) {
          console.error("Erro ao enviar notificação:", err);
        }
      }, 60000);
    } catch (error: any) {
      console.error("Erro:", error);
      Alert.alert("Erro", error.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Criar Devocional</Text>

      <TextInput
        style={styles.input}
        placeholder="Título"
        value={titulo}
        onChangeText={setTitulo}
      />
      <TextInput
        style={styles.input}
        placeholder="Subtítulo"
        value={subtitulo}
        onChangeText={setSubtitulo}
      />

      <TouchableOpacity style={styles.botaoAzul} onPress={selecionarImagem}>
        <Ionicons name="image-outline" size={20} color="#fff" />
        <Text style={styles.textoBotao}>Selecionar Imagens</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ marginVertical: 20 }}>
        {imagens.map((uri, index) => (
          <View key={index} style={{ position: "relative", marginRight: 10 }}>
            <Image
              source={{ uri }}
              style={{ width: 100, height: 140, borderRadius: 8 }}
            />
            <TouchableOpacity
              onPress={() => removerImagem(index)}
              style={styles.removerBotao}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <View style={styles.botoesContainer}>
          <TouchableOpacity style={styles.botaoVerde} onPress={salvarDevocional}>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoVermelho} onPress={cancelarCriacao}>
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.label, { marginTop: 30 }]}>Devocionais Salvos</Text>

      <FlatList
        data={devocionaisSalvos}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.miniaturaWrapper}>
            <Image source={{ uri: item.imagem }} style={styles.miniatura} />
            <Text
              style={{
                width: 100,
                textAlign: "center",
                marginTop: 4,
                fontSize: 12,
              }}
              numberOfLines={2}
            >
              {item.titulo}
            </Text>
            <TouchableOpacity
              style={styles.miniaturaRemover}
              onPress={() => excluirDevocional(item.titulo, item.subtitulo)}
            >
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 10 }}
        showsHorizontalScrollIndicator={false}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f2f2f2" },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  removerBotao: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  miniaturaWrapper: {
    width: 120,
    marginRight: 10,
    alignItems: "center",
    position: "relative",
  },
  miniatura: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  miniaturaRemover: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#e53935",
    borderRadius: 12,
    padding: 4,
  },
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  botaoVerde: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
  },
  botaoVermelho: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E53935",
    padding: 12,
    borderRadius: 10,
  },
  botaoAzul: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1976D2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  textoBotao: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default DevocionalAdminScreen;
