// AvisosScreen.tsx atualizado com suporte a edição de avisos

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
  where,
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
  const [avisoEditandoId, setAvisoEditandoId] = useState<string | null>(null);

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

  const renderMensagemInput = () => (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="Digite a mensagem do aviso"
        value={mensagem}
        onChangeText={handleMensagemChange}
        multiline
      />
      <Text
        style={{
          textAlign: "right",
          color: mensagem.length > 180 ? "#c00" : "#999",
          fontSize: 12,
        }}
      >
        {mensagem.length}/200
      </Text>
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
      if (!avisoEditandoId) {
        Alert.alert("Removido", "Aviso removido com sucesso!");
      }

      setMensagem("");
      setImagens([]);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível remover o aviso.");
    } finally {
      setLoading(false);
    }
  };

const atualizarListaAvisos = async () => {
  const q = query(collection(db, "avisos"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const agrupados: { [mensagem: string]: { id: string; imagens: string[] } } = {};

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

const salvarAviso = async () => {
  if (!mensagem.trim() && imagens.length === 0) {
    Alert.alert("Erro", "Adicione uma mensagem antes de salvar.");
    return;
  }

  if (imagens.length > 0 && !mensagem.trim()) {
    Alert.alert("Erro", "Não é permitido enviar imagens sem uma mensagem.");
    return;
  }

  setLoading(true);

  try {
    const isNovoAviso = !avisoEditandoId;

    if (avisoEditandoId) {
      await removerAviso(avisoEditandoId, imagens[0]);
      setAvisoEditandoId(null);
    }

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

        await addDoc(collection(db, "avisos"), {
          mensagem,
          imageBase64: `data:image/jpeg;base64,${base64}`,
          createdAt: serverTimestamp(),
        });
      }
    }

    setMensagem("");
    setImagens([]);
    await atualizarListaAvisos();

    Alert.alert("Sucesso", avisoEditandoId ? "Aviso editado com sucesso!" : "Aviso salvo com sucesso!");

    // ✅ Agendar notificação após 1 minuto (somente para novos avisos)
   if (isNovoAviso) {
  console.log("⏳ Aguardando 1 minuto para verificar se aviso persiste...");

  const avisoCriado = {
    mensagem: mensagem.trim(),
  };

  setTimeout(async () => {
    try {
      console.log("🔎 Verificando se o aviso ainda existe no Firestore...");
      const q = query(
        collection(db, "avisos"),
        where("mensagem", "==", avisoCriado.mensagem)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.log("✅ Aviso ainda existe. Enviando notificação...");
        await fetch("https://mndd-backend.onrender.com/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "📢 Alô MNDD !",
            body: "Tem aviso novo lá no mural!",
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("📨 Resposta do servidor:", data);
            if (!data?.sent) {
              console.warn("⚠️ Notificação enviada, mas sem confirmação.");
            }
          });
      } else {
        console.log("🛑 Aviso foi removido antes de 1 minuto. Cancelando notificação.");
      }
    } catch (err) {
      console.error("❌ Erro ao verificar/executar notificação:", err);
    }
  }, 60000); // 60 segundos
}


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

      {avisoEditandoId && (
        <Text style={{ textAlign: 'center', marginBottom: 10, color: '#007bff', fontWeight: 'bold' }}>
          Editando aviso...
        </Text>
      )}

      {renderMensagemInput()}

      <TouchableOpacity style={styles.botaoImagem} onPress={escolherImagens}>
        <Text style={styles.botaoTexto}>
          {imagens.length > 0
            ? `${imagens.length} Imagem(ns) Selecionada(s)`
            : "Escolher Imagens"}
        </Text>
      </TouchableOpacity>

      {imagens.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.slideContainer}
        >
          {imagens.map((img, i) => (
            <View key={i} style={{ position: 'relative' }}>
              <Image source={{ uri: img }} style={styles.preview} />
              <TouchableOpacity
                onPress={() => {
                  const novas = imagens.filter((_, index) => index !== i);
                  setImagens(novas);
                }}
                style={styles.removerImagemBotao}
              >
                <MaterialIcons name="cancel" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

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
          setAvisoEditandoId(null);
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

            <TouchableOpacity
              style={styles.editarIconeBotao}
              onPress={() => {
                setMensagem(aviso.mensagem);
                setImagens(aviso.imagens);
                setAvisoEditandoId(aviso.id);
              }}
            >
              <MaterialIcons name="edit" size={24} color="#007bff" />
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

            <Text style={styles.avisoTexto}>{aviso.mensagem}</Text>

            {avisosExpandidos.includes(aviso.id) && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.slideContainer}
              >
                {aviso.imagens.reverse().map((img: string, idx: number) => (
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
    borderRadius: 8,
  },
  removerImagemBotao: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 2,
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
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 1,
  },
  editarIconeBotao: {
    position: "absolute",
    top: 8,
    left: 40,
    zIndex: 1,
  },
  vazio: {
    textAlign: "center",
    color: "#999",
    fontFamily: "Montserrat_500Medium",
  },
  btnExp: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});

export default AvisosScreen;

