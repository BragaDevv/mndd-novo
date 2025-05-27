import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@versiculos_favoritos';

export interface VersiculoFavorito {
  id: string;
  texto: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
}

export async function getFavorites(): Promise<VersiculoFavorito[]> {
  const stored = await AsyncStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function addFavorite(versiculo: VersiculoFavorito): Promise<void> {
  const favorites = await getFavorites();
  const updated = [...favorites, versiculo];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export async function removeFavorite(id: string): Promise<void> {
  const favorites = await getFavorites();
  const updated = favorites.filter(v => v.id !== id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(v => v.id === id);
}
