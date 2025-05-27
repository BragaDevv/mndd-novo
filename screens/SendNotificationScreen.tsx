import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useFonts, Montserrat_500Medium } from "@expo-google-fonts/montserrat";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { sendNotificationToAll } from "../services/sendNotificationToAll";
import { sendDailyVerseNotification } from "../services/sendDailyVerseNotification";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import CalendarPicker from "react-native-calendar-picker";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SendNotification"
>;

type Culto = {
  id: string;
  data: string;
  horario: string;
  tipo: string;
  descricao?: string;
  createdAt?: Date;
};

type CarrosselImage = {
  id: string;
  imageBase64: string;
  createdAt: Date;
};

const SendNotificationScreen = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    "notificacoes" | "cultos" | "carrossel"
  >("notificacoes");
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [carrosselImages, setCarrosselImages] = useState<CarrosselImage[]>([]);
  const [novoCulto, setNovoCulto] = useState<Omit<Culto, "id">>({
    data: "",
    horario: "",
    tipo: "Culto de Celebração",
    descricao: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [uploading, setUploading] = useState(false);

  const [fontsLoaded] = useFonts({ Montserrat_500Medium });

  // Carrega cultos do Firestore
  useEffect(() => {
    const cultosRef = collection(db, "cultos");
    const q = query(cultosRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cultosData: Culto[] = [];
      querySnapshot.forEach((doc) => {
        cultosData.push({
          id: doc.id,
          ...doc.data(),
        } as Culto);
      });
      setCultos(cultosData);
    });

    return () => unsubscribe();
  }, []);

  // Carrega imagens do carrossel
  useEffect(() => {
    const carrosselRef = collection(db, "carrossel");
    const q = query(carrosselRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const imagesData: CarrosselImage[] = [];
      querySnapshot.forEach((doc) => {
        imagesData.push({
          id: doc.id,
          ...doc.data(),
        } as CarrosselImage);
      });
      setCarrosselImages(imagesData);
    });

    return () => unsubscribe();
  }, []);

  // Verifica autenticação
  useEffect(() => {
    if (!user || !isAdmin) {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  }, [user, isAdmin, navigation]);

  const handleDateChange = (date: Date) => {
    const formattedDate = date.toLocaleDateString("pt-BR");
    setNovoCulto({ ...novoCulto, data: formattedDate });
    setShowCalendar(false);
  };

  const handleTimePress = () => {
    const initialTime = novoCulto.horario
      ? new Date(`1970-01-01T${novoCulto.horario}:00`)
      : new Date();

    setTempTime(initialTime);
    setShowTimePicker(true);
    setShowCalendar(false);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (selectedTime) {
        const formattedTime = selectedTime.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setNovoCulto({ ...novoCulto, horario: formattedTime });
      }
    } else {
      if (selectedTime) {
        setTempTime(selectedTime);
      }
    }
  };

  const handleConfirmTime = () => {
    setShowTimePicker(false);
    const formattedTime = tempTime.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNovoCulto({ ...novoCulto, horario: formattedTime });
  };

  const handleCancelTime = () => {
    setShowTimePicker(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      // 1. Comprime a imagem
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Redimensiona para largura máxima
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Converte para Base64
      const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Verifica o tamanho
      const sizeInBytes = (base64.length * 3) / 4; // Tamanho aproximado em bytes
      if (sizeInBytes > 1000000) {
        // 1MB
        throw new Error("Imagem muito grande mesmo após compressão");
      }

      await addDoc(collection(db, "carrossel"), {
        imageBase64: `data:image/jpeg;base64,${base64}`,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sucesso", "Imagem adicionada ao carrossel!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      Alert.alert("Erro", "Falha ao adicionar imagem");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "carrossel", id));
      Alert.alert("Sucesso", "Imagem removida!");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      Alert.alert("Erro", "Falha ao remover imagem");
    }
  };

  const sendNotification = async () => {
    if (!title || !message) {
      Alert.alert("Erro", "Título e mensagem são obrigatórios.");
      return;
    }

    try {
      const response = await fetch("https://mndd-backend.onrender.com/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: message }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Notificações enviadas com sucesso!");
        setTitle("");
        setMessage("");
      } else {
        console.error("[APP] Erro:", data.error);
        Alert.alert("Erro", "Falha ao enviar notificação.");
      }
    } catch (error) {
      console.error("[APP] Erro na requisição:", error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };


  const handleSendDailyVerse = async () => {
    try {
      const response = await fetch("https://mndd-backend.onrender.com/versiculo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });


      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Versículo do dia enviado!");
      } else {
        console.error("[APP] Erro ao enviar versículo:", data.error);
        Alert.alert("Erro", "Falha ao enviar versículo");
      }
    } catch (error) {
      console.error("[APP] Erro na requisição:", error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
    }
  };


  const adicionarCulto = async () => {
    if (!novoCulto.data || !novoCulto.horario || !novoCulto.tipo) {
      Alert.alert("Erro", "Preencha todos os campos do culto");
      return;
    }

    try {
      await addDoc(collection(db, "cultos"), {
        ...novoCulto,
        createdAt: serverTimestamp(),
      });

      setNovoCulto({
        data: "",
        horario: "",
        tipo: "Culto de Celebração",
        descricao: "",
      });
      Alert.alert("Sucesso", "Culto adicionado");
    } catch (error) {
      console.error("Erro ao adicionar culto:", error);
      Alert.alert("Erro", "Falha ao adicionar culto");
    }
  };

  const removerCulto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "cultos", id));
      Alert.alert("Sucesso", "Culto removido!");
    } catch (error) {
      console.error("Erro ao remover culto:", error);
      Alert.alert("Erro", "Falha ao remover culto");
    }
  };

  const logoutAndRedirect = async () => {
    await logout();
    navigation.replace("MNDD");
  };

  if (!fontsLoaded || !user) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Abas */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "notificacoes" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("notificacoes")}
              >
                <Text style={styles.tabText}>Notificações</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "cultos" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("cultos")}
              >
                <Text style={styles.tabText}>Cultos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "carrossel" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("carrossel")}
              >
                <Text style={styles.tabText}>Carrossel</Text>
              </TouchableOpacity>
            </View>

            {/* Conteúdo das Abas */}
            {activeTab === "notificacoes" ? (
              <>
                <Text style={styles.label}>Título:</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Digite o título"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Mensagem:</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Digite a mensagem"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={sendNotification}
                >
                  <Text style={styles.buttonText}>Enviar Notificação</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#0066cc" }]}
                  onPress={handleSendDailyVerse}
                >
                  <Text style={styles.buttonText}>📖 Versículo do Dia</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => navigation.navigate("Usuarios")}
                >
                  <Text style={styles.buttonText}>Usuários</Text>
                </TouchableOpacity>

              </>
            ) : activeTab === "cultos" ? (
              <>
                <Text style={styles.label}>Data:</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setShowCalendar(!showCalendar)}
                >
                  <Text style={styles.dateInputText}>
                    {novoCulto.data || "Selecione uma data"}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#555" />
                </TouchableOpacity>

                {showCalendar && (
                  <View style={styles.calendarContainer}>
                    <CalendarPicker
                      onDateChange={handleDateChange}
                      selectedDayColor="#075E54"
                      selectedDayTextColor="#FFFFFF"
                      minDate={new Date()}
                      weekdays={[
                        "Dom",
                        "Seg",
                        "Ter",
                        "Qua",
                        "Qui",
                        "Sex",
                        "Sáb",
                      ]}
                      months={[
                        "Janeiro",
                        "Fevereiro",
                        "Março",
                        "Abril",
                        "Maio",
                        "Junho",
                        "Julho",
                        "Agosto",
                        "Setembro",
                        "Outubro",
                        "Novembro",
                        "Dezembro",
                      ]}
                      previousComponent={
                        <MaterialIcons
                          name="chevron-left"
                          size={24}
                          color="#075E54"
                        />
                      }
                      nextComponent={
                        <MaterialIcons
                          name="chevron-right"
                          size={24}
                          color="#075E54"
                        />
                      }
                    />
                  </View>
                )}

                <Text style={styles.label}>Horário:</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={handleTimePress}
                >
                  <Text style={styles.dateInputText}>
                    {novoCulto.horario || "Selecione o horário"}
                  </Text>
                  <MaterialIcons name="access-time" size={20} color="#555" />
                </TouchableOpacity>

                {showTimePicker && (
                  <View style={styles.timePickerContainer}>
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      is24Hour={true}
                      display={Platform.OS === "ios" ? "spinner" : "clock"}
                      onChange={handleTimeChange}
                    />

                    {Platform.OS === "ios" && (
                      <View style={styles.iosTimeButtons}>
                        <TouchableOpacity
                          style={styles.iosTimeButton}
                          onPress={handleCancelTime}
                        >
                          <Text style={styles.iosTimeButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.iosTimeButton,
                            styles.iosTimeButtonConfirm,
                          ]}
                          onPress={handleConfirmTime}
                        >
                          <Text
                            style={[
                              styles.iosTimeButtonText,
                              styles.iosTimeButtonConfirmText,
                            ]}
                          >
                            Confirmar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.label}>Tipo de Culto:</Text>
                <TextInput
                  style={styles.input}
                  value={novoCulto.tipo}
                  onChangeText={(text) =>
                    setNovoCulto({ ...novoCulto, tipo: text })
                  }
                  placeholder="Ex: Culto de Oração"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Descrição (Opcional):</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={novoCulto.descricao}
                  onChangeText={(text) =>
                    setNovoCulto({ ...novoCulto, descricao: text })
                  }
                  placeholder="Descrição adicional sobre o culto"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={adicionarCulto}
                >
                  <Text style={styles.buttonText}>Salvar Culto</Text>
                </TouchableOpacity>

                <View style={styles.listContainer}>
                  <Text style={styles.sectionTitle}>Cultos Programados</Text>
                  <View style={styles.listContent}>
                    {cultos.length > 0 ? (
                      cultos.map((item) => (
                        <View key={item.id} style={styles.cultoItemContainer}>
                          <TouchableOpacity
                            style={styles.cultoItem}
                            activeOpacity={0.7}
                          >
                            <View style={styles.cultoInfo}>
                              <Text style={styles.cultoText}>{item.tipo}</Text>
                              <Text style={styles.cultoSubText}>
                                {item.data} às {item.horario}
                              </Text>
                              {item.descricao && (
                                <Text style={styles.cultoDescricao}>
                                  {item.descricao}
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity
                              onPress={() => removerCulto(item.id)}
                              style={styles.deleteButton}
                            >
                              <MaterialIcons
                                name="delete"
                                size={24}
                                color="#ff4444"
                              />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        Nenhum culto programado
                      </Text>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Adicionar Imagem ao Carrossel</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#4CAF50" }]}
                  onPress={pickImage}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <FontAwesome
                        name="photo"
                        size={20}
                        color="#fff"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>Selecionar Imagem</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.listContainer}>
                  <Text style={styles.sectionTitle}>Imagens do Carrossel</Text>
                  <View style={styles.listContent}>
                    {carrosselImages.length > 0 ? (
                      carrosselImages.map((item) => (
                        <View key={item.id} style={styles.imageItemContainer}>
                          <Image
                            source={{ uri: item.imageBase64 }}
                            style={styles.carrosselImage}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.deleteImageButton}
                            onPress={() => removeImage(item.id)}
                          >
                            <MaterialIcons
                              name="delete"
                              size={24}
                              color="#ff4444"
                            />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        Nenhuma imagem no carrossel
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logoutAndRedirect}
            >
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tabButton: {
    padding: 5,
    alignItems: "center",
    flex: 1,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: "#000",
  },
  tabText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
  },
  label: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    marginBottom: 8,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    color: "#000",
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    color: "#000",
  },
  calendarContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
    backgroundColor: "#fff",
  },
  timePickerContainer: {
    backgroundColor: Platform.OS === "ios" ? "#f5f5f5" : "transparent",
    borderRadius: Platform.OS === "ios" ? 10 : 0,
    overflow: "hidden",
    marginBottom: Platform.OS === "ios" ? 20 : 0,
  },
  iosTimeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  iosTimeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  iosTimeButtonConfirm: {
    backgroundColor: "#075E54",
  },
  iosTimeButtonText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    color: "#333",
  },
  iosTimeButtonConfirmText: {
    color: "#fff",
  },
  multilineInput: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#fff",
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
    width: "100%",
  },
  listContent: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    padding: 10,
    minHeight: 150,
  },
  cultoItemContainer: {
    width: "100%",
  },
  cultoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#dadada",
  },
  cultoInfo: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 4,
  },
  sectionTitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  cultoText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
  },
  cultoSubText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#666",
  },
  cultoDescricao: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  imageItemContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
    elevation: 2,
  },
  carrosselImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: 5,
  },
});

export default SendNotificationScreen;
