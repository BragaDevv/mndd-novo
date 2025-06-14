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
  Dimensions,
} from "react-native";
import { useFonts, Montserrat_500Medium } from "@expo-google-fonts/montserrat";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import CalendarPicker from "react-native-calendar-picker";
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
import { Picker } from "@react-native-picker/picker";
import { registrarAcaoADM } from "@services/logAction";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

type Culto = {
  id: string;
  data: string;
  horario: string;
  tipo: string;
  descricao?: string;
  local?: string;
};

const CultosScreen = () => {
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [mostrarPickerLocal, setMostrarPickerLocal] = useState(false);
  const [novoCulto, setNovoCulto] = useState<Omit<Culto, "id">>({
    data: "",
    horario: "",
    tipo: "Culto de Celebração",
    descricao: "",
    local: "",
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [fontsLoaded] = useFonts({ Montserrat_500Medium });
  const { user } = useAuth();

  useEffect(() => {
    const cultosRef = collection(db, "cultos");
    const q = query(cultosRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cultosData: Culto[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Culto, "id">;
        cultosData.push({ id: doc.id, ...data });
      });
      setCultos(cultosData);
    });

    return () => unsubscribe();
  }, []);

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

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (selectedTime) {
        const formattedTime = selectedTime.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setNovoCulto({ ...novoCulto, horario: formattedTime });
      }
    } else if (selectedTime) {
      setTempTime(selectedTime);
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

  const adicionarCulto = async () => {
    if (!novoCulto.data || !novoCulto.horario || !novoCulto.tipo || !novoCulto.local) {
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
        local: "",
      });
      Alert.alert("Sucesso", "Culto adicionado");
      if (user?.email) {
        await registrarAcaoADM(user.email, "Criou um Culto");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar culto");
    }
  };

  const removerCulto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "cultos", id));
      Alert.alert("Sucesso", "Culto removido!");
      if (user?.email) {
        await registrarAcaoADM(user.email, "Removeu um Culto");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao remover culto");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adicionar Cultos</Text>

      {/* Data */}
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
        <CalendarPicker
          onDateChange={handleDateChange}
          selectedDayColor="#075E54"
          selectedDayTextColor="#FFF"
          minDate={new Date()}
          weekdays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
          months={[
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ]}
          previousComponent={<MaterialIcons name="chevron-left" size={24} color="#075E54" />}
          nextComponent={<MaterialIcons name="chevron-right" size={24} color="#075E54" />}
        />
      )}

      {/* Horário */}
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
        <>
          <DateTimePicker
            value={tempTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            onChange={handleTimeChange}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity style={styles.button} onPress={handleConfirmTime}>
              <Text style={styles.buttonText}>Confirmar Horário</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Tipo de Culto */}
      <TextInput
        style={styles.input}
        placeholder="Tipo de Culto"
        value={novoCulto.tipo}
        onChangeText={(text) => setNovoCulto({ ...novoCulto, tipo: text })}
        placeholderTextColor="#999"
      />

      {/* Local (TextInput simulando picker) */}
      <TouchableOpacity
        style={styles.dateInputContainer}
        onPress={() => setMostrarPickerLocal(true)}
      >
        <Text style={styles.dateInputText}>
          {novoCulto.local || "Selecione o local"}
        </Text>
        <MaterialIcons name="location-on" size={20} color="#555" />
      </TouchableOpacity>

      {mostrarPickerLocal && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={novoCulto.local}
            onValueChange={(itemValue: string) => {
              setNovoCulto({ ...novoCulto, local: itemValue });
              setMostrarPickerLocal(false);
            }}
          >
            <Picker.Item label="Continental 2" value="Continental 2" />
            <Picker.Item label="Jd Tranquilidade" value="Jd Tranquilidade" />
          </Picker>
        </View>
      )}

      {/* Descrição */}
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descrição (opcional)"
        value={novoCulto.descricao}
        onChangeText={(text) => setNovoCulto({ ...novoCulto, descricao: text })}
        multiline
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={adicionarCulto}>
        <Text style={styles.buttonText}>Salvar Culto</Text>
      </TouchableOpacity>

      {/* Lista de Cultos */}
      <Text style={styles.sectionTitle}>Cultos Programados</Text>
      {cultos.map((culto) => (
        <View key={culto.id} style={styles.cultoItem}>
          <View>
            <Text style={styles.cultoText}>{culto.tipo}</Text>
            <Text>{culto.data} às {culto.horario}</Text>
            {!!culto.local && (
              <Text>
                <MaterialIcons name="location-on" size={14} color="#555" /> {culto.local}
              </Text>
            )}
            {!!culto.descricao && <Text>{culto.descricao}</Text>}
          </View>
          <TouchableOpacity onPress={() => removerCulto(culto.id)}>
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    marginTop: Platform.select({
      android: 0,
      ios: 0,
    }),
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cultoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  cultoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
  },
});

export default CultosScreen;
