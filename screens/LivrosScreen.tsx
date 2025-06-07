import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import acfData from "../data/acf.json";
import { RootStackParamList, Book } from "../types/types";
import { Ionicons } from "@expo/vector-icons";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Livros"
>;

const LivrosScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchTerm, setSearchTerm] = useState("");
  const [testamentFilter, setTestamentFilter] = useState<"todos" | "vt" | "nt">("todos");

  const bibleData = acfData; // Usando apenas a versão ACF

  function getBookName(abbrev: string): string {
    const bookNames: Record<string, string> = {
      gn: "Gênesis",
      ex: "Êxodo",
      lv: "Levítico",
      nm: "Números",
      dt: "Deuteronômio",
      js: "Josué",
      jz: "Juízes",
      rt: "Rute",
      "1sm": "1 Samuel",
      "2sm": "2 Samuel",
      "1rs": "1 Reis",
      "2rs": "2 Reis",
      "1cr": "1 Crônicas",
      "2cr": "2 Crônicas",
      ed: "Esdras",
      ne: "Neemias",
      et: "Ester",
      jb: "Jó",
      sl: "Salmos",
      pv: "Provérbios",
      ec: "Eclesiastes",
      ct: "Cânticos",
      is: "Isaías",
      jr: "Jeremias",
      lm: "Lamentações",
      ez: "Ezequiel",
      dn: "Daniel",
      os: "Oséias",
      jl: "Joel",
      am: "Amós",
      ob: "Obadias",
      jn: "Jonas",
      mq: "Miquéias",
      na: "Naum",
      hc: "Habacuque",
      sf: "Sofonias",
      ag: "Ageu",
      zc: "Zacarias",
      ml: "Malaquias",
      mt: "Mateus",
      mc: "Marcos",
      lc: "Lucas",
      jo: "João",
      at: "Atos",
      rm: "Romanos",
      "1co": "1 Coríntios",
      "2co": "2 Coríntios",
      gl: "Gálatas",
      ef: "Efésios",
      fp: "Filipenses",
      cl: "Colossenses",
      "1ts": "1 Tessalonicenses",
      "2ts": "2 Tessalonicenses",
      "1tm": "1 Timóteo",
      "2tm": "2 Timóteo",
      tt: "Tito",
      fm: "Filemom",
      hb: "Hebreus",
      tg: "Tiago",
      "1pe": "1 Pedro",
      "2pe": "2 Pedro",
      "1jo": "1 João",
      "2jo": "2 João",
      "3jo": "3 João",
      jd: "Judas",
      ap: "Apocalipse",
    };
    return bookNames[abbrev] || abbrev.toUpperCase();
  }

  // Livros separados por testamento
  const velhoTestamento = [
    "gn", "ex", "lv", "nm", "dt", "js", "jz", "rt", "1sm", "2sm",
    "1rs", "2rs", "1cr", "2cr", "ed", "ne", "et", "jó", "sl", "pv",
    "ec", "ct", "is", "jr", "lm", "ez", "dn", "os", "jl", "am",
    "ob", "jn", "mq", "na", "hc", "sf", "ag", "zc", "ml"
  ];

  const novoTestamento = [
    "mt", "mc", "lc", "jo", "atos", "rm", "1co", "2co", "gl", "ef",
    "fp", "cl", "1ts", "2ts", "1tm", "2tm", "tt", "fm", "hb", "tg",
    "1pe", "2pe", "1jo", "2jo", "3jo", "jd", "ap"
  ];

  const filteredBooks = bibleData
    .filter((book) => {
      const name = getBookName(book.abbrev).toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());

      const isVT = velhoTestamento.includes(book.abbrev);
      const isNT = novoTestamento.includes(book.abbrev);

      const matchesFilter =
        testamentFilter === "todos" ||
        (testamentFilter === "vt" && isVT) ||
        (testamentFilter === "nt" && isNT);

      return matchesSearch && matchesFilter;
    })
    .map((book) => ({
      ...book,
      name: getBookName(book.abbrev),
    }));

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        navigation.navigate("Capitulos", {
          book: item,
          bookName: item.name || getBookName(item.abbrev),
          bibleVersion: "ACF",
        })
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="book-outline" size={22} color="#555" style={{ marginRight: 10 }} />
        <Text style={styles.livrosTitle}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Livros</Text>
      {/* Barra de pesquisa e filtros */}
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar livro..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, testamentFilter === "todos" && styles.activeFilter]}
            onPress={() => setTestamentFilter("todos")}
          >
            <Text style={styles.filterText}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, testamentFilter === "vt" && styles.activeFilter]}
            onPress={() => setTestamentFilter("vt")}
          >
            <Text style={styles.filterText}>📜 VT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, testamentFilter === "nt" && styles.activeFilter]}
            onPress={() => setTestamentFilter("nt")}
          >
            <Text style={styles.filterText}>✝️ NT</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredBooks}
          renderItem={renderItem}
          keyExtractor={(item) => item.abbrev}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Barra de navegação fixa */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Favoritos")}
        >
          <Ionicons name="heart" size={26} color="#000" />
          <Text style={styles.navButtonText}>Favoritos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Devocional")}
        >
          <Ionicons name="book" size={26} color="#000" />
          <Text style={styles.navButtonText}>Devocional</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("HarpaScreen")}
        >
          <Ionicons name="musical-notes" size={26} color="#000" />
          <Text style={styles.navButtonText}>Harpa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 0, // Para não ficar embaixo da barra de navegação
  },
    title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
    marginTop: Platform.select({
          android: 25,
          ios: 0,
        }),
  },
  input: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    fontSize: 18,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    backgroundColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeFilter: {
    backgroundColor: "#000",
  },
  filterText: {
    fontSize:18,
    textAlign: 'center',
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Montserrat_500Medium",
  },
  item: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
  },
  livrosTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "Montserrat_500Medium",
  },
  listContent: {
    paddingBottom: 80, // Espaço para a barra de navegação
  },
  // Estilos da barra de navegação
  bottomNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#dadada",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    paddingTop: Platform.select({
      android: 25,
      ios: 25,
    }),
    paddingBottom: Platform.select({
      android: 30,
      ios: 30,
    }),
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navButtonText: {
    color: "#000",
    fontSize: 12,
    marginTop: 5,
  },
});

export default LivrosScreen;