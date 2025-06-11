// utils/logAction.ts
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const registrarAcaoADM = async (email: string, acao: string) => {
  try {
    let nome = "";
    let sobrenome = "";

    // Busca UID do AsyncStorage
    const uid = await AsyncStorage.getItem("usuarioUID");

    if (uid) {
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        nome = data.nome || "";
        sobrenome = data.sobrenome || "";
      }
    }

    // Registra o log com nome e sobrenome
    await addDoc(collection(db, "logs_acesso"), {
      email: email.trim().toLowerCase(),
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      acao,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao registrar ação ADM:", error);
  }
};

