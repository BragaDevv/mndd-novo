import { useAuth } from "../context/AuthContext";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_200ExtraLight_Italic,
  Montserrat_300Light_Italic,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import LottieView from "lottie-react-native";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Ionicons } from "@expo/vector-icons";

type MNDDScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MNDD"
>;

// Obter altura da tela uma vez (não responde a mudanças de orientação)
const { height } = Dimensions.get('window');

const MNDDScreen = () => {
  const navigation = useNavigation<MNDDScreenNavigationProp>();
  const { isAdmin, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_200ExtraLight_Italic,
    Montserrat_300Light_Italic,
    Montserrat_600SemiBold,
  });

  const appStartRef = useRef(true);

  useEffect(() => {
    if (appStartRef.current) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        appStartRef.current = false;
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLockPress = () => {
    if (isAdmin) {
      navigation.navigate("SendNotification");
    } else {
      navigation.navigate("Login");
    }
  };

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../assets/animations/loading.json")}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão de Notificação (Admin) */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleLockPress}
        activeOpacity={0.7}
      >
        <Fontisto
          name={isAdmin ? "unlocked" : "locked"}
          size={28}
          color="#000"
        />
      </TouchableOpacity>

      {/* Logo */}
      <Image 
        style={styles.logo} 
        source={require("../assets/logo_sem_fundo.png")} 
        resizeMode="contain"
      />

      {/* Títulos */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleHome}>Ministério Nascido de Deus</Text>
        <Text style={styles.subTitleHome}>
          Andamos por fé, e não por vista!
        </Text>
      </View>

      {/* Barra de Navegação Inferior */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Igreja")}
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={26} color="#000" />
          <Text style={styles.navButtonText}>Igreja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("BibleAssistant")}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#000" />
          <Text style={styles.navButtonText}>Assistente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Livros")}
          activeOpacity={0.7}
        >
          <Ionicons name="book" size={26} color="#000" />
          <Text style={styles.navButtonText}>Bíblia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilo do Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  animation: {
    width: 200,
    height: 200,
  },

  // Container Principal
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 0,
  },

  // Botão de Notificação
  notificationButton: {
    position: "absolute",
    right: 20,
    top: 40,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: height * 0.04, // 15% da altura da tela
  },

  logo: {
    width: '80%',          // Usa 80% da largura da tela
    marginTop: height * 0.05, // 15% da altura da tela
    maxWidth: 300,         // Largura máxima (opcional)
    height: undefined,     // Altura será calculada automaticamente
    aspectRatio: 1,        // Mantém proporção quadrada (1:1)
    resizeMode: 'contain', // Garante que a imagem inteira será visível
    alignSelf: 'center',   // Centraliza horizontalmente
    flex: 1,               // Ocupa espaço disponível (ajuste conforme necessidade)
    maxHeight: '50%',      // Altura máxima (opcional)
  },

  // Títulos
  titleContainer: {
    alignItems: "center",
    marginTop: height * -0.12, // 15% da altura da tela
  },
  titleHome: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 24,
    color: "#000",
    textAlign: "center",
    paddingBottom:  height * 0.01
  },
  subTitleHome: {
    fontFamily: "Montserrat_300Light_Italic",
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },

  // Barra de Navegação Inferior
  bottomNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#dadada", // Verde escuro
    paddingVertical: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navButtonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#000",
    fontSize: 12,
    marginTop: 5,
  },
});

export default MNDDScreen;