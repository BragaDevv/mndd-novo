// ✅ Página atualizada: SendNotificationScreen.tsx com botões quadrados no lugar das labels para acessar conteúdo das abas

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useFonts, Montserrat_500Medium } from "@expo-google-fonts/montserrat";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AreaAdm"
>;

const SendNotificationScreen = () => {
  const { logout, isAdmin, user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [fontsLoaded] = useFonts({ Montserrat_500Medium });

  if (!fontsLoaded || !user) return null;

  const botao = (
    label: string,
    icon: keyof typeof FontAwesome.glyphMap,
    tela: keyof RootStackParamList
  ) => (
    <TouchableOpacity
      style={styles.cardButton}
      onPress={() => navigation.navigate(tela as any)} // ⚠️ tipo forçado
    >
      <FontAwesome name={icon} size={32} color="#fff" />
      <Text style={styles.cardText}>{label}</Text>
    </TouchableOpacity>
  );
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Painel Administrativo</Text>
      <View style={styles.grid}>
        {botao("Notificações", "bell", "AdmNotificacao")}
        {botao("Cultos", "building", "AdmCultos")}
        {botao("Imagens", "picture-o", "AdmImagens")}
        {botao("Avisos", "exclamation-triangle", "AdmAvisos")}
        {botao("Usuários", "users", "AdmUsuarios")}
        {botao("Devocional", "book", "AdmDevocional")}
        {botao("Logs", "folder-open", "AdmLogsScreen")}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            navigation.replace("MNDD");
          }}
        >
          <Ionicons name="exit" size={42} color="#fff" />
          <Text style={styles.logoutButtonText}>Sair / Logout</Text>
        </TouchableOpacity>

      </View>
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
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    marginTop: Platform.select({
      android: 0,
      ios: 0,
    }),
    fontFamily: "Montserrat_500Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardButton: {
    width: width / 2 - 30,
    aspectRatio: 1,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  cardText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    width: width / 2 - 30,
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutButtonText: {
    color: "#fff",
    marginTop: 2,
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
});

export default SendNotificationScreen;
