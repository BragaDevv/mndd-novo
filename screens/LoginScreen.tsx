import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { useFonts, Montserrat_500Medium } from "@expo-google-fonts/montserrat";
import UnlockMessageLottie from "../components/UnlockMessageLottie";
import ErrorMessageLottie from "../components/ErrorMessageLottie";

const LoginScreen: React.FC = () => {
  const { user, login, isAdmin, loading } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fontsLoaded] = useFonts({ Montserrat_500Medium });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss(); // Fecha o Teclado
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      await login(email, password); // ← aguarda login
      setShowSuccess(true);         // ← exibe animação

      setTimeout(() => {
        setShowSuccess(false);
        navigation.reset({ index: 0, routes: [{ name: "SendNotification" }] });
      }, 1500); // ← espera a animação acabar para navegar
    } catch {
      setShowError(true);
      setError("Email ou senha inválidos.");
    }
  };


  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Text style={styles.title}>Login Administrativo</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#999"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

      </KeyboardAvoidingView>

      <UnlockMessageLottie
        visible={showSuccess}
        message="Acesso Autorizado"
        onFinish={() => setShowSuccess(false)}
      />

      <ErrorMessageLottie
        visible={showError}
        message="Xiii! Login ou Senha Incorretos"
        onFinish={() => setShowError(false)}
      />
    </View>

  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Montserrat_500Medium",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontFamily: "Montserrat_500Medium",
    color: "#000",
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
