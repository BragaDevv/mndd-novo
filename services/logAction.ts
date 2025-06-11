// utils/logAction.ts
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const registrarAcaoADM = async (email: string, acao: string) => {
  try {
    await addDoc(collection(db, "logs_acesso"), {
      email: email.trim().toLowerCase(),
      acao,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao registrar ação ADM:", error);
  }
};
