import React from "react";
import {
  FlatList,
  Platform,
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

const CapitulosScreen = () => {
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
      <Text style={styles.subtitle}>{bookName} - Capítulos</Text>
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
    padding: 20,
    backgroundColor: "#fff",
     paddingBottom: Platform.select({
          android: 60,
          ios: 10,
        }),
    
  },
  grid: {
    alignItems: "center",
        paddingTop: Platform.select({
      android: 25,
      ios: 25,
    }),
    paddingBottom: Platform.select({
      android: 70,
      ios: 40,
    }),
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
    fontSize: 20,
    color: "#000",
    fontWeight: "bold",
    fontFamily: "Montserrat_500Medium",
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#000",
    fontFamily: "Montserrat_500Medium",
    marginTop: Platform.select({
          android: 50,
          ios: 0,
        }),
  },
});

export default CapitulosScreen;
