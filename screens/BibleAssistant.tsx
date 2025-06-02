import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";

type Culto = {
  id: string;
  data: string;
  horario: string;
  tipo: string;
  descricao?: string;
};

const BibleAssistant = () => {
  const saudacaoInicial = "Como posso te ajudar hoje?";

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
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [cultos, setCultos] = useState<Culto[]>([]);

  // SUA CHAVE API DA OPENAI (substitua pela sua)
  const OPENAI_API_KEY =
    "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";

  // Avatares (substitua pelos seus caminhos de imagem)
  const assistantAvatar = require("../assets/logo.png");
  const userAvatar = require("../assets/avatarpastorrosto.png");

  // Carrega os cultos programados
  useEffect(() => {
    const carregarCultos = async () => {
      try {
        const savedCultos = await AsyncStorage.getItem("@MNDD:cultos");
        if (savedCultos) {
          setCultos(JSON.parse(savedCultos));
        }
      } catch (error) {
        console.error("Erro ao carregar cultos:", error);
      }
    };

    carregarCultos();
  }, []);

  // Monitora o teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Formata a lista de cultos para exibição
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

    // Verifica se o usuário está perguntando sobre cultos
    const perguntaSobreCultos =
      input.toLowerCase().includes("culto") ||
      input.toLowerCase().includes("evento") ||
      input.toLowerCase().includes("programação") ||
      input.toLowerCase().includes("agenda");

    if (perguntaSobreCultos) {
      // Resposta local sem precisar da API
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
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "Você é um assistente bíblico cristão do Ministério Nascido de Deus (MNDD). " +
                  "Responda de forma clara, simples e acolhedora, citando versículos quando apropriado. " +
                  "Mantenha-se estritamente no contexto bíblico. " +
                  "Se perguntarem sobre cultos ou eventos da igreja, informe que pode verificar os próximos eventos. " +
                  "Para informações sobre cultos, diga apenas: 'Por favor, pergunte especificamente sobre os cultos para que eu possa verificar.'",
              },
              {
                role: "user",
                content: input,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      const data = await response.json();
      const aiMessage = {
        text:
          data.choices[0]?.message?.content ||
          "Não entendi sua pergunta. Poderia reformular?",
        user: false,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          text: `Houve um erro ao conectar. Por favor, tente novamente mais tarde. (${error.message || "Erro desconhecido"
            })`,
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
  const avatar2 = require("../assets/avatarpastor2.png"); // coloque outra imagem
  const [avatar, setAvatar] = useState(avatar1);

  const handlePress = () => {
    setAvatar((prev: any) => (prev === avatar1 ? avatar2 : avatar1));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image source={assistantAvatar} style={styles.avatar} />
        <View>
          <Text style={styles.headerTitle}>Assistente MNDD</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
      </View>

      {/* Área de mensagens */}
      <ScrollView
        contentContainerStyle={styles.messagesContainer}
        ref={(ref) => ref?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
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

            {msg.user && (
              <Image
                // source={userAvatar}
                style={styles.messageAvatar}
              />
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.messageContainer, styles.aiContainer]}>
            <Image source={assistantAvatar} style={styles.messageAvatar} />
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiText}>Digitando...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Avatar flutuante no canto inferior direito */}
      <TouchableOpacity onPress={handlePress} style={styles.avatarFloating} activeOpacity={1}>
        <Image source={avatar} style={styles.avatarFloating} />
      </TouchableOpacity>

      {/* Área de input */}
      <View
        style={[
          styles.inputContainer,
          keyboardVisible && styles.inputContainerKeyboardActive,
        ]}
      >
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
    </KeyboardAvoidingView>
  );
};

// Estilos permanecem exatamente os mesmos
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
    marginTop: Platform.select({
      android: 50,
      ios: 0,
    }),
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
    bottom: 45,
    left: 150,
    width: 80,
    height: 120,
    backgroundColor: "tranparent",
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
  },
  inputContainerKeyboardActive: {
    paddingBottom: 35,
  },
  input: {
    flex: 1,
    marginBottom: 10,
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
    marginBottom: 10,
  },
});

export default BibleAssistant;
