// App.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Text, View, Platform } from "react-native";

import MNDDScreen from "./screens/MNDD";
import HomeScreen from "./screens/HomeScreen";
import BookScreen from "./screens/BookScreen";
import ChapterScreen from "./screens/ChapterScreen";
import VerseScreen from "./screens/VerseScreen";
import ChurchScreen from "./screens/ChurchScreen";
import SendNotificationScreen from "./screens/SendNotificationScreen";
import LoginScreen from "./screens/LoginScreen";
import FavoritosScreen from "./screens/FavoritosScreen";
import BibleAssistant from "./screens/BibleAssistant";
import EstudosScreen from "./screens/EstudosScreen";
import HarpaScreen from "./screens/HarpaScreen";

import { RootStackParamList } from "./types/types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "./components/ToastConfig";

import registerForPushNotifications from "./services/registerForPushNotifications";
import { saveExpoPushToken } from "./services/pushTokenStorage";
import { AppLoadProvider } from "./context/AppLoadContext";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuração inicial das notificações
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

useEffect(() => {
  const setupNotifications = async () => {
    try {
      // 1. Solicita permissão e gera token
      const token = await registerForPushNotifications();
      if (token) {
        console.log("[APP] Token recebido:", token);
        await saveExpoPushToken(token, {
          deviceName: Device.deviceName || null,
          platform: Platform.OS,
        });
        console.log("[APP] Token salvo com sucesso no Firestore.");
      }

      // 2. Configura canal Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // 3. Listeners de notificação
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("[APP] Notificação recebida:", notification);
        Toast.show({
          type: "info",
          text1: notification.request.content.title || "Nova notificação",
          text2: notification.request.content.body || undefined,
        });
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("[APP] Usuário interagiu com a notificação:", response);
      });

    } catch (error) {
      console.error("[APP] Erro no setup de notificações:", error);
    }
  };

  setupNotifications();

  // ✅ Este return deve estar aqui, fora da função interna
  return () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
  };
}, []);



  return (
    <AppLoadProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="MNDD"
            screenOptions={{
              headerTitleAlign: "center",
              headerTintColor: "#000",
              headerStyle: {
                backgroundColor: "#fff",
              },
            }}
          >
            <Stack.Screen
              name="MNDD"
              component={MNDDScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Livros"
              component={HomeScreen}
              options={{
                title: "Livros da Bíblia",
                headerTitleStyle: {
                  fontSize: 24,
                  fontWeight: "bold",
                },
              }}
            />
            <Stack.Screen
              name="Capitulos"
              component={BookScreen}
              options={({ route }) => ({
                title: `${route.params.bookName}`,
                headerTitleStyle: {
                  fontSize: 24,
                  fontWeight: "bold",
                },
              })}
            />
            <Stack.Screen
              name="Versiculos"
              component={ChapterScreen}
              options={({ route }) => ({
                title: `${route.params.bookName}`,
                headerTitleStyle: {
                  fontSize: 24,
                  fontWeight: "bold",
                },
              })}
            />
            <Stack.Screen
              name="Versiculo"
              component={VerseScreen}
              options={({ route }) => ({
                title: `${route.params.bookName} ${route.params.chapterNumber}:${route.params.verseNumber}`,
                headerTitleStyle: {
                  fontSize: 24,
                  fontWeight: "bold",
                },
              })}
            />
            <Stack.Screen
              name="Igreja"
              component={ChurchScreen}
              options={{
                title: "Nossa Igreja",
                headerTitleStyle: {
                  fontSize: 22,
                  fontWeight: "bold",
                },
              }}
            />
            <Stack.Screen
              name="SendNotification"
              options={{
                title: "Enviar Notificação",
                headerTitleStyle: {
                  fontSize: 22,
                  fontWeight: "bold",
                },
                headerLeft: () => null,
              }}
            >
              {() => (
                <ProtectedRoute>
                  <SendNotificationScreen />
                </ProtectedRoute>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: "Acesso Administrativo",
                headerTitleStyle: {
                  fontSize: 22,
                  fontWeight: "bold",
                },
              }}
            />
            <Stack.Screen
              name="Favoritos"
              component={FavoritosScreen}
              options={{
                title: "Versículos Favoritos",
                headerTitleStyle: {
                  fontSize: 22,
                  fontWeight: "bold",
                },
              }}
            />
            <Stack.Screen
              name="BibleAssistant"
              component={BibleAssistant}
              options={{ title: "Assistente Bíblico" }}
            />
            <Stack.Screen
              name="EstudosScreen"
              component={EstudosScreen}
              options={{ title: "Devocionais" }}
            />
            <Stack.Screen
              name="HarpaScreen"
              component={HarpaScreen}
              options={{ title: "" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </AuthProvider>
    </AppLoadProvider>
  );
};

export default AppNavigator;
