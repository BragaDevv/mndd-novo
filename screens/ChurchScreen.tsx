import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking, 
  Image, 
  ScrollView, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Culto = {
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
  const { width } = Dimensions.get('window');
  const [cultosDaSemana, setCultosDaSemana] = useState<Culto[]>([]);
  const [carrosselImages, setCarrosselImages] = useState<CarrosselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

  // Carrega os cultos programados e imagens do carrossel
  useEffect(() => {
    const hoje = new Date();
    const fimDaSemana = new Date();
    fimDaSemana.setDate(hoje.getDate() + 7);

    // Carrega cultos
    const cultosQuery = query(
      collection(db, "cultos"),
      orderBy("createdAt", "asc")
    );

    // Carrega imagens do carrossel
    const carrosselQuery = query(
      collection(db, "carrossel"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeCultos = onSnapshot(cultosQuery, (querySnapshot) => {
      const cultos: Culto[] = [];
      
      querySnapshot.forEach((doc) => {
        const cultoData = doc.data();
        const [dia, mes, ano] = cultoData.data.split('/');
        const dataCulto = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        
        if (dataCulto >= hoje && dataCulto <= fimDaSemana) {
          cultos.push({
            id: doc.id,
            ...cultoData,
          } as Culto);
        }
      });

      setCultosDaSemana(cultos);
    });

    const unsubscribeCarrossel = onSnapshot(carrosselQuery, (querySnapshot) => {
      const images: CarrosselImage[] = [];
      querySnapshot.forEach((doc) => {
        images.push({
          id: doc.id,
          ...doc.data(),
        } as CarrosselImage);
      });
      setCarrosselImages(images);
      setLoading(false);
    });

    return () => {
      unsubscribeCultos();
      unsubscribeCarrossel();
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

  const socialLinks = {
    instagram: {
      appUrl: 'instagram://user?username=nascidodedeus.oficial',
      webUrl: 'https://www.instagram.com/nascidodedeus.oficial/',
      icon: 'instagram' as const,
      color: '#E1306C'
    },
    facebook: {
      appUrl: 'fb://profile/nascidos.dedeus.73',
      webUrl: 'https://www.facebook.com/nascidos.dedeus.73?mibextid=wwXIfr&mibextid=wwXIfr',
      icon: 'facebook' as const,
      color: '#1877F2'
    }
  };

  const openLink = async (appUrl: string, webUrl: string) => {
    try {
      await Linking.openURL(appUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const formatarData = (dataString: string) => {
    const [dia, mes, ano] = dataString.split('/');
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
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
                  const slide = Math.round(event.nativeEvent.contentOffset.x / width);
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
              <Text style={styles.placeholderText}>Nenhuma imagem disponível</Text>
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
                    <MaterialIcons name="event" size={24} color="#075E54" />
                  </View>
                  <View style={styles.eventoInfo}>
                    <Text style={styles.eventoTitulo}>{culto.tipo}</Text>
                    <Text style={styles.eventoData}>
                      {formatarData(culto.data)} • {culto.horario}
                    </Text>
                    {culto.descricao && (
                      <Text style={styles.eventoDescricao}>{culto.descricao}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum evento programado para esta semana</Text>
            )}
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

        <LinearGradient
          colors={['#f5f5f5', '#e0e0e0']}
          style={styles.footer}
        >
          <Text style={styles.footerTitle}>MINISTÉRIO NASCIDO DE DEUS</Text>
          <Text style={styles.footerText}>R. Nanci Silva Cabral, 441 - Parque Continental II</Text>
          <Text style={styles.footerText}>Guarulhos / SP - CEP: 07084-000</Text>
          <Text style={styles.footerText}>(11) 94734-3378 | (11) 94752-1645</Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContainer: {
    flexGrow: 1,
  },
  carouselContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    fontFamily: 'Montserrat_500Medium'
  },
  slide: {
    width,
    height: '100%'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4
  },
  paginationDotActive: {
    backgroundColor: '#333'
  },
  content: {
    padding: 20,
    paddingBottom: 0
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    fontFamily: 'Montserrat_600SemiBold'
  },
  eventoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  eventoIcon: {
    marginRight: 15,
    justifyContent: 'center'
  },
  eventoInfo: {
    flex: 1
  },
  eventoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 4,
    fontFamily: 'Montserrat_600SemiBold'
  },
  eventoData: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontFamily: 'Montserrat_500Medium'
  },
  eventoDescricao: {
    fontSize: 14,
    color: '#444',
    fontFamily: 'Montserrat_400Regular'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'Montserrat_500Medium'
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 2
  },
  socialText: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium'
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 20
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold'
  },
  footerText: {
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Montserrat_400Regular'
  }
});

export default ChurchScreen;