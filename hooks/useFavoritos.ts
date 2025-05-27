// hooks/useFavoritos.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';

const FAVORITOS_KEY = 'versiculos_favoritos';

export type VersiculoFavorito = {
  bibleVersion: ReactNode;
  id: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verse: string;
};

export const useFavoritos = () => {
  const [favoritos, setFavoritos] = useState<VersiculoFavorito[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(FAVORITOS_KEY);
      if (stored) setFavoritos(JSON.parse(stored));
    })();
  }, []);

  const adicionarFavorito = async (versiculo: VersiculoFavorito) => {
    const existe = favoritos.find((v) => v.id === versiculo.id);
    if (existe) return; // evitar duplicatas
    const atualizados = [...favoritos, versiculo];
    setFavoritos(atualizados);
    await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(atualizados));
  };

  const removerFavorito = async (id: string) => {
    const atualizados = favoritos.filter((v) => v.id !== id);
    setFavoritos(atualizados);
    await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(atualizados));
  };

  const isFavorito = (id: string) => favoritos.some((v) => v.id === id);

  return {
    favoritos,
    adicionarFavorito,
    removerFavorito,
    isFavorito,
  };
};
