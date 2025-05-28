import { useAuth } from "../context/AuthContext";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";


const { height } = Dimensions.get("window");

const MNDDScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "MNDD">>();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [membro, setMembro] = useState<"sim" | "nao" | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const [nomeUsuario, setNomeUsuario] = useState<string>("");

  useEffect(() => {
    const carregarNome = async () => {
      try {
        const uid = await AsyncStorage.getItem("usuarioUID");
        if (uid) {
          const docRef = doc(db, "usuarios", uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setNomeUsuario(docSnap.data().nome || "");
          }
        }
      } catch (error) {
        console.log("Erro ao carregar nome do usuário:", error);
      }
    };

    carregarNome();
  }, []);


  const handleOpenModal = async () => {
    try {
      const tokenInfo = await Notifications.getExpoPushTokenAsync();
      const expoToken = tokenInfo.data;

      if (!expoToken) {
        console.log("❌ Token não disponível.");
        return;
      }

      console.log("🔍 Buscando dados para Token:", expoToken);

      const q = query(collection(db, "usuarios"), where("expoToken", "==", expoToken));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        console.log("📥 Dados carregados:", data);
        setNome(data.nome || "");
        setSobrenome(data.sobrenome || "");
        setDataNascimento(data.dataNascimento || "");
        setTelefone(data.telefone || "");
        setEndereco(data.endereco || "");
        setMembro(data.membro === true ? "sim" : data.membro === false ? "nao" : null);
      } else {
        console.log("❌ Documento de usuário não encontrado.");
      }

      // Abre o modal com animação
      fadeAnim.setValue(0);
      setShowModal(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error("🔥 Erro ao carregar dados do Firebase:", error);
    }
  };




  const validateForm = () => {
    if (!nome || !sobrenome || !dataNascimento) {
      Alert.alert("Erro", "Preencha os campos obrigatórios: Nome, Sobrenome e Telefone");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const tokenInfo = await Notifications.getExpoPushTokenAsync();
      const expoToken = tokenInfo.data;

      if (!expoToken) {
        Alert.alert("Erro", "Token não disponível.");
        return;
      }

      const q = query(collection(db, "usuarios"), where("expoToken", "==", expoToken));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Atualiza o documento existente
        const docRef = snapshot.docs[0].ref;
        await setDoc(docRef, {
          nome,
          sobrenome,
          dataNascimento,
          telefone,
          endereco,
          membro: membro === "sim",
          atualizadoEm: new Date(),
          expoToken,
        });
      } else {
        // Cria novo documento
        await setDoc(doc(db, "usuarios", expoToken), {
          nome,
          sobrenome,
          dataNascimento,
          telefone,
          endereco,
          membro: membro === "sim",
          criadoEm: new Date(),
          expoToken,
        });
      }

      Alert.alert("Sucesso", "Informações salvas com sucesso!");
      fadeAnim.setValue(0);
      setShowModal(false);
    } catch (error) {
      console.error("🔥 Erro ao salvar os dados:", error);
      Alert.alert("Erro", "Não foi possível salvar os dados.");
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
      <TouchableOpacity
        style={[styles.notificationButton, { left: 20, right: undefined }]}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={28} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.notificationButton}
        onPress={handleLockPress}
        activeOpacity={0.7}
      >
        <Fontisto name={isAdmin ? "unlocked" : "locked"} size={28} color="#000" />
      </TouchableOpacity>

      <Image
        style={styles.logo}
        source={require("../assets/logo_sem_fundo.png")}
        resizeMode="contain"
      />

      <View style={styles.titleContainer}>
        <Text style={styles.titleHome}>Ministério Nascido de Deus</Text>
        <Text style={styles.subTitleHome}>Andamos por fé, e não por vista!</Text>
      </View>

      {nomeUsuario ? (
        <Text style={styles.boasVindas}>Seja bem-vindo {nomeUsuario}</Text>
      ) : null}


      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Igreja")}>
          <Ionicons name="home" size={26} color="#000" />
          <Text style={styles.navButtonText}>Igreja</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("BibleAssistant")}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#000" />
          <Text style={styles.navButtonText}>Assistente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Livros")}>
          <Ionicons name="book" size={26} color="#000" />
          <Text style={styles.navButtonText}>Bíblia</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView>
                  <Text style={styles.modalTitle}>Editar suas informações</Text>
                  <Text style={styles.label}>Nome*</Text>
                  <TextInput style={styles.modalInput} placeholder="Nome" placeholderTextColor="#999" value={nome} onChangeText={setNome} />
                  <Text style={styles.label}>Sobrenome*</Text>
                  <TextInput style={styles.modalInput} placeholder="Sobrenome" placeholderTextColor="#999" value={sobrenome} onChangeText={setSobrenome} />

                  <Text style={styles.label}>Data de Nascimento*</Text>
                  <MaskedTextInput
                    mask="99/99/9999"
                    style={styles.modalInput}
                    placeholder="Data de Nascimento (DD/MM/AAAA)"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={dataNascimento}
                    onChangeText={(text, rawText) => setDataNascimento(text)}
                  />
                  <Text style={styles.label}>Telefone</Text>
                  <MaskedTextInput
                    mask="(99) 99999-9999"
                    style={styles.modalInput}
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                    placeholder="(00) 00000-0000"
                  />
                  
                  <Text style={styles.label}>Endereço</Text>
                  <TextInput style={styles.modalInput} placeholder="Endereço" placeholderTextColor="#999" value={endereco} onChangeText={setEndereco} />


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

                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#ccc" }]} onPress={() => {
                      fadeAnim.setValue(0);
                      setShowModal(false);
                    }}>
                      <Text style={styles.modalButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
                      <Text style={styles.modalButtonText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 0,
  },
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
    marginTop: height * 0.04,
  },
  logo: {
    width: "80%",
    marginTop: height * 0.05,
    maxWidth: 300,
    height: undefined,
    aspectRatio: 1,
    resizeMode: "contain",
    alignSelf: "center",
    flex: 1,
    maxHeight: "50%",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: height * -0.12,
  },
  titleHome: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 24,
    color: "#000",
    textAlign: "center",
    paddingBottom: height * 0.01,
  },
  subTitleHome: {
    fontFamily: "Montserrat_300Light_Italic",
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },

  boasVindas: {
    fontStyle: 'italic',
    fontSize: 16,
    color: "#0003",
    marginTop: 10,
    textAlign: "center",
  },

  bottomNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#dadada",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: "#000",
  },
  modalToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#075E54",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default MNDDScreen;
