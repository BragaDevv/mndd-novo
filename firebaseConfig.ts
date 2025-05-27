import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Configuração correta para Firebase com Expo
const firebaseConfig = {
  apiKey: "AIzaSyAKqMusZk_3hncoLMT2BjdHrrdUbISHNj0",
  authDomain: "mndd-b99a2.firebaseapp.com",
  projectId: "mndd-b99a2",
  storageBucket: "mndd-b99a2.appspot.com",
  messagingSenderId: "129813834901",
  appId: "1:129813834901:web:3954cfd7f5011feeb87f9c"
};

// Inicialize o app se ainda não estiver iniciado
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ⚠️ Use apenas getAuth(app), sem initializeAuth
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
