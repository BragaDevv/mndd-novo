import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDocs, collection, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ajuste o caminho se necessário

const assistantAvatar = require("../assets/logo.png");
const userAvatar = require("../assets/avatarpastorrosto.png");

type Culto = {
  id: string;
  data: string;
  horario: string;
  tipo: string;
  descricao?: string;
};

const BibleAssistant = () => {
  const [messages, setMessages] = useState([
    {
      text: "A Paz do Senhor ! 🙏 Sou o Assistente Bíblico do MNDD. Posso te ajudar a:\n\n• Encontrar versículos\n• Explicar passagens\n• Contar histórias da Bíblia\n• Dar orientações cristãs\n• Informar sobre os próximos cultos\n\nComo posso te ajudar hoje?",
      user: false,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

useEffect(() => {
  const carregarCultos = async () => {
    try {
      const cultosRef = collection(db, "cultos");
      const q = query(cultosRef, orderBy("data", "asc")); // opcional: ordena por data
      const snapshot = await getDocs(q);
      const cultosList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Culto[];
      setCultos(cultosList);
      console.log("✅ Cultos carregados do Firestore:", cultosList);
    } catch (error) {
      console.error("❌ Erro ao buscar cultos no Firestore:", error);
    }
  };

  carregarCultos();
}, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatarCultos = () => {
    if (cultos.length === 0) {
      return "No momento não há cultos programados. Fique atento às nossas redes sociais para atualizações!";
    }

    let mensagem = "📅 Próximos Cultos no MNDD:\n\n";
    cultos.forEach((culto) => {
      mensagem += `⛪ ${culto.tipo}\n`;
      mensagem += `📅 ${culto.data} às ${culto.horario}\n`;
      if (culto.descricao) {
        mensagem += `📝 ${culto.descricao}\n`;
      }
      mensagem += "\n";
    });

    return mensagem;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      text: input,
      user: true,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const perguntaSobreCultos =
      input.toLowerCase().includes("culto") ||
      input.toLowerCase().includes("evento") ||
      input.toLowerCase().includes("programação") ||
      input.toLowerCase().includes("agenda");

    if (perguntaSobreCultos) {
      setTimeout(() => {
        const respostaCultos = {
          text: formatarCultos(),
          user: false,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, respostaCultos]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(
        "https://mndd-backend.onrender.com/api/openai/ask",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input }),
        }
      );

      const data = await response.json();
      const aiMessage = {
        text: data.result || "Não entendi sua pergunta. Poderia reformular?",
        user: false,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro na API:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Houve um erro ao conectar. Por favor, tente novamente mais tarde.",
          user: false,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const avatar1 = require("../assets/avatarpastor.png");
  const avatar2 = require("../assets/avatarpastor2.png");
  const [avatar, setAvatar] = useState(avatar1);

  const handlePress = () => {
    setAvatar((prev: any) => (prev === avatar1 ? avatar2 : avatar1));
  };

  const conteudo = (
    <>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image source={assistantAvatar} style={styles.avatar} />
        <View>
          <Text style={styles.headerTitle}>Assistente MNDD</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
      </View>

      {/* Mensagens */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.messagesContainer, { flexGrow: 1 }]}
        keyboardDismissMode="interactive"
        persistentScrollbar={true}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              msg.user ? styles.userContainer : styles.aiContainer,
            ]}
          >
            {!msg.user && (
              <Image source={userAvatar} style={styles.messageAvatar} />
            )}

            <View
              style={[
                styles.messageBubble,
                msg.user ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text style={msg.user ? styles.userText : styles.aiText}>
                {msg.text}
              </Text>
              <Text style={styles.timeText}>{msg.time}</Text>
            </View>

            {msg.user && <Image style={styles.messageAvatar} />}
          </View>
        ))}

        {loading && (
          <View style={[styles.messageContainer, styles.aiContainer]}>
            <Image source={userAvatar} style={styles.messageAvatar} />
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiText}>Digitando...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Avatar flutuante */}
      <TouchableOpacity onPress={handlePress} style={styles.avatarFloating}>
        <Image
          source={avatar}
          style={{ width: 80, height: 100}}
        />
      </TouchableOpacity>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua pergunta bíblica..."
          placeholderTextColor="#999"
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading || !input.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={loading || !input.trim() ? "#fff" : "#075E54"}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 85}
      >
        {conteudo}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5ddd5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#075E54",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#128C7E",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "white",
  },
  avatarFloating: {
    position: "absolute",
     bottom: Platform.select({
      android: 148,
      ios: 125,
    }),
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: "transparent",
    zIndex: 0,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Montserrat_500Medium",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    maxWidth: "90%",
  },
  aiContainer: {
    alignSelf: "flex-start",
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  messageAvatar: {
    width: 40,
    height: 45,
    borderRadius: 18,
    marginHorizontal: 5,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 8,
    position: "relative",
  },
  userBubble: {
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: "white",
    borderTopLeftRadius: 0,
  },
  userText: {
    color: "black",
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: "black",
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingBottom: Platform.select({
      android: 45,
      ios: 25,
    }),
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default BibleAssistant;
