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
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const AvisosScreen = () => {
  const [mensagem, setMensagem] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);
  const [avisosAtuais, setAvisosAtuais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avisosExpandidos, setAvisosExpandidos] = useState<string[]>([]);

  const toggleExpandir = (id: string) => {
    setAvisosExpandidos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const carregarAvisos = async () => {
      const q = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const agrupados: {
        [mensagem: string]: { id: string; imagens: string[] };
      } = {};

      snapshot.forEach((docItem) => {
        const data = docItem.data();
        const imagem = data.imageBase64 || data.imagem;
        const msg = data.mensagem || "Sem mensagem";
        if (!agrupados[msg]) agrupados[msg] = { id: msg, imagens: [] };
        if (imagem) agrupados[msg].imagens.push(imagem);
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

  const handleMensagemChange = (texto: string) => {
    if (texto.length <= 200) {
      setMensagem(texto);
    }
  };

   // Adicionar contador visual após o TextInput
  const renderMensagemInput = () => (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="Digite a mensagem do aviso"
        value={mensagem}
        onChangeText={handleMensagemChange}
        multiline
      />
      <Text style={{ textAlign: "right", color: mensagem.length > 180 ? '#c00' : '#999', fontSize: 12 }}>{mensagem.length}/200</Text>
      
    </View>
  );

  const removerAviso = async (mensagem: string, img: string) => {
    try {
      setLoading(true);
      const q = query(collection(db, "avisos"));
      const snapshot = await getDocs(q);
      const toDelete = snapshot.docs.filter(
        (doc) => doc.data().mensagem === mensagem
      );

      const promises = toDelete.map((docRef) =>
        deleteDoc(doc(db, "avisos", docRef.id))
      );
      await Promise.all(promises);

      Alert.alert("Removido", "Aviso removido com sucesso!");
      setMensagem("");
      setImagens([]);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível remover o aviso.");
    } finally {
      setLoading(false);
    }
  };

  const salvarAviso = async () => {
    if (imagens.length > 0 && !mensagem.trim()) {
      Alert.alert("Erro", "Adicione uma mensagem para acompanhar as imagens.");
      return;
    }

    setLoading(true);

    try {
      if (imagens.length === 0) {
        await addDoc(collection(db, "avisos"), {
          mensagem,
          createdAt: serverTimestamp(),
        });
      } else {
        for (const uri of imagens) {
          let compressLevel = 0.5;
          let manipulada = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],
            {
              compress: compressLevel,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          let base64 = await FileSystem.readAsStringAsync(manipulada.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          let base64Length = base64.length * (3 / 4); // base64 to bytes estimate

          // Re-compress if size > 1MB
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
            throw new Error(
              "Imagem excede o tamanho permitido após compressão."
            );
          }

          await addDoc(collection(db, "avisos"), {
            mensagem,
            imageBase64: `data:image/jpeg;base64,${base64}`,
            createdAt: serverTimestamp(),
          });
        }
      }

      setMensagem("");
      setImagens([]);
      Alert.alert("Sucesso", "Aviso salvo com sucesso!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", error.message || "Não foi possível salvar o aviso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Novo Aviso</Text>

      {renderMensagemInput()}

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

      <TouchableOpacity
        style={[styles.botaoSalvar, { backgroundColor: "#dc3545" }]}
        onPress={() => {
          setMensagem("");
          setImagens([]);
          Alert.alert("Cancelado", "Criação do aviso cancelada.");
        }}
      >
        <Text style={styles.botaoSalvarTexto}>Cancelar</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Avisos Atuais</Text>
      {avisosAtuais.length === 0 ? (
        <Text style={styles.vazio}>Nenhum aviso no momento.</Text>
      ) : (
        avisosAtuais.map((aviso) => (
          <View key={aviso.id} style={styles.avisoAtual}>
            <TouchableOpacity
              style={styles.removerIconeBotao}
              onPress={() => removerAviso(aviso.mensagem, aviso.imagens[0])}
            >
              <MaterialIcons name="delete" size={24} color="#dc3545" />
            </TouchableOpacity>
            {aviso.imagens.length > 0 && (
              <TouchableOpacity
                style={styles.btnExp}
                onPress={() => toggleExpandir(aviso.id)}
              >
                <Ionicons
                  name={
                    avisosExpandidos.includes(aviso.id)
                      ? "remove-circle"
                      : "add-circle"
                  }
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.avisoTexto}>{aviso.mensagem}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}></View>

            {avisosExpandidos.includes(aviso.id) && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.slideContainer}
              >
                {aviso.imagens.map((img: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={styles.preview}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
            )}
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
    height: 180,
    borderRadius: 8,
    marginVertical: 10,
  },
  slideContainer: {
    width: width - 40,
    height: "auto",
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
    backgroundColor: "#FFF499",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  avisoTexto: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 10,
  },
  removerIconeBotao: {
    position: "relative",
    bottom: "0%",
    left: "-43%",
  },
  vazio: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Montserrat_500Medium",
  },
  btnExp: {
    position: "absolute",
    bottom: "94%",
    left: "94%",
  },
});

export default AvisosScreen;
