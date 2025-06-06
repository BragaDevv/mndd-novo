import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // 🔒 Validação da variável da OpenAI
  if (!openaiApiKey) {
    console.warn('⚠️ OPENAI_API_KEY não definida no .env');
  } else if (!openaiApiKey.startsWith('sk-')) {
    console.warn('❌ OPENAI_API_KEY parece inválida. Verifique o formato.');
  } else {
    console.log('✅ OPENAI_API_KEY carregada com sucesso.');
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
      'expo-build-properties', // ✅ Necessário para GOOGLE_SERVICES_JSON funcionar
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
