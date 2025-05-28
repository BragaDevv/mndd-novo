// screens/QuestionarioScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { getAuth, signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

interface Props {
  onComplete: (dados: {
    nome: string;
    sobrenome: string;
    dataNascimento: string;
    membro: boolean;
    telefone?: string;
    endereco?: string;
    uid?: string;
  }) => void;
}

const QuestionarioScreen: React.FC<Props> = ({ onComplete }) => {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [membro, setMembro] = useState<"sim" | "nao" | null>(null);

  const ensureAnonAuth = async (): Promise<string> => {
    const auth = getAuth();
    if (auth.currentUser) {
      console.log("✅ Usuário já autenticado:", auth.currentUser.uid);
      return auth.currentUser.uid;
    }
    const result = await signInAnonymously(auth);
    console.log("🔐 Novo usuário anônimo:", result.user.uid);
    return result.user.uid;
  };

  const handleSubmit = async () => {
    if (!nome || !sobrenome || !dataNascimento || membro === null) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const uid = await ensureAnonAuth();
      const token = await Notifications.getExpoPushTokenAsync();

      await setDoc(doc(db, "usuarios", uid), {
        uid,
        nome,
        sobrenome,
        dataNascimento,
        membro: membro === "sim",
        telefone,
        endereco,
        expoToken: token.data,
        createdAt: new Date(),
      });

      await AsyncStorage.setItem("usuarioUID", uid);

      onComplete({
        nome,
        sobrenome,
        dataNascimento,
        membro: membro === "sim",
        telefone,
        endereco,
        uid,
      });

      Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require("../assets/logo_sem_fundo.png")} style={styles.logo} />

        <Text style={styles.label}>Nome*</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Digite seu nome" />

        <Text style={styles.label}>Sobrenome*</Text>
        <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} placeholder="Digite seu sobrenome" />

        <Text style={styles.label}>Data de Nascimento*</Text>
        <MaskedTextInput
          mask="99/99/9999"
          style={styles.input}
          value={dataNascimento}
          onChangeText={setDataNascimento}
          keyboardType="numeric"
          placeholder="DD/MM/AAAA"
        />

        <Text style={styles.label}>Telefone</Text>
        <MaskedTextInput
          mask="(99) 99999-9999"
          style={styles.input}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          placeholder="(00) 00000-0000"
        />

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} placeholder="Digite seu endereço" />

        <Text style={styles.label}>Você é membro da igreja?*</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity style={styles.radioButton} onPress={() => setMembro("sim")}> 
            <MaterialIcons name={membro === "sim" ? "radio-button-checked" : "radio-button-unchecked"} size={24} color="#000" />
            <Text style={styles.radioText}>Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioButton} onPress={() => setMembro("nao")}> 
            <MaterialIcons name={membro === "nao" ? "radio-button-checked" : "radio-button-unchecked"} size={24} color="#000" />
            <Text style={styles.radioText}>Não</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <FontAwesome5 name="check" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Enviar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: {
    width: "60%",
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioText: {
    marginLeft: 8,
    fontSize: 16,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default QuestionarioScreen;
