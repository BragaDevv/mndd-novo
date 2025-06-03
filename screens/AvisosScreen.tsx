import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { serverTimestamp } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const AvisosScreen = () => {
  const [mensagem, setMensagem] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [avisosAtuais, setAvisosAtuais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarAvisos = async () => {
      const q = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const agrupados: { [mensagem: string]: { id: string; imagens: string[] } } = {};

      snapshot.forEach((docItem) => {
        const data = docItem.data();
        const imagem = data.imageBase64 || data.imagem;
        const msg = data.mensagem;
        if (msg && imagem) {
          if (!agrupados[msg]) agrupados[msg] = { id: msg, imagens: [] };
          agrupados[msg].imagens.push(imagem);
        }
      });

      const lista = Object.entries(agrupados).map(([mensagem, obj]) => ({
        id: mensagem,
        mensagem,
        imagens: obj.imagens,
      }));

      setAvisosAtuais(lista);
    };

    carregarAvisos();
  }, [loading]);

  const escolherImagens = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const novasUris: string[] = resultado.assets.map((a) => a.uri);
      setImagens(novasUris);
    }
  };

  const removerImagemEspecifica = async (mensagem: string, imagem: string) => {
    try {
      const q = query(collection(db, "avisos"));
      const snapshot = await getDocs(q);
      const toDelete = snapshot.docs.find(
        (doc) => doc.data().mensagem === mensagem && (doc.data().imageBase64 === imagem || doc.data().imagem === imagem)
      );

      if (toDelete) {
        await deleteDoc(doc(db, "avisos", toDelete.id));
        Alert.alert("Removido", "Imagem removida com sucesso!");
        setLoading((prev) => !prev);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível remover a imagem.");
    }
  };

  const salvarAviso = async () => {
    if (!mensagem.trim()) {
      Alert.alert("Erro", "Digite uma mensagem.");
      return;
    }

    if (imagens.length === 0) {
      Alert.alert("Erro", "Selecione ao menos uma imagem.");
      return;
    }

    setLoading(true);

    try {
      for (const uri of imagens) {
        const manipulada = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64 = await FileSystem.readAsStringAsync(manipulada.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await addDoc(collection(db, "avisos"), {
          mensagem,
          imageBase64: `data:image/jpeg;base64,${base64}`,
          createdAt: serverTimestamp(),
        });
      }

      setMensagem("");
      setImagens([]);
      Alert.alert("Sucesso", "Avisos salvos com sucesso!");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar os avisos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Novo Aviso</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite a mensagem do aviso"
        value={mensagem}
        onChangeText={setMensagem}
        multiline
      />

      <TouchableOpacity style={styles.botaoImagem} onPress={escolherImagens}>
        <Text style={styles.botaoTexto}>
          {imagens.length > 0
            ? `${imagens.length} Imagem(ns) Selecionada(s)`
            : "Escolher Imagens"}
        </Text>
      </TouchableOpacity>

      {imagens.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={styles.preview} />
      ))}

      <TouchableOpacity
        style={styles.botaoSalvar}
        onPress={salvarAviso}
        disabled={loading}
      >
        <Text style={styles.botaoSalvarTexto}>
          {loading ? "Salvando..." : "Salvar Aviso"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Avisos Atuais</Text>
      {avisosAtuais.length === 0 ? (
        <Text style={styles.vazio}>Nenhum aviso no momento.</Text>
      ) : (
        avisosAtuais.map((aviso, index) => (
          <View key={aviso.id}>
            <Text style={styles.subtitulo}>Aviso {index + 1}</Text>
            <View style={styles.avisoAtual}>
              <Text style={styles.avisoTexto}>{aviso.mensagem}</Text>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.slideContainer}
              >
                {aviso.imagens.map((img: string, idx: number) => (
                  <View key={idx} style={{ alignItems: "center", position: "relative" }}>
                    <Image
                      source={{ uri: img }}
                      style={styles.preview}
                    />
                    <TouchableOpacity
                      onPress={() => removerImagemEspecifica(aviso.mensagem, img)}
                      style={styles.removerIconeBotao}
                    >
                      <MaterialIcons name="delete" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Montserrat_600SemiBold",
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    fontFamily: "Montserrat_600SemiBold",
    color: "#555",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 15,
    borderRadius: 8,
    fontFamily: "Montserrat_500Medium",
  },
  botaoImagem: {
    backgroundColor: "#075E54",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  botaoTexto: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Montserrat_600SemiBold",
  },
  preview: {
    width: width - 40,
    height: 280,
    borderRadius: 8,
    marginVertical: 10,
  },
  slideContainer: {
    width: width - 40,
    height: 180,
    borderRadius: 8,
  },
  botaoSalvar: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Montserrat_600SemiBold",
  },
  avisoAtual: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    height: 580,
  },
  avisoTexto: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    marginBottom:20
  },
  removerIconeBotao: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#dc3545",
    borderRadius: 16,
    padding: 4,
  },
  vazio: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Montserrat_500Medium",
  },
});

export default AvisosScreen;
