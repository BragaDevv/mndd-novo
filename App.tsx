// App.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Text, View, Platform } from "react-native";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getDoc,
  query,
  where,
  getDocs,
  collection,
  setDoc,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";

import MNDDScreen from "./screens/MNDD";
import LivrosScreen from "./screens/LivrosScreen";
import CapitulosScreen from "./screens/CapitulosScreen";
import VersiculosScreen from "./screens/VersiculosScreen";
import VersiculoScreen from "./screens/VersiculoScreen";
import IgrejaScreen from "./screens/IgrejaScreen";
import AreaAdmScreen from "./screens/AreaAdm";
import UsuariosScreen from "@screens/UsuariosScreen";
import ImagensScreen from "@screens/ImagensScreen";
import CultosScreen from "@screens/CultosScreen";
import NotificacaoScreen from "@screens/NotificacaoScreen";
import LoginScreen from "./screens/LoginScreen";
import FavoritosScreen from "./screens/FavoritosScreen";
import BibleAssistant from "./screens/BibleAssistant";
import EstudosScreen from "./screens/EstudosScreen";
import HarpaScreen from "./screens/HarpaScreen";
import QuestionarioScreen from "./screens/QuestionarioScreen";
import QuizScreen from "./screens/QuizScreen";
import RankingScreen from "./screens/RankingScreen";

import { RootStackParamList } from "./types/types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import registerForPushNotifications from "./services/registerForPushNotifications";
import { AppLoadProvider } from "./context/AppLoadContext";
import { db } from "./firebaseConfig";

const Stack = createNativeStackNavigator<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};

const AppNavigator = () => {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const navigationRef = useRef<any>(null);

  const [showQuestionario, setShowQuestionario] = useState<boolean | null>(
    null
  );
  const [expoToken, setExpoToken] = useState<string | null>(null);

useEffect(() => {
  const checkUserByToken = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      setExpoToken(token);
      await AsyncStorage.setItem("expoPushToken", token); // ✅ SALVA LOCALMENTE
      console.log("✅ Token Salvo Localmente");

      const q = query(
        collection(db, "usuarios"),
        where("expoToken", "==", token)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log("✅ Token encontrado, pulando questionário");
        setShowQuestionario(false);
      } else {
        console.log("🆕 Token não encontrado, exibindo questionário");
        setShowQuestionario(true);
      }
    }
  };

  checkUserByToken();
}, []);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            Toast.show({
              type: "info",
              text1: notification.request.content.title || "Nova notificação",
              text2: notification.request.content.body || undefined,
            });
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("[APP] Notificação clicada:", response);
          });
      } catch (error) {
        console.error("[APP] Erro ao configurar notificações:", error);
      }
    };

    setupNotifications();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const handleQuestionarioComplete = async (dados: {
    nome: string;
    sobrenome: string;
    dataNascimento: string;
    membro: boolean;
    telefone?: string;
    endereco?: string;
    uid?: string;
  }) => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await setDoc(doc(db, "usuarios", uid), {
        uid,
        ...dados,
        expoToken: expoToken || null,
        createdAt: new Date(),
      });

      await AsyncStorage.setItem("usuarioUID", uid);

      setShowQuestionario(false);
      navigationRef.current?.resetRoot({
        index: 0,
        routes: [{ name: "MNDD" }],
      });
    } catch (error) {
      console.error("Erro ao salvar dados do questionário:", error);
    }
  };

  if (showQuestionario === null) return null;

  return (
    <AppLoadProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerTitleAlign: "center",
              headerTintColor: "#000",
              headerStyle: { backgroundColor: "#fff" },
              headerBackTitle: "Voltar", //
            }}
          >
            {showQuestionario ? (
              <Stack.Screen
                name="Questionario"
                children={() => (
                  <QuestionarioScreen onComplete={handleQuestionarioComplete} />
                )}
                options={{ headerShown: false }}
              />
            ) : (
              <>
                <Stack.Screen
                  name="MNDD"
                  component={MNDDScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Livros"
                  component={LivrosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Capitulos"
                  component={CapitulosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Versiculos"
                  component={VersiculosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Versiculo"
                  component={VersiculoScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Igreja"
                  component={IgrejaScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Usuarios"
                  component={UsuariosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Carrossel"
                  component={ImagensScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Cultos"
                  component={CultosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Notificacao"
                  component={NotificacaoScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="AreaAdm"
                  options={{ title: "", headerLeft: () => null }}
                >
                  {() => (
                    <ProtectedRoute>
                      <AreaAdmScreen />
                    </ProtectedRoute>
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="Favoritos"
                  component={FavoritosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="BibleAssistant"
                  component={BibleAssistant}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="EstudosScreen"
                  component={EstudosScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen
                  name="HarpaScreen"
                  component={HarpaScreen}
                  options={{ title: "" }}
                />
                <Stack.Screen name="Quiz" component={QuizScreen}options={{ title: "" }} />
                <Stack.Screen name="Ranking" component={RankingScreen} options={{ title: "", headerShown: false  }}/>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </AppLoadProvider>
  );
};

export default AppNavigator;
