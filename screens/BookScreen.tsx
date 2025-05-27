import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type BookScreenRouteProp = RouteProp<RootStackParamList, "Capitulos">;
type BookScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Versiculos"
>;

const BookScreen = () => {
  const navigation = useNavigation<BookScreenNavigationProp>();
  const route = useRoute<BookScreenRouteProp>();
  const { book, bookName } = route.params;

  const totalChapters = book.chapters.length;

  const renderItem = ({ item, index }: { item: string[]; index: number }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        navigation.navigate("Versiculos", {
          bookName, // precisa ser o "abbrev" do JSON
          chapterNumber: index + 1,
          chapter: item,
          totalChapters: book.chapters.length,
          bibleVersion: "ACF",
          bookAbbrev: book.abbrev,
        })
      }
    >
      <Text style={styles.title}>{index + 1}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Capítulos</Text>
      <FlatList
        data={book.chapters}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={4} // define o número de colunas
        contentContainerStyle={styles.grid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  grid: {
    alignItems: "center",
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
    margin: 6,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#444",
  },
});

export default BookScreen;
