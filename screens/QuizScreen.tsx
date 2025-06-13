// screens/QuizScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { Audio } from "expo-av";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

const perguntasJSON = require("../data/quizPerguntas.json");
const { height } = Dimensions.get("window");
const db = getFirestore();

type Pergunta = {
  pergunta: string;
  opcoes: string[];
  respostaCorreta: string;
};

const QuizScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Quiz">>();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [pontuacao, setPontuacao] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(10);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [expoToken, setExpoToken] = useState<string | null>(null);
  const [novoRecorde, setNovoRecorde] = useState(false);
  const beepSoundRef = useRef<Audio.Sound | null>(null);
  const timerAnimRef = useRef<LottieView>(null);
  const jogoEncerradoRef = useRef(false);
  const perguntaAtual = perguntas[indiceAtual];

  useEffect(() => {
    const prepararAssets = async () => {
      console.log("[QUIZ] Preparando assets e carregando token...");
      await Asset.loadAsync(require("../assets/quiz_img.png"));
      const embaralhadas = [...perguntasJSON].sort(() => Math.random() - 0.5);
      setPerguntas(embaralhadas);

      const token = await AsyncStorage.getItem("expoPushToken");
      if (!token) {
        Alert.alert("Erro", "Token não encontrado. Não será possível salvar sua pontuação.");
        console.log("[QUIZ] ❌ Token não encontrado.");
      } else {
        setExpoToken(token);
        console.log("[QUIZ] ✅ Token carregado:", token);
      }
    };
    prepararAssets();
  }, []);

  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    const tocarBeep = async () => {
      if (!timerAtivo || jogoEncerradoRef.current || beepSoundRef.current) return;
      try {
        const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/timer.mp3"));
        beepSoundRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.log("[QUIZ] Erro ao tocar som:", error);
      }
    };

    const pararBeep = async () => {
      if (beepSoundRef.current) {
        try {
          await beepSoundRef.current.stopAsync();
          await beepSoundRef.current.unloadAsync();
          beepSoundRef.current = null;
        } catch (error) {
          console.log("[QUIZ] Erro ao parar som:", error);
        }
      }
    };

    if (timerAtivo) {
      jogoEncerradoRef.current = false;
      timerAnimRef.current?.reset();
      timerAnimRef.current?.play();
      setTempoRestante(10);

      intervalo = setInterval(() => {
        if (jogoEncerradoRef.current) {
          clearInterval(intervalo);
          return;
        }

        setTempoRestante((prev) => {
          if (prev <= 6 && prev > 1) tocarBeep();
          if (prev === 1) {
            clearInterval(intervalo);
            pararBeep();
            timerAnimRef.current?.reset();
            encerrarJogo("⏱ Tempo esgotado!");
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalo);
  }, [timerAtivo]);

  const tocarSom = async (tipo: "acerto" | "erro") => {
    const caminho = tipo === "acerto"
      ? require("../assets/sounds/acerto.mp3")
      : require("../assets/sounds/erro.mp3");
    const { sound } = await Audio.Sound.createAsync(caminho);
    await sound.playAsync();
  };

  const pararBeep = async () => {
    if (beepSoundRef.current) {
      try {
        await beepSoundRef.current.stopAsync();
        await beepSoundRef.current.unloadAsync();
        beepSoundRef.current = null;
      } catch (error) {
        console.log("[QUIZ] Erro ao parar som:", error);
      }
    }
  };

  const salvarPontuacao = async (pontos: number) => {
    if (!expoToken || pontos <= 0) {
      console.log("[QUIZ] ℹ️ Nenhum ponto salvo: token ausente ou pontuação zerada.");
      return;
    }
    try {
      console.log("[QUIZ] 🔍 Buscando usuário com token:", expoToken);
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("expoToken", "==", expoToken));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log("[QUIZ] ⚠️ Nenhum usuário encontrado com esse token.");
        return;
      }

      const dados = querySnapshot.docs[0].data();
      const nome = `${dados.nome || ""} ${dados.sobrenome || ""}`.trim();
      const rankingRef = doc(db, "ranking", expoToken);
      const rankingSnap = await getDocs(query(collection(db, "ranking")));
      const docAtual = rankingSnap.docs.find((d) => d.id === expoToken);
      const pontuacaoAtual = docAtual?.data()?.pontuacao ?? 0;

      console.log(`[QUIZ] 🏁 Pontuação atual: ${pontuacaoAtual} | Nova: ${pontos}`);

      if (pontos > pontuacaoAtual) {
        await setDoc(rankingRef, {
          nome,
          pontuacao: pontos,
          data: new Date(),
        });
        setNovoRecorde(true);
        console.log("[QUIZ] ✅ Ranking atualizado com nova pontuação!");
      } else {
        console.log("[QUIZ] 🔁 Pontuação não foi atualizada. Já existe valor maior ou igual.");
      }
    } catch (error) {
      console.log("[QUIZ] ❌ Erro ao salvar pontuação:", error);
    }
  };

  const encerrarJogo = (mensagem: string) => {
    jogoEncerradoRef.current = true;
    setTimerAtivo(false);
    pararBeep();
    timerAnimRef.current?.reset();
    if (pontuacao > 0) salvarPontuacao(pontuacao);
    setModalVisivel(true);
    console.log("[QUIZ] 🚨 Jogo encerrado:", mensagem);
  };

  const iniciarQuiz = () => {
    if (!expoToken) {
      Alert.alert("Token não encontrado", "Você não poderá salvar sua pontuação.");
      console.log("[QUIZ] ⚠️ Tentativa de iniciar jogo sem token.");
    }
    const novas = [...perguntasJSON].sort(() => Math.random() - 0.5);
    setPerguntas(novas);
    setIndiceAtual(0);
    setPontuacao(0);
    setTempoRestante(10);
    setTimerAtivo(true);
    setRespostaSelecionada(null);
    setIniciado(true);
    setNovoRecorde(false);
    console.log("[QUIZ] 🚀 Início do quiz");
  };

  const verificarResposta = async (resposta: string) => {
    setTimerAtivo(false);
    await pararBeep();
    timerAnimRef.current?.reset();
    if (resposta === perguntaAtual.respostaCorreta) {
      await tocarSom("acerto");
      setRespostaSelecionada(resposta);
      setTimeout(() => {
        const proxima = indiceAtual + 1;
        if (proxima < perguntas.length) {
          setIndiceAtual(proxima);
          setPontuacao((prev) => prev + 1);
          setTempoRestante(10);
          setTimerAtivo(true);
          setRespostaSelecionada(null);
        } else {
          salvarPontuacao(pontuacao + 1);
          setModalVisivel(true);
          setPontuacao((prev) => prev + 1);
        }
      }, 1000);
    } else {
      setRespostaSelecionada(resposta);
      await tocarSom("erro");
      setTimeout(() => {
        encerrarJogo("❌ Resposta errada!");
      }, 1000);
    }
  };

  if (!iniciado) {
    return (
      <View style={styles.inicioContainer}>
        <Image
          style={styles.quizImg}
          source={require("../assets/quiz_img.png")}
        />
        <View style={styles.divRegras}>
          <Text style={styles.subTitulo1}>
            ⏳ Você terá 10 segundos por pergunta.
          </Text>
          <Text style={styles.subTitulo2}>✅ Acertou: avança.</Text>
          <Text style={styles.subTitulo2}>
            ❌ Errou ou tempo esgotou: Game Over!
          </Text>
          <Text style={styles.subTitulo3}>
            Clique em "Start" para começar 🚀
          </Text>
        </View>
        <TouchableOpacity style={styles.botaoStart3D} onPress={iniciarQuiz}>
          <Text style={styles.textoBotaoStart}>🎮 START</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.botaoRanking3D}
          onPress={() => navigation.navigate("Ranking")}
        >
          <Text style={styles.textoBotaoStart}>🏆 RANKING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (perguntas.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Carregando perguntas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        ref={timerAnimRef}
        source={require("../assets/animations/timer10s.json")}
        autoPlay
        loop={false}
        style={styles.timerAnimado}
      />
      <Text style={styles.pergunta}>{perguntaAtual.pergunta}</Text>
      {perguntaAtual.opcoes.map((opcao, index) => {
        let cor = "#2196F3";
        if (respostaSelecionada) {
          if (opcao === perguntaAtual.respostaCorreta) cor = "green";
          else if (opcao === respostaSelecionada) cor = "red";
        }

        return (
          <TouchableOpacity
            key={index}
            style={[styles.botao, { backgroundColor: cor }]}
            onPress={() => verificarResposta(opcao)}
            disabled={!!respostaSelecionada}
          >
            <Text style={styles.textoBotao}>{opcao}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.buttonExit}
        onPress={() => encerrarJogo("⏹ Jogo encerrado pelo usuário")}
      >
        <Ionicons name="exit" size={36} color="#000" />
        <Text style={styles.buttonTxtExit}>SAIR</Text>
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTxt}>Sua Pontuação:</Text>
            <Text style={styles.modalPontuacao}>{pontuacao}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisivel(false);
                const novas = [...perguntasJSON].sort(
                  () => Math.random() - 0.5
                );
                setPerguntas(novas);
                setIndiceAtual(0);
                setPontuacao(0);
                setTempoRestante(10);
                setTimerAtivo(false);
                setIniciado(false);
                setRespostaSelecionada(null);
                jogoEncerradoRef.current = false;
              }}
            >
              <Text style={styles.modalButtonText}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default QuizScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  inicioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffff",
  },
  quizImg: {
    position: "relative",
    top: -60,
    width: "80%",
    height: "40%",
    marginTop: Platform.select({
          android: 0,
          ios: 0,
        }),
  },
  divRegras: {
    position: "relative",
    top: -40,
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    borderColor: "#aaa",
  },
  subTitulo1: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subTitulo2: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  subTitulo3: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  botaoStart3D: {
    position: "relative",
    top: 10,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ translateY: -4 }],
  },

  textoBotaoStart: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 2,
  },

  botaoRanking3D: {
    position: "relative",
    top: 10,
    backgroundColor: "#FFC107",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ translateY: -4 }],
    marginTop: 15,
  },

  timerAnimado: {
    position: "relative",
    top: -50,
    width: 150,
    height: 150,
    alignSelf: "center",
  },
  pergunta: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 20,
    marginBottom: 20,
    padding: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  botao: {
    padding: 12,
    marginHorizontal: 40,
    borderRadius: 10,
    marginVertical: 8,
  },
  textoBotao: {
    fontFamily: "Montserrat_500Medium",
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  pontuacao: {
    marginTop: 30,
    fontSize: 18,
    textAlign: "center",
  },
  buttonExit: {
    position: "relative",
    top: 30,
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonTxtExit: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
    color: "#000",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "12%",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
    modalTxt: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 24,
    backgroundColor: "transparent",
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
  },
  modalPontuacao: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 32,
    backgroundColor: "transparent",
    fontWeight: "bold",
    color: "#ff5722",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
