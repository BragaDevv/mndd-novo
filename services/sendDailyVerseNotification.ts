import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import versiculos from "../data/versiculos.json";

type Versiculo = {
  livro: string;
  capitulo: number;
  versiculo: number;
  texto: string;
};

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
};

export async function sendDailyVerseNotification(): Promise<boolean> {
  try {
    // Seleciona um versículo aleatório
    const index = Math.floor(Math.random() * versiculos.length);
    const versiculo: Versiculo = versiculos[index];

    const title = "📖 Versículo do Dia";
    const body = `${versiculo.texto} — ${versiculo.livro} ${versiculo.capitulo}:${versiculo.versiculo}`;

    const tokensSnapshot = await getDocs(collection(db, "pushTokens"));
    const messages: ExpoPushMessage[] = [];

    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token && typeof data.token === "string") {
        messages.push({
          to: data.token,
          sound: "default",
          title,
          body,
        });
      }
    });

    const chunks = chunkArray(messages, 25);
    for (const chunk of chunks) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    }

    return true;
  } catch (error) {
    console.error("Erro ao enviar versículo do dia:", error);
    return false;
  }
}

// Utilitário para dividir em grupos
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
