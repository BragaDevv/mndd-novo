import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
};

export async function sendNotificationToAll(title: string, body: string): Promise<boolean> {
  try {
    const tokensSnapshot = await getDocs(collection(db, "pushTokens"));

    const messages: ExpoPushMessage[] = [];

    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token && typeof data.token === "string") {
        messages.push({
          to: data.token,
          sound: "default",
          title: title || "Notificação",
          body: body,
        });
      }
    });

    const chunks = chunkArray(messages, 25); // Expo recomenda 100, mas 25 é mais seguro em testes
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
    console.error("Erro ao enviar notificações:", error);
    return false;
  }
}

// Função utilitária para dividir em partes menores
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
