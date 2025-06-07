import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

const VerseScreen = () => {
  const route = useRoute();
  const { verse, verseNumber, bookName, chapterNumber } = route.params as {
    verse: string;
    verseNumber: number;
    bookName: string;
    chapterNumber: number;
  };

  const viewRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log("Erro ao compartilhar:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao compartilhar",
      });
    }
  };

  return (
    <ViewShot style={{ flex: 1 }} ref={viewRef} options={{ format: "png", quality: 1 }}>
      <ImageBackground
        source={require("../assets/fundo_igreja.jpg")}
        style={styles.background}
        imageStyle={{ opacity: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.verseBox}>
            <Image
              source={require("../assets/logoigreja.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.reference}>
              {bookName} {chapterNumber}:{verseNumber}
            </Text>
            <Text style={styles.verse}>{verse}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "flex-start", // Alinha no topo
  },
  verseBox: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    marginHorizontal: 16,
    alignSelf: "center",
    marginTop: Platform.select({
          android: 100,
          ios: 100,
        }),
  },
  logo: {
    marginTop: -50,
    width: 200,
    height: 200,
  },
  reference: {
    marginTop: -10,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  verse: {
    fontSize: 18,
    fontFamily: "Montserrat_500Medium",
    textAlign: "center",
    color: "#333",
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 12,
    elevation: 3,
  },
});

export default VerseScreen;
