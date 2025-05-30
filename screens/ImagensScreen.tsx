// ✅ Nova tela: Carrossel.tsx com todas as funcionalidades mantidas

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useFonts, Montserrat_500Medium } from "@expo-google-fonts/montserrat";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const { width } = Dimensions.get("window");

const CarrosselScreen = () => {
  const [carrosselImages, setCarrosselImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fontsLoaded] = useFonts({ Montserrat_500Medium });

  useEffect(() => {
    const carrosselRef = collection(db, "carrossel");
    const q = query(carrosselRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const imagesData: any[] = [];
      querySnapshot.forEach((doc) => {
        imagesData.push({ id: doc.id, ...doc.data() });
      });
      setCarrosselImages(imagesData);
    });

    return () => unsubscribe();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const sizeInBytes = (base64.length * 3) / 4;
      if (sizeInBytes > 1000000) throw new Error("Imagem muito grande");

      await addDoc(collection(db, "carrossel"), {
        imageBase64: `data:image/jpeg;base64,${base64}`,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Sucesso", "Imagem adicionada ao carrossel!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      Alert.alert("Erro", "Falha ao adicionar imagem");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "carrossel", id));
      Alert.alert("Sucesso", "Imagem removida!");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      Alert.alert("Erro", "Falha ao remover imagem");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Carrossel de Imagens</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4CAF50" }]}
        onPress={pickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome
              name="photo"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Selecionar Imagem</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.listContent}>
        {carrosselImages.length > 0 ? (
          carrosselImages.map((item) => (
            <View key={item.id} style={styles.imageItemContainer}>
              <Image
                source={{ uri: item.imageBase64 }}
                style={styles.carrosselImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.deleteImageButton}
                onPress={() => removeImage(item.id)}
              >
                <MaterialIcons name="delete" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma imagem no carrossel</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#fff",
    fontSize: 18,
  },
  listContent: {
    flex: 1,
  },
  imageItemContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
    elevation: 2,
  },
  carrosselImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: 5,
  },
  emptyText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default CarrosselScreen;
