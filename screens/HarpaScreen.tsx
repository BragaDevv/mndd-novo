import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  Image,
  Dimensions,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");
const { width } = Dimensions.get("window");

interface Hino {
  hino: string;
  coro: string;
  verses: Record<string, string>;
}

interface HinoData {
  [key: string]: Hino | {
    Author: string;
    date: string;
    github: string;
    linkedin: string;
  };
}

const HarpaScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHino, setSelectedHino] = useState<Hino | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredHinos, setFilteredHinos] = useState<Array<{id: string, data: Hino}>>([]);
  const hinosData = require("../data/harpa_crista_640_hinos.json") as HinoData;

  useEffect(() => {
    // Converter o objeto de hinos em um array e filtrar apenas os objetos que têm a estrutura de hino
    const hinosArray = Object.entries(hinosData)
      .map(([id, data]) => ({id, data}))
      .filter(item => 
        'hino' in item.data && 
        'coro' in item.data && 
        'verses' in item.data
      ) as Array<{id: string, data: Hino}>;

    if (searchTerm === "") {
      setFilteredHinos(hinosArray);
    } else {
      const filtered = hinosArray.filter(hino => 
        hino.id.includes(searchTerm) || 
        hino.data.hino.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHinos(filtered);
    }
  }, [searchTerm, hinosData]);

  const openHinoModal = (hino: Hino) => {
    setSelectedHino(hino);
    setModalVisible(true);
  };

  const renderHinoItem = ({ item }: { item: {id: string, data: Hino} }) => (
    <TouchableOpacity
      style={styles.hinoCard}
      onPress={() => openHinoModal(item.data)}
    >
      <View style={styles.hinoNumberContainer}>
        <Text style={styles.hinoNumber}>{item.id}</Text>
      </View>
      <Text style={styles.hinoTitle}>{item.data.hino}</Text>
      <Ionicons name="musical-note" size={22} color="#eb1c24" />
    </TouchableOpacity>
  );

  const renderHinoCompleto = () => {
    if (!selectedHino) return null;
    
    const versesInOrder = Object.entries(selectedHino.verses)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    return (
      <>
        {/* Primeiro verso */}
        {selectedHino.verses["1"] && (
          <>
            {selectedHino.verses["1"].split("<br>").map((line, index) => (
              <Text key={`verse-1-${index}`} style={styles.verseLine}>
                {line}
              </Text>
            ))}
            <View style={styles.space} />
          </>
        )}
        
        {/* Coro */}
        <View style={styles.coroContainer}>
          {selectedHino.coro.split("<br>").map((line, index) => (
            <Text key={`coro-${index}`} style={styles.coroLine}>
              {line}
            </Text>
          ))}
        </View>
        <View style={styles.space} />
        
        {/* Versos restantes em ordem */}
        {versesInOrder.slice(1).map(([verseNumber, verseText]) => (
          <React.Fragment key={`verse-${verseNumber}`}>
            {verseText.split("<br>").map((line, index) => (
              <Text key={`verse-${verseNumber}-${index}`} style={styles.verseLine}>
                {line}
              </Text>
            ))}
            <View style={styles.space} />
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Parte superior sem imagem de fundo */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
            />
            <Text style={styles.headerTitle}>HARPA CRISTÃ</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#eb1c24" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar hino ..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
              keyboardType="numeric"
            />
          </View>
        </View>
      </SafeAreaView>
  
      {/* Parte inferior com imagem de fundo */}
      <ImageBackground 
        source={require('../assets/musical-background.jpg')} 
        style={styles.backgroundImage}
      >
        <FlatList
          data={filteredHinos}
          renderItem={renderHinoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </ImageBackground>
  
      {/* Modal para exibir o hino completo */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedHino && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedHino.hino}</Text>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
  
              <ScrollView style={styles.modalContent}>
                <View style={styles.hinoContent}>
                  {renderHinoCompleto()}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
     paddingBottom: Platform.select({
          android: 10,
          ios: 10,
        }),
  },
  safeArea: {
    flex: 0,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#fff', // Garante que não fique transparente
    borderColor:'#eb1c24',
    borderBottomWidth:2,
    elevation: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff', // ou a cor que preferir
    borderRadius: 10, // bordas arredondadas para melhor efeito
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: width * 0.03,
    marginTop: Platform.select({
      android: 0,
      ios: 0,
    }),
  },
  headerTitle: {
    fontSize: 32,
    marginTop: Platform.select({
      android: 25,
      ios: 0,
    }),
    fontWeight: "bold",
    color: "#000",
    // Sombreamento mais pronunciado no texto
    textShadowColor: 'rgba(135, 134, 134, 0.75)',
    textShadowOffset: {width: 2, height: 5},
    textShadowRadius: 5,
    // Efeito adicional para iOS (opcional)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
    }),
  },
  backgroundImage: {
    flex: 1, // Ocupa todo o espaço restante
    paddingTop: 0, // Espaço entre a barra de pesquisa e o conteúdo
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width:250,
    marginLeft: width * 0.14,
    backgroundColor: "rgba(250, 250, 250, 0.84)",
    borderRadius: 25,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#333",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 10,
  },
  hinoCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(106, 27, 154, 0.2)",
  },
  hinoNumberContainer: {
    backgroundColor: "#000",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  hinoNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  hinoTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  // Estilos do modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    ...Platform.select({
      ios: {
        paddingTop:40,
      },
      android: {
        paddingTop:4,
      },
    })
  },
  modalHeader: {
    backgroundColor: "#000",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  hinoContent: {
    paddingBottom: 30,
  },
  coroContainer: {
    backgroundColor: "#ffa962",
    padding: 12,
    borderRadius: 10,
  },
  coroLine: {
    fontSize: 18,
    fontStyle:'italic',
    lineHeight: 26,
    fontWeight:'bold',
    color: "#000",
    textAlign: 'center',
  },
  verseLine: {
    fontSize: 18,
    lineHeight: 26,
    color: "#333",
    marginBottom: 5,
    textAlign: 'center',
  },
  space: {
    height: 12,
  },
});

export default HarpaScreen;