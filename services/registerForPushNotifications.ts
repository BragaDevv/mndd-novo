// services/registerForPushNotifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export default async function registerForPushNotifications(): Promise<string | undefined> {
  try {
    if (!Device.isDevice) {
      console.warn("[NOTIF] Notificações funcionam apenas em dispositivos físicos.");
      return;
    }

    console.log("[NOTIF] Verificando permissões de notificação...");

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("[NOTIF] Permissão ainda não concedida, solicitando...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[NOTIF] Permissão para notificações negada pelo usuário.");
      return;
    }

    console.log("[NOTIF] Permissão concedida, obtendo token...");

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;

    console.log("[NOTIF] Token de push gerado:", token);

    // Android: cria canal de notificação
    if (Platform.OS === "android") {
      console.log("[NOTIF] Configurando canal de notificação para Android...");
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    console.error("[NOTIF] Erro ao registrar token de push:", error);
    return;
  }
}
