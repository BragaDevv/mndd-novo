import "dotenv/config";
import { ExpoConfig, ConfigContext } from "@expo/config";
import * as fs from "fs";
import * as path from "path";

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesBase64 = process.env.GOOGLE_SERVICES_JSON;

  // ✅ Logs para debug local (sem expor a chave no bundle)
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY não definida no .env");
  } else {
    console.log("✅ OPENAI_API_KEY carregada (uso exclusivo no backend)");
  }

  if (googleServicesBase64) {
    const filePath = path.join("google-services.json");
    try {
      fs.writeFileSync(filePath, Buffer.from(googleServicesBase64, "base64"));
      console.log("✅ google-services.json criado via variável de ambiente.");
    } catch (err) {
      console.warn("❌ Falha ao criar google-services.json:", err);
    }
  } else {
    console.warn("⚠️ GOOGLE_SERVICES_JSON não definida.");
  }

  return {
    ...config,
    name: "MNDD",
    slug: "MNDD",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      hidden: true,
    },
    assetBundlePatterns: ["**/*"],
    plugins: [
      "expo-font",
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission: "O app acessa suas fotos para adicionar ao carrossel",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ffffff",
          androidMode: "collapse",
          androidCollapsedTitle: "{notificationTitle}",
          androidChannelId: "default",
          iosDisplayInForeground: true,
        },
      ],
      "expo-build-properties",
    ],
    android: {
      package: "com.mbragam.mndd",
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["NOTIFICATIONS", "FOREGROUND_SERVICE"],
      googleServicesFile: "./google-services.json",
    },
    ios: {
      bundleIdentifier: "com.mbragam.mndd-novo",
      supportsTablet: true,
      icon: "./assets/ios-icon.png",
      infoPlist: {
        CFBundleDisplayName: "MNDD",
        NSCameraUsageDescription: "Permissão para acessar a câmera",
        NSPhotoLibraryUsageDescription: "Permissão para acessar fotos",
        NSUserTrackingUsageDescription: "Este identificador é usado para envio de notificações personalizadas",
        UIBackgroundModes: ["remote-notification"],
      },
    },
    extra: {
      // ❌ REMOVIDO: OPENAI_API_KEY
      eas: {
        projectId: "05b35e5f-69a7-4bd5-942a-2dc3f167601c",
      },
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    updates: {
      url: "https://u.expo.dev/05b35e5f-69a7-4bd5-942a-2dc3f167601c",
    },
    owner: "mbragam",
  };
};
