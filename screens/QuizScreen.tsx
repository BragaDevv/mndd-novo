import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { FontAwesome5 } from "@expo/vector-icons";

const perguntasJSON = require("../data/quizPerguntas.json");

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

  const perguntaAtual = perguntas[indiceAtual];

  useEffect(() => {
    const embaralhadas = [...perguntasJSON].sort(() => Math.random() - 0.5);
    setPerguntas(embaralhadas);
  }, []);

  useEffect(() => {
    if (timerAtivo) {
      const intervalo = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev === 1) {
            clearInterval(intervalo);
            encerrarJogo("⏱ Tempo esgotado!");
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalo);
    }
  }, [timerAtivo]);

  const encerrarJogo = (mensagem: string) => {
    Alert.alert("Fim de jogo", `${mensagem}\nPontuação: ${pontuacao}`, [
      {
        text: "Jogar novamente",
        onPress: () => {
          setIndiceAtual(0);
          setPontuacao(0);
          setTempoRestante(10);
          setTimerAtivo(false);
          setIniciado(false);
        },
      },
      { text: "Ver Ranking", onPress: () => navigation.navigate("Ranking") },
    ]);
  };

  const verificarResposta = (resposta: string) => {
    setTimerAtivo(false);
    if (resposta === perguntaAtual.respostaCorreta) {
      const proxima = indiceAtual + 1;
      if (proxima < perguntas.length) {
        setIndiceAtual(proxima);
        setPontuacao(pontuacao + 1);
        setTempoRestante(10);
        setTimerAtivo(true);
      } else {
        Alert.alert("🎉 Parabéns!", `Você acertou todas!\nPontuação: ${pontuacao + 1}`, [
          { text: "Ver Ranking", onPress: () => navigation.navigate("Ranking") },
        ]);
      }
    } else {
      encerrarJogo("❌ Resposta errada!");
    }
  };

  const iniciarQuiz = () => {
    setIniciado(true);
    setTimerAtivo(true);
  };

  if (!iniciado) {
    return (
      <View style={styles.inicioContainer}>
        
        <Text style={styles.titulo}>Desafio Bíblico</Text>
        <TouchableOpacity style={styles.botaoIniciar} onPress={iniciarQuiz}>
           <LottieView
          source={require("../assets/animations/quiz-animation.json")}
          autoPlay
          loop
          style={{ width: 300, height: 300 }}
        />
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
      <Text style={styles.timer}>⏱ {tempoRestante}s</Text>
      <Text style={styles.pergunta}>{perguntaAtual.pergunta}</Text>
      {perguntaAtual.opcoes.map((opcao, index) => (
        <TouchableOpacity
          key={index}
          style={styles.botao}
          onPress={() => verificarResposta(opcao)}
        >
          <Text style={styles.textoBotao}>{opcao}</Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: "#E3F2FD",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#0D47A1",
  },
  botaoIniciar: {
    flexDirection: "row",
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  timer: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    color: "#E53935",
  },
  pergunta: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  botao: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  textoBotao: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  pontuacao: {
    marginTop: 30,
    fontSize: 18,
    textAlign: "center",
  },
});
