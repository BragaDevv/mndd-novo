import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
} from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { Audio } from "expo-av";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  setDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const perguntasJSON = require("../data/quizPerguntas.json");
const { height } = Dimensions.get("window");
const db = getFirestore();

type QuizNavigationProp = NativeStackNavigationProp<RootStackParamList, "Quiz">;

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  respostaCorreta: string;
}

const QuizScreen = () => {
  const navigation = useNavigation<QuizNavigationProp>();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [pontuacao, setPontuacao] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(10);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const beepSoundRef = useRef<Audio.Sound | null>(null);
  const timerAnimRef = useRef<LottieView>(null);

  const perguntaAtual = perguntas[indiceAtual];

  useEffect(() => {
    const embaralhadas = [...perguntasJSON].sort(() => Math.random() - 0.5);
    setPerguntas(embaralhadas);
  }, []);

  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    const tocarBeep = async () => {
      if (beepSoundRef.current) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/timer.mp3")
        );
        beepSoundRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.log("Erro ao tocar som:", error);
      }
    };

    const pararBeep = async () => {
      if (beepSoundRef.current) {
        try {
          await beepSoundRef.current.stopAsync();
          await beepSoundRef.current.unloadAsync();
          beepSoundRef.current = null;
        } catch (error) {
          console.log("Erro ao parar som:", error);
        }
      }
    };

    if (timerAtivo) {
      timerAnimRef.current?.reset();
      timerAnimRef.current?.play();
      intervalo = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 6 && prev > 1) {
            tocarBeep();
          }
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
    const caminho =
      tipo === "acerto"
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
        console.log("Erro ao parar som:", error);
      }
    }
  };

const salvarPontuacao = async (pontuacao: number) => {
  try {
    const expoToken = await AsyncStorage.getItem("expoPushToken");
    if (!expoToken) {
      console.log("❌ Expo token não encontrado.");
      return;
    }

    // Buscar nome do usuário
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("expoToken", "==", expoToken));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("⚠️ Usuário não encontrado com esse token.");
      return;
    }

    const dados = querySnapshot.docs[0].data();
    const nome = `${dados.nome || ""} ${dados.sobrenome || ""}`.trim();

    // Referência do documento no ranking
    const rankingRef = doc(db, "ranking", expoToken);
    const rankingSnap = await getDocs(query(collection(db, "ranking")));

    // Verificar se já existe pontuação registrada
    const docAtual = rankingSnap.docs.find((d) => d.id === expoToken);
    const pontuacaoAtual = docAtual?.data()?.pontuacao ?? 0;

    // Salvar apenas se for maior
    if (pontuacao > pontuacaoAtual) {
      await setDoc(rankingRef, {
        nome,
        pontuacao,
        data: new Date(),
      });
      console.log("✅ Ranking atualizado com nova pontuação!");
    } else {
      console.log("ℹ️ Pontuação não foi salva pois é menor ou igual à anterior.");
    }
  } catch (error) {
    console.log("Erro ao salvar ranking:", error);
  }
};
0


  const encerrarJogo = (mensagem: string) => {
    pararBeep();
    tocarSom("erro");
    timerAnimRef.current?.reset();
    salvarPontuacao(pontuacao);
    Alert.alert("Fim de jogo", `${mensagem}\nPontuação: ${pontuacao}`, [
      {
        text: "Jogar novamente",
        onPress: () => {
          const novas = [...perguntasJSON].sort(() => Math.random() - 0.5);
          setPerguntas(novas);
          setIndiceAtual(0);
          setPontuacao(0);
          setTempoRestante(10);
          setTimerAtivo(false);
          setIniciado(false);
          setRespostaSelecionada(null);
        },
      },
      { text: "Ver Ranking", onPress: () => navigation.navigate("Ranking") },
    ]);
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
          Alert.alert(
            "🎉 Parabéns!",
            `Você acertou todas!\nPontuação: ${pontuacao + 1}`,
            [
              {
                text: "Ver Ranking",
                onPress: () => navigation.navigate("Ranking"),
              },
            ]
          );
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

  const iniciarQuiz = () => {
    const novas = [...perguntasJSON].sort(() => Math.random() - 0.5);
    setPerguntas(novas);
    setIndiceAtual(0);
    setPontuacao(0);
    setTempoRestante(10);
    setTimerAtivo(true);
    setRespostaSelecionada(null);
    setIniciado(true);
  };

  if (!iniciado) {
    return (
      <View style={styles.inicioContainer}>
        <Image style={styles.quizImg} source={require("../assets/quiz_img.png")} />
        <View style={styles.divRegras}>
          <Text style={styles.subTitulo1}>⏳ Você terá 10 segundos por pergunta.</Text>
          <Text style={styles.subTitulo2}>✅ Acertou: avança.</Text>
          <Text style={styles.subTitulo2}>❌ Errou ou tempo esgotou: Game Over!</Text>
          <Text style={styles.subTitulo3}>Clique em "Start" para começar 🚀</Text>
        </View>
        <TouchableOpacity style={styles.botaoIniciar} onPress={iniciarQuiz}>
          <LottieView source={require("../assets/animations/quiz-animation.json")} autoPlay loop style={{ width: 300, height: 300 }} />
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
      <LottieView ref={timerAnimRef} source={require("../assets/animations/timer10s.json")} autoPlay loop={false} style={styles.timerAnimado} />
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
      <Text style={styles.pontuacao}>Pontuação: {pontuacao}</Text>
    </View>
  );
};

export default QuizScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  inicioContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffff",
  },
  quizImg: {
    marginTop: height * 0.15,
    width: "80%",
    height: "40%",
  },
  divRegras: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderColor: "#aaa",
  },
  subTitulo1: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  subTitulo2: {
    fontSize: 13,
    textAlign: "center",
  },
  subTitulo3: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  botaoIniciar: {
    top: -30,
  },
  timerAnimado: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 10,
  },
  pergunta: {
    fontSize: 22,
    marginBottom: 20,
    padding: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  botao: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  textoBotao: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
  },
  pontuacao: {
    marginTop: 30,
    fontSize: 18,
    textAlign: "center",
  },
});
