import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

type Culto = {
  local: string;
  id: string;
  data: string;
  horario: string;
  tipo: string;
  descricao?: string;
  createdAt?: Timestamp;
};

type CarrosselImage = {
  id: string;
  imageBase64: string;
  createdAt: Timestamp;
};

const ChurchScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Igreja">>();
  const { width } = Dimensions.get("window");
  const [cultosDaSemana, setCultosDaSemana] = useState<Culto[]>([]);
  const [carrosselImages, setCarrosselImages] = useState<CarrosselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [avisos, setAvisos] = useState<
    { id: string; mensagem: string; imagens: string[] }[]
  >([]);
  const [avisosExpandidos, setAvisosExpandidos] = useState<string[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDaSemana = new Date();
    fimDaSemana.setDate(hoje.getDate() + 7);

    // Cultos
    const cultosQuery = query(
      collection(db, "cultos"),
      orderBy("createdAt", "asc")
    );
    const unsubscribeCultos = onSnapshot(cultosQuery, (querySnapshot) => {
      const cultos: Culto[] = [];
      querySnapshot.forEach((doc) => {
        const cultoData = doc.data();
        const [dia, mes, ano] = cultoData.data.split("/");
        const dataCulto = new Date(
          parseInt(ano),
          parseInt(mes) - 1,
          parseInt(dia)
        );
        if (dataCulto >= hoje && dataCulto <= fimDaSemana) {
          cultos.push({ id: doc.id, ...cultoData } as Culto);
        }
      });
      setCultosDaSemana(cultos);
    });

    // Carrossel
    const carrosselQuery = query(
      collection(db, "carrossel"),
      orderBy("createdAt", "desc")
    );
    const unsubscribeCarrossel = onSnapshot(carrosselQuery, (querySnapshot) => {
      const images: CarrosselImage[] = [];
      querySnapshot.forEach((doc) => {
        images.push({ id: doc.id, ...doc.data() } as CarrosselImage);
      });
      setCarrosselImages(images);
      setLoading(false);
    });

    // Avisos
    // Avisos
    const avisosQuery = query(
      collection(db, "avisos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeAvisos = onSnapshot(avisosQuery, (snapshot) => {
      const agrupados: { [mensagem: string]: string[] } = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const imagem = data.imageBase64 || data.imagem; // fallback
        const msg = data.mensagem;

        if (msg && imagem) {
          if (!agrupados[msg]) agrupados[msg] = [];
          agrupados[msg].push(imagem);
        }
      });

      const listaFormatada = Object.entries(agrupados).map(
        ([mensagem, imagens]) => ({
          id: mensagem,
          mensagem,
          imagens,
        })
      );

      setAvisos(listaFormatada);
    });

    return () => {
      unsubscribeCultos();
      unsubscribeCarrossel();
      unsubscribeAvisos();
    };
  }, []);

  // Auto-scroll do carrossel
  useEffect(() => {
    if (carrosselImages.length === 0) return;

    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % carrosselImages.length;
      setCurrentSlide(nextSlide);
      scrollRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentSlide, carrosselImages]);

  const toggleExpandir = (id: string) => {
    setAvisosExpandidos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const socialLinks = {
    instagram: {
      appUrl: "instagram://user?username=nascidodedeus.oficial",
      webUrl: "https://www.instagram.com/nascidodedeus.oficial/",
      icon: "instagram" as const,
      color: "#E1306C",
    },
    facebook: {
      appUrl: "https://www.facebook.com/nascidos.dedeus.73?mibextid=wwXIfr",
      webUrl:
        "https://www.facebook.com/nascidos.dedeus.73?mibextid=wwXIfr&mibextid=wwXIfr",
      icon: "facebook" as const,
      color: "#1877F2",
    },
  };

  const openLink = async (appUrl: string, webUrl: string) => {
    try {
      await Linking.openURL(appUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const formatarData = (dataString: string) => {
    const [dia, mes, ano] = dataString.split("/");
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return `${diasSemana[data.getDay()]}, ${dia} ${meses[parseInt(mes) - 1]}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Carrossel dinâmico */}
        <View style={styles.carouselContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#075E54" />
            </View>
          ) : carrosselImages.length > 0 ? (
            <>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                  const slide = Math.round(
                    event.nativeEvent.contentOffset.x / width
                  );
                  if (slide !== currentSlide) {
                    setCurrentSlide(slide);
                  }
                }}
              >
                {carrosselImages.map((image, index) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.imageBase64 }}
                    style={styles.slide}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              <View style={styles.pagination}>
                {carrosselImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentSlide && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialIcons name="image" size={50} color="#ccc" />
              <Text style={styles.placeholderText}>
                Nenhuma imagem disponível
              </Text>
            </View>
          )}
        </View>

        {/* Conteúdo Principal */}
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EVENTOS DESTA SEMANA</Text>

            {loading ? (
              <ActivityIndicator color="#075E54" />
            ) : cultosDaSemana.length > 0 ? (
              cultosDaSemana.map((culto) => (
                <View key={culto.id} style={styles.eventoCard}>
                  <View style={styles.eventoIcon}>
                    <MaterialIcons name="event" size={24} color="#000" />
                  </View>
                  <View style={styles.eventoInfo}>
                    <Text style={styles.eventoTitulo}>{culto.tipo}</Text>
                    <Text style={styles.eventoData}>
                      <MaterialIcons
                        name="calendar-month"
                        size={14}
                        color="#000"
                      />{" "}
                      {formatarData(culto.data)} • {culto.horario} |{" "}
                      <MaterialIcons
                        name="location-on"
                        size={14}
                        color="#f50202"
                      />{" "}
                      {culto.local}
                    </Text>
                    {culto.descricao && (
                      <Text style={styles.eventoDescricao}>
                        {culto.descricao}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Nenhum evento programado para esta semana
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MURAL DE AVISOS</Text>

            {avisos.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum aviso no momento.</Text>
            ) : (
              avisos.map((aviso) => (
                <View key={aviso.id} style={styles.avisoCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.avisoTexto}>{aviso.mensagem}</Text>
                    <TouchableOpacity onPress={() => toggleExpandir(aviso.id)}
                      style={styles.btnExp}>
                      <Ionicons
                        name={
                          avisosExpandidos.includes(aviso.id)
                            ? "remove-circle"
                            : "add-circle"
                        }
                        size={24}
                        color="#075E54"
                        
                      />
                    </TouchableOpacity>
                  </View>
                  {avisosExpandidos.includes(aviso.id) && (
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.avisoSlideContainer}
                    >
                      {aviso.imagens.map((img, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: img }}
                          style={{
                            width: Dimensions.get("window").width - 40,
                            height: 580,
                            borderRadius: 8,
                            marginRight: 10,
                          }}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionQuiz}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("Quiz")}
            >
              <Ionicons name="game-controller" size={36} color="#000" />
              <Text style={styles.navButtonText}>Quiz Bíblico</Text>
              <Ionicons name="book" size={36} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOS ACOMPANHE</Text>

            {Object.entries(socialLinks).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[styles.socialButton, { borderLeftColor: value.color }]}
                onPress={() => openLink(value.appUrl, value.webUrl)}
              >
                <FontAwesome name={value.icon} size={28} color={value.color} />
                <Text style={styles.socialText}>{key.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <LinearGradient colors={["#f5f5f5", "#e0e0e0"]} style={styles.footer}>
          <Text style={styles.footerTitle}>MINISTÉRIO NASCIDO DE DEUS</Text>
          <Text style={styles.footerText}>
            R. Nanci Silva Cabral, 441 - Parque Continental II
          </Text>
          <Text style={styles.footerText}>Guarulhos / SP - CEP: 07084-000</Text>
          <Text style={styles.footerText}>
            (11) 94734-3378 | (11) 94752-1645
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  carouselContainer: {
    height: 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginBottom: 20,
    marginTop: Platform.select({
      android: 50,
      ios: 0,
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  placeholderText: {
    marginTop: 10,
    color: "#999",
    fontFamily: "Montserrat_500Medium",
  },
  slide: {
    width,
    height: "100%",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    position: "absolute",
    bottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#333",
  },
  content: {
    padding: 20,
    paddingBottom: 0,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    fontFamily: "Montserrat_600SemiBold",
    textAlign: "center",
  },
  eventoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventoIcon: {
    marginRight: 15,
    justifyContent: "center",
  },
  eventoInfo: {
    flex: 1,
  },
  eventoTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#075E54",
    marginBottom: 4,
    fontFamily: "Montserrat_600SemiBold",
  },
  eventoData: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontFamily: "Montserrat_500Medium",
  },
  eventoDescricao: {
    fontSize: 12,
    color: "#444",
    fontFamily: "Montserrat_500Medium",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    fontFamily: "Montserrat_500Medium",
  },
  avisoSlideContainer: {
    width: "100%",
    height: 580,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },

  avisoCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avisoTexto: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    textAlign: "center",
    marginVertical:10,
    marginHorizontal:20,
    padding:10
  },

   btnExp: {
   position:'absolute',
   top:0,
   left:'95%'
  },


  sectionQuiz: {
    backgroundColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 30,
  },

  navButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 40,
    marginHorizontal: 20,
  },
  navButtonText: {
    fontFamily: "Montserrat_500Medium",
    color: "#000",
    fontSize: 22,
    marginTop: 5,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  socialText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
  footer: {
    width: "100%",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginTop: 20,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Montserrat_600SemiBold",
  },
  footerText: {
    textAlign: "center",
    marginBottom: 5,
    fontFamily: "Montserrat_400Regular",
  },
});

export default ChurchScreen;
