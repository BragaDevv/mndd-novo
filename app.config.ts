import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';
import * as fs from 'fs';
import * as path from 'path';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesBase64 = process.env.GOOGLE_SERVICES_JSON;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // 🔒 Validação da variável da OpenAI
  if (!openaiApiKey) {
    console.warn('⚠️ OPENAI_API_KEY não definida no .env');
  } else if (!openaiApiKey.startsWith('sk-')) {
    console.warn('❌ OPENAI_API_KEY parece inválida. Verifique o formato.');
  } else {
    console.log('✅ OPENAI_API_KEY carregada com sucesso.');
  }

  // Criação do google-services.json a partir da base64
  if (googleServicesBase64) {
    try {
      const filePath = path.resolve('android/app/google-services.json');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(googleServicesBase64, 'base64'));
      console.log('✅ google-services.json criado via variável de ambiente.');
    } catch (err) {
      console.warn('❌ Falha ao criar google-services.json:', err);
    }
  } else {
    console.warn('⚠️ GOOGLE_SERVICES_JSON não definida.');
  }

  return {
    ...config,
    name: 'MNDD',
    slug: 'MNDD',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon-app.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      hidden: true,
    },
    assetBundlePatterns: ['**/*'],
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: 'O app acessa suas fotos para adicionar ao carrossel',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#ffffff',
          androidMode: 'collapse',
          androidCollapsedTitle: '{notificationTitle}',
          androidChannelId: 'default',
          iosDisplayInForeground: true,
        },
      ],
    ],
    android: {
      package: 'com.mbragam.MNDD',
      adaptiveIcon: {
        foregroundImage: './assets/icon-app.png',
        backgroundColor: '#ffffff',
      },
      permissions: ['NOTIFICATIONS', 'FOREGROUND_SERVICE'],
      googleServicesFile: './android/app/google-services.json',
    },
    ios: {
      bundleIdentifier: 'com.mbragam.mndd-novo',
      supportsTablet: true,
      icon: './assets/ios-icon.png',
      infoPlist: {
        CFBundleDisplayName: 'MNDD',
        NSCameraUsageDescription: 'Permissão para acessar a câmera',
        NSPhotoLibraryUsageDescription: 'Permissão para acessar fotos',
        NSUserTrackingUsageDescription:
          'Este identificador é usado para envio de notificações personalizadas',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    extra: {
      OPENAI_API_KEY: openaiApiKey,
      eas: {
        projectId: '05b35e5f-69a7-4bd5-942a-2dc3f167601c',
      },
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    updates: {
      url: 'https://u.expo.dev/05b35e5f-69a7-4bd5-942a-2dc3f167601c',
    },
    owner: 'mbragam',
  };
};
