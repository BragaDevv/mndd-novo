import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Gera um ID aleatório simples (compatível com Expo Go e builds)
function generateRandomId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

// Gera ou obtém um ID persistente para o dispositivo
async function getDeviceId(): Promise<string> {
  let deviceId = await SecureStore.getItemAsync("device_id");
  if (!deviceId) {
    deviceId = generateRandomId();
    console.log("[TOKEN] Gerando novo device_id:", deviceId);
    await SecureStore.setItemAsync("device_id", deviceId);
  } else {
    console.log("[TOKEN] device_id existente encontrado:", deviceId);
  }
  return deviceId;
}

// Valida se é um Expo Push Token válido
function isValidExpoPushToken(token: string): boolean {
  return typeof token === "string" && token.startsWith("ExponentPushToken[");
}

export async function saveExpoPushToken(token: string, extraData: Record<string, any> = {}) {
  try {
    console.log("[TOKEN] Iniciando salvamento de token...");

    if (!isValidExpoPushToken(token)) {
      console.warn("[TOKEN] Token inválido, não será salvo:", token);
      return;
    }

    const deviceId = await getDeviceId();

    const dataToSave = {
      token,
      updatedAt: serverTimestamp(),
      platform: Platform.OS,
      deviceName: Device.deviceName || null,
      ...extraData,
    };

    console.log("[TOKEN] Dados prontos para salvar:", { deviceId, ...dataToSave });

    await setDoc(doc(db, "pushTokens", deviceId), dataToSave);

    console.log("[TOKEN] Token salvo com sucesso no Firestore para:", deviceId);
  } catch (error) {
    console.error("[TOKEN] Erro ao salvar token:", error);
  }
}