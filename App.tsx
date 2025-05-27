// App.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Text, View, Platform } from "react-native";

import MNDDScreen from "./screens/MNDD";
import HomeScreen from "./screens/HomeScreen";
import BookScreen from "./screens/BookScreen";
import ChapterScreen from "./screens/ChapterScreen";
import VerseScreen from "./screens/VerseScreen";
import ChurchScreen from "./screens/ChurchScreen";
import SendNotificationScreen from "./screens/SendNotificationScreen";
import UsuariosScreen from "@screens/UsuariosScreen";
import LoginScreen from "./screens/LoginScreen";
import FavoritosScreen from "./screens/FavoritosScreen";
import BibleAssistant from "./screens/BibleAssistant";
import EstudosScreen from "./screens/EstudosScreen";
import HarpaScreen from "./screens/HarpaScreen";
import QuestionarioScreen from "./screens/QuestionarioScreen";

import { RootStackParamList } from "./types/types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "./components/ToastConfig";

import registerForPushNotifications from "./services/registerForPushNotifications";
import { AppLoadProvider } from "./context/AppLoadContext";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebaseConfig";
import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";

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

  const [showQuestionario, setShowQuestionario] = useState<boolean | null>(null);
  const [expoToken, setExpoToken] = useState<string | null>(null);

  useEffect(() => {
    const verificarSeTokenExisteNaColecao = async () => {
      if (!expoToken) return;
      try {
        const q = query(collection(db, "usuarios"), where("expoToken", "==", expoToken));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setShowQuestionario(true);
        } else {
          setShowQuestionario(false);
        }
      } catch (error) {
        console.error("Erro ao verificar token no Firestore:", error);
        setShowQuestionario(false);
      }
    };

    verificarSeTokenExisteNaColecao();
  }, [expoToken]);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          console.log("[APP] Token recebido:", token);
          setExpoToken(token);
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log("[APP] Notificação recebida:", notification);
          Toast.show({
            type: "info",
            text1: notification.request.content.title || "Nova notificação",
            text2: notification.request.content.body || undefined,
          });
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("[APP] Usuário interagiu com a notificação:", response);
        });
      } catch (error) {
        console.error("[APP] Erro no setup de notificações:", error);
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
  }) => {
    try {
      const q = query(collection(db, "usuarios"), where("expoToken", "==", expoToken));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, "usuarios"), {
          ...dados,
          expoToken: expoToken || null,
          createdAt: serverTimestamp(),
        });
      }
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
            initialRouteName={showQuestionario ? "Questionario" : "MNDD"}
            screenOptions={{
              headerTitleAlign: "center",
              headerTintColor: "#000",
              headerStyle: { backgroundColor: "#fff" },
            }}
          >
            <Stack.Screen
              name="Questionario"
              children={() => <QuestionarioScreen onComplete={handleQuestionarioComplete} />}
              options={{ title: "Bem vindo ao App MNDD" }}
            />
            <Stack.Screen name="MNDD" component={MNDDScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Livros" component={HomeScreen} options={{ title: "Livros da Bíblia" }} />
            <Stack.Screen name="Capitulos" component={BookScreen} options={({ route }) => ({ title: route.params.bookName })} />
            <Stack.Screen name="Versiculos" component={ChapterScreen} options={({ route }) => ({ title: route.params.bookName })} />
            <Stack.Screen name="Versiculo" component={VerseScreen} options={({ route }) => ({ title: `${route.params.bookName} ${route.params.chapterNumber}:${route.params.verseNumber}` })} />
            <Stack.Screen name="Igreja" component={ChurchScreen} options={{ title: "Nossa Igreja" }} />
            <Stack.Screen name="Usuarios" component={UsuariosScreen} />
            <Stack.Screen name="SendNotification" options={{ title: "ADMINISTRAÇÃO", headerLeft: () => null }}>
              {() => (
                <ProtectedRoute>
                  <SendNotificationScreen />
                </ProtectedRoute>
              )}
            </Stack.Screen>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Acesso Administrativo" }} />
            <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: "Versículos Favoritos" }} />
            <Stack.Screen name="BibleAssistant" component={BibleAssistant} options={{ title: "Assistente Bíblico" }} />
            <Stack.Screen name="EstudosScreen" component={EstudosScreen} options={{ title: "Devocionais" }} />
            <Stack.Screen name="HarpaScreen" component={HarpaScreen} options={{ title: "" }} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </AuthProvider>
    </AppLoadProvider>
  );
};

export default AppNavigator;
