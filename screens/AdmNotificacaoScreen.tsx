// ✅ Tela 'SendNotificationForm' com envio manual, versículo do dia e agendamento de horário

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import SuccessMessageLottie from "../components/SuccessMessageLottie";
import LoadingMessageLottie from "../components/LoadingMessageLottie";
import { useAuth } from "../context/AuthContext";
import { registrarAcaoADM } from "@services/logAction";

const SendNotificationForm = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "AdmNotificacao">
    >();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [horaSalva, setHoraSalva] = useState<string>("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();


  useEffect(() => {
    const fetchHorario = async () => {
      try {
        const response = await fetch(
          "https://mndd-backend.onrender.com/versiculo-hora"
        );
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/json")) {
          throw new Error("Resposta não é JSON válida");
        }
        const data = await response.json();
        if (data?.hora) {
          setHoraSalva(data.hora);

          const [hh, mm] = data.hora.split(":").map(Number);
          const novaData = new Date();
          novaData.setHours(hh);
          novaData.setMinutes(mm);
          novaData.setSeconds(0);
          setSelectedTime(new Date(novaData));
          setTempTime(new Date(novaData));
        }
      } catch (err) {
        console.log("Erro ao buscar horário salvo:", err);
      }
    };
    fetchHorario();
  }, []);


  const sendNotification = async () => {
    if (!title || !message) {
      Alert.alert("Erro", "Preencha o título e a mensagem.");
      return;
    }

    setLoading(true);
    setShowSuccess(false);

    try {
      const response = await fetch("https://mndd-backend.onrender.com/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: message }),
      });

      const data = await response.json();
      if (response.ok) {
        const enviados = data.sent ?? 0;
        setTitle("");
        setMessage("");
        setShowSuccess(true);
        if (user?.email && message.trim()) {
          await registrarAcaoADM(
            user.email,
            `Enviou uma Notificação Geral: "${message.trim()}"`
          );
        }
      } else {
        Alert.alert("Erro", data.error || "Falha no envio.");
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      Alert.alert("Erro", "Falha ao conectar ao servidor.");
    } finally {
      setLoading(false);
      setTimeout(() => setShowSuccess(false), 2000); // Esconde sucesso após 2s
    }
  };

  const salvarHorarioVersiculo = async () => {
    const horas = selectedTime.getHours().toString().padStart(2, "0");
    const minutos = selectedTime.getMinutes().toString().padStart(2, "0");
    const horaFinal = `${horas}:${minutos}`;

    setLoading(true);
    try {
      const response = await fetch(
        "https://mndd-backend.onrender.com/versiculo-hora",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hora: horaFinal }),
        }
      );

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Resposta não é JSON válida");
      }

      const data = await response.json();
      if (response.ok) {
        setHoraSalva(horaFinal);
        setSelectedTime(new Date(tempTime));
        Alert.alert("Sucesso", `Horário salvo: ${horaFinal}`);
        if (user?.email && horaFinal.trim()) {
          await registrarAcaoADM(
            user.email,
            `Alterou a hora de Versiculo Diário para: "${horaFinal.trim()}"`
          );
        }
      } else {
        Alert.alert("Erro", data.error || "Erro ao salvar horário.");
      }
    } catch (error) {
      console.error("Erro ao salvar horário:", error);
      Alert.alert("Erro", "Falha ao salvar horário.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (_event: any, selected?: Date) => {
    if (selected) setTempTime(selected);
  };

  const handleConfirmTime = () => {
    setSelectedTime(tempTime);
    setShowTimePicker(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.sectionNotif}>
              <Text style={styles.title}>Notificação Geral </Text>

              <TextInput
                style={styles.input}
                placeholder="Título"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mensagem"
                value={message}
                onChangeText={setMessage}
                placeholderTextColor="#999"
                multiline
              />

              <TouchableOpacity
                style={styles.button}
                onPress={sendNotification}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Enviando..." : "Enviar Notificação"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionHora}>
              <View style={styles.timeSection}>
                <Text style={styles.title}>Horário do versículo diário</Text>

                <Text style={{ textAlign: "center", marginBottom: 10 }}>
                  Horário atual salvo: {horaSalva || "Carregando..."}
                </Text>

                <TouchableOpacity
                  style={[styles.dateInputContainer]}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <Text style={styles.dateInputText}>
                    {selectedTime
                      ? selectedTime.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "Carregando..."}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <View style={styles.inlineTimePickerRow}>
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "clock"}
                      is24Hour
                      onChange={handleTimeChange}
                      style={{ flex: 1 }}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        style={styles.inlineButton}
                        onPress={handleConfirmTime}
                      >
                        <Text style={styles.buttonText}>OK</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.inlineButton}
                onPress={salvarHorarioVersiculo}
              >
                <Text style={styles.buttonText}>Salvar Horário 💾</Text>
              </TouchableOpacity>
            </View>


          </ScrollView>

          <LoadingMessageLottie
            visible={loading}
            message="Aguarde ..."
            onFinish={() => setShowSuccess(false)}
          />

          <SuccessMessageLottie
            visible={showSuccess}
            message="Notificação Enviada com Sucesso !"
            onFinish={() => setShowSuccess(false)}
          />

        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },

  sectionNotif: {
    padding: 10,
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: Platform.select({
      android: 25,
      ios: 0,
    }),
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Montserrat_500Medium",
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#007AFF",
    fontSize: 16,
  },

  sectionHora: {
    padding: 10,
    borderStyle: "solid",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 30,
  },

  timeSection: {
    marginTop: 5,
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
    fontSize: 16,
    color: "#000",
  },
  inlineTimePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inlineButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

});

export default SendNotificationForm;
