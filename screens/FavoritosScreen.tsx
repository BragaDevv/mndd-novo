import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useFavoritos } from '../hooks/useFavoritos';
import { Ionicons } from '@expo/vector-icons';

const FavoritosScreen = () => {
  const { favoritos, removerFavorito } = useFavoritos();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontFamily: "Montserrat_500Medium", fontWeight: 'bold', marginBottom: 10, marginTop: Platform.select({
            android: 50,
            ios: 0,
          }),  }}>Versículos Favoritos</Text>

      <FlatList
        data={favoritos}
        keyExtractor={(item, index) => item.id || `${index}`}
        renderItem={({ item }) => (
          <View style={styles.versiculoContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.referencia}>
                {item.bookName} {item.chapterNumber}:{item.verseNumber} ({item.bibleVersion})
              </Text>
              <Text style={styles.texto}>{item.verse}</Text>
            </View>

            <TouchableOpacity onPress={() => removerFavorito(item.id)}>
              <Ionicons name="heart" size={28} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum versículo favorito ainda.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  versiculoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  referencia: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  texto: {
    fontSize: 16,
    color: '#444',
  },
  empty: {
    marginTop: 30,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default FavoritosScreen;
