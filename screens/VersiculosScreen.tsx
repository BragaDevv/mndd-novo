import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  ImageBackground,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import acfData from "../data/acf.json";
import aaData from "../data/aa.json";
import nivData from "../data/nvi.json";
import kjfData from "../data/kjf.json";

import { IntroductionsData } from "../types/types";

import { RootStackParamList } from "../types/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type ChapterScreenRouteProp = RouteProp<RootStackParamList, "Versiculos">;

type VersiculoFavorito = {
  id: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  verse: string;
  bibleVersion: "ACF" | "AA" | "NIV" | "KJF";
};

type SearchResult = {
  bookName: string;
  bookAbbrev: string;
  chapterNumber: number;
  verseNumber: number;
  verseText: string;
  bibleVersion: "ACF" | "AA" | "NIV" | "KJF";
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
};

const { height } = Dimensions.get("window");
const { width } = Dimensions.get("window");

const COLOR_PALETTE = [
  "#1890ff",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#722ed1",
  "#faad14",
];

const FAVORITOS_KEY = "versiculos_favoritos";
const COMMENTS_KEY = "versiculos_comentarios";
const getStorageKey = (bookName: string, chapterNumber: number) =>
  `@highlights_${bookName}_${chapterNumber}`;

const APP_LOGO = require("../assets/iconlogo.png");

const ChapterScreen = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "Versiculos">
    >();
  const route = useRoute<ChapterScreenRouteProp>();
  const {
    chapter,
    chapterNumber,
    bookName,
    totalChapters,
    bibleVersion = "ACF",
    bookAbbrev,
  } = route.params;

  const [highlightedVerses, setHighlightedVerses] = useState<
    Record<number, { bgColor: string; textColor: string }>
  >({});
  const [verseModalVisible, setVerseModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [viewCommentModalVisible, setViewCommentModalVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [introModalVisible, setIntroModalVisible] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<{
    number: number;
    text: string;
    currentColor?: string;
  } | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState(16);
  const [currentBibleVersion, setCurrentBibleVersion] = useState<
    "ACF" | "AA" | "NIV" | "KJF"
  >(bibleVersion);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  const bibleData = {
    ACF: acfData,
    AA: aaData,
    NIV: nivData,
    KJF: kjfData,
  }[currentBibleVersion];

  const currentBook = bibleData.find((b) => b.name === bookName);
  const currentChapter = currentBook?.chapters[chapterNumber - 1] || chapter;
  const nextChapter = currentBook?.chapters[chapterNumber];
  const previousChapter = currentBook?.chapters[chapterNumber - 2];

  const currentKey = currentVerse
    ? `${bookName}-${chapterNumber}-${currentVerse.number}-${currentBibleVersion}`
    : "";

  const introducoes = require("../data/introducoes.json") as IntroductionsData;

  const introData = introducoes[bookAbbrev] || {
    title: "Introdução",
    content: "Introdução não disponível para este livro.",
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const highlightsKey = getStorageKey(bookName, chapterNumber);
        const savedHighlights = await AsyncStorage.getItem(highlightsKey);
        if (savedHighlights) setHighlightedVerses(JSON.parse(savedHighlights));

        const savedFavorites = await AsyncStorage.getItem(FAVORITOS_KEY);
        if (savedFavorites) {
          const lista: VersiculoFavorito[] = JSON.parse(savedFavorites);
          const favoritesMap = lista.reduce((acc, curr) => {
            acc[
              `${curr.bookName}-${curr.chapterNumber}-${curr.verseNumber}-${curr.bibleVersion}`
            ] = true;
            return acc;
          }, {} as Record<string, boolean>);
          setFavorites(favoritesMap);
        }

        const savedComments = await AsyncStorage.getItem(COMMENTS_KEY);
        if (savedComments) {
          setComments(JSON.parse(savedComments));
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    console.log(bookAbbrev)
    loadData();
  }, [bookName, chapterNumber, currentBibleVersion]);

  // Save highlights
  useEffect(() => {
    const saveHighlights = async () => {
      try {
        const key = getStorageKey(bookName, chapterNumber);
        await AsyncStorage.setItem(key, JSON.stringify(highlightedVerses));
      } catch (error) {
        console.error("Failed to save highlights", error);
      }
    };

    saveHighlights();
  }, [highlightedVerses, bookName, chapterNumber]);

  useEffect(() => {
    if (currentVerse) {
      const verseKey = `${bookName}-${chapterNumber}-${currentVerse.number}-${currentBibleVersion}`;
      setFavorito(!!favorites[verseKey]);
    }
  }, [currentVerse, favorites]);

  const handleVersePress = (verseNumber: number, verseText: string) => {
    const currentHighlight = highlightedVerses[verseNumber];
    setCurrentVerse({
      number: verseNumber,
      text: verseText,
      currentColor: currentHighlight?.textColor,
    });
    setVerseModalVisible(true);
  };

  const handleColorSelect = (color: string) => {
    if (currentVerse) {
      if (currentVerse.currentColor === color) {
        const newHighlights = { ...highlightedVerses };
        delete newHighlights[currentVerse.number];
        setHighlightedVerses(newHighlights);
      } else {
        setHighlightedVerses((prev) => ({
          ...prev,
          [currentVerse.number]: {
            bgColor: `${color}20`,
            textColor: color,
          },
        }));
      }
      setVerseModalVisible(false);
    }
  };

  const toggleFavorito = async () => {
    if (!currentVerse) return;

    const data = await AsyncStorage.getItem(FAVORITOS_KEY);
    let lista: VersiculoFavorito[] = data ? JSON.parse(data) : [];

    if (!favorito) {
      const novoFavorito: VersiculoFavorito = {
        id: currentKey,
        bookName,
        chapterNumber,
        verseNumber: currentVerse.number,
        verse: currentVerse.text,
        bibleVersion: currentBibleVersion,
      };
      lista.push(novoFavorito);
    } else {
      lista = lista.filter((v) => v.id !== currentKey);
    }

    await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(lista));

    const newFavorites = { ...favorites };
    if (!favorito) {
      newFavorites[currentKey] = true;
    } else {
      delete newFavorites[currentKey];
    }

    setFavorites(newFavorites);
    setFavorito(!favorito);
  };

  const saveComment = async () => {
    if (!currentVerse || !commentText.trim()) return;

    const commentId = `${currentKey}-${Date.now()}`;
    const newComment: Comment = {
      id: commentId,
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = { ...comments };
    if (!updatedComments[currentKey]) {
      updatedComments[currentKey] = [];
    }
    updatedComments[currentKey].unshift(newComment);

    try {
      await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));
      setComments(updatedComments);
      setCommentText("");
      setCommentModalVisible(false);
    } catch (error) {
      console.error("Failed to save comment", error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentVerse) return;

    Alert.alert(
      "Excluir Comentário",
      "Tem certeza que deseja excluir este comentário?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const updatedComments = { ...comments };
            if (updatedComments[currentKey]) {
              updatedComments[currentKey] = updatedComments[currentKey].filter(
                (comment) => comment.id !== commentId
              );

              try {
                await AsyncStorage.setItem(
                  COMMENTS_KEY,
                  JSON.stringify(updatedComments)
                );
                setComments(updatedComments);
              } catch (error) {
                console.error("Failed to delete comment", error);
              }
            }
          },
        },
      ]
    );
  };

  const navigateToVerseScreen = () => {
    if (currentVerse) {
      navigation.navigate("Versiculo", {
        verse: currentVerse.text,
        verseNumber: currentVerse.number,
        bookName,
        chapterNumber,
        bibleVersion: currentBibleVersion,
      });
      setVerseModalVisible(false);
    }
  };

  const changeBibleVersion = (version: "ACF" | "AA" | "NIV" | "KJF") => {
    setCurrentBibleVersion(version);
    setVersionModalVisible(false);
    navigation.replace("Versiculos", {
      bookName,
      chapterNumber,
      chapter:
        bibleData.find((b) => b.name === bookName)?.chapters[
        chapterNumber - 1
        ] || chapter,
      totalChapters,
      bibleVersion: version,
      bookAbbrev,
    });
  };

  const searchBible = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    const term = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    try {
      const versionData = bibleData;

      for (const book of versionData) {
        for (
          let chapterIdx = 0;
          chapterIdx < book.chapters.length;
          chapterIdx++
        ) {
          const chapter = book.chapters[chapterIdx];

          for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
            const verseText = chapter[verseIdx];

            if (verseText.toLowerCase().includes(term)) {
              results.push({
                bookName: book.name,
                bookAbbrev: book.abbrev,
                chapterNumber: chapterIdx + 1,
                verseNumber: verseIdx + 1,
                verseText,
                bibleVersion: currentBibleVersion,
              });

              if (results.length >= 100) break;
            }
          }
          if (results.length >= 100) break;
        }
        if (results.length >= 100) break;
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToSearchResult = (result: SearchResult) => {
    setSearchModalVisible(false);
    navigation.replace("Versiculos", {
      bookName: result.bookName,
      chapterNumber: result.chapterNumber,
      chapter:
        bibleData.find((b) => b.name === result.bookName)?.chapters[
        result.chapterNumber - 1
        ] || [],
      totalChapters:
        bibleData.find((b) => b.name === result.bookName)?.chapters.length || 0,
      bibleVersion: currentBibleVersion,
      bookAbbrev,
    });
  };

  const renderVerseItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => {
    const verseNumber = index + 1;
    const isHighlighted = highlightedVerses[verseNumber];
    const verseKey = `${bookName}-${chapterNumber}-${verseNumber}-${currentBibleVersion}`;
    const isFavorite = favorites[verseKey] || false;
    const hasComments = comments[verseKey]?.length > 0;

    const highlightStyle = isHighlighted
      ? {
        backgroundColor: isHighlighted.bgColor,
        borderLeftColor: isHighlighted.textColor,
      }
      : {};

    return (
      <TouchableOpacity
        style={[styles.verseItem, highlightStyle]}
        onPress={() => handleVersePress(verseNumber, item)}
        activeOpacity={0.7}
      >
        <View style={styles.verseNumberContainer}>
          <Text
            style={[
              styles.verseNumber,
              isHighlighted && {
                color: isHighlighted.textColor,
                fontWeight: "600",
              },
            ]}
          >
            {verseNumber}
          </Text>

          {(isFavorite || hasComments) && (
            <View style={styles.verseIconsContainer}>
              {isFavorite && (
                <View style={styles.verseIconButton}>
                  <Ionicons name="heart" size={20} color="red" />
                </View>
              )}

              {hasComments && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setCurrentVerse({
                      number: verseNumber,
                      text: item,
                    });
                    setViewCommentModalVisible(true);
                  }}
                  style={styles.verseIconButton}
                >
                  <Ionicons name="chatbubble" size={20} color="#3498db" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text
          style={[
            styles.verseText,
            { fontSize },
            isHighlighted && { color: isHighlighted.textColor },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    return (
      <View style={styles.footerContainer}>
        <View style={styles.footerButtons}>
          {chapterNumber > 1 && previousChapter && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                navigation.replace("Versiculos", {
                  bookName,
                  chapterNumber: chapterNumber - 1,
                  chapter: previousChapter,
                  totalChapters,
                  bibleVersion: currentBibleVersion,
                  bookAbbrev,
                });
              }}
            >
              <Ionicons
                name="arrow-back-circle-outline"
                size={28}
                color="#007AFF"
              />
              <Text style={styles.navButtonText}>Anterior</Text>
            </TouchableOpacity>
          )}

          {chapterNumber < totalChapters && nextChapter && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                navigation.replace("Versiculos", {
                  bookName,
                  chapterNumber: chapterNumber + 1,
                  chapter: nextChapter,
                  totalChapters,
                  bibleVersion: currentBibleVersion,
                  bookAbbrev,
                });
              }}
            >
              <Text style={styles.navButtonText}>Próximo</Text>
              <Ionicons
                name="arrow-forward-circle-outline"
                size={28}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderVersionModal = () => (
    <Modal
      transparent={true}
      visible={versionModalVisible}
      onRequestClose={() => setVersionModalVisible(false)}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={() => setVersionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.versionModalContainer}>
              <Text style={styles.modalTitle}>Selecione a Versão</Text>
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  currentBibleVersion === "ACF" && styles.activeVersionOption,
                ]}
                onPress={() => changeBibleVersion("ACF")}
              >
                <Text style={styles.versionOptionText}>
                  Almeida Corrigida Fiel (ACF)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  currentBibleVersion === "AA" && styles.activeVersionOption,
                ]}
                onPress={() => changeBibleVersion("AA")}
              >
                <Text style={styles.versionOptionText}>
                  Almeida Atualizada (AA)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  currentBibleVersion === "NIV" && styles.activeVersionOption,
                ]}
                onPress={() => changeBibleVersion("NIV")}
              >
                <Text style={styles.versionOptionText}>
                  Nova Versão Internacional (NVI)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  currentBibleVersion === "KJF" && styles.activeVersionOption,
                ]}
                onPress={() => changeBibleVersion("KJF")}
              >
                <Text style={styles.versionOptionText}>
                  King James Fiel (KJF)
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderIntroModal = () => (
    <Modal
      transparent={false}
      visible={introModalVisible}
      onRequestClose={() => setIntroModalVisible(false)}
      animationType="slide"
    >
      <SafeAreaView style={styles.modalIntroContainer}>

        {/* Cabeçalho Fixo */}
        {/* <View style={styles.modalIntroHeader}> */}
        <View style={styles.backIntroHeader}>
          <TouchableOpacity onPress={() => setIntroModalVisible(false)}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.modalIntroHeader}>
          <Text style={styles.modalIntroTitle}>{introData.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Conteúdo Rolável */}
        <ScrollView
          style={styles.modalIntroContent}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {introData.author && (
            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Autor: </Text>
              {introData.author}
            </Text>
          )}

          {introData.theme && (
            <Text style={styles.metaText}>
              <Text style={styles.metaLabel}>Tema: </Text>
              {introData.theme}
            </Text>
          )}

          <Text style={styles.contentText}>{introData.content}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderSearchModal = () => (
    <Modal
      transparent={false}
      visible={searchModalVisible}
      onRequestClose={() => setSearchModalVisible(false)}
      animationType="slide"
    >
      <View style={styles.searchModalContainer}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSearchModalVisible(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar na Bíblia..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus={true}
            onSubmitEditing={searchBible}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchBible}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="search" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Buscando...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) =>
              `${item.bookAbbrev}-${item.chapterNumber}-${item.verseNumber}-${index}`
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => navigateToSearchResult(item)}
              >
                <Text style={styles.searchResultReference}>
                  {item.bookName} {item.chapterNumber}:{item.verseNumber}
                </Text>
                <Text style={styles.searchResultText}>{item.verseText}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.searchResultsContainer}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>
              {searchTerm
                ? "Nenhum resultado encontrado"
                : "Digite um termo para buscar"}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  const renderCommentModal = () => (
    <Modal
      transparent={true}
      visible={commentModalVisible}
      onRequestClose={() => setCommentModalVisible(false)}
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.commentModalContainer}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.commentModalContent}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Adicionar Comentário</Text>
              <TouchableOpacity
                onPress={() => setCommentModalVisible(false)}
                style={styles.commentModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.commentVerseReference}>
              {bookName} {chapterNumber}:{currentVerse?.number}
            </Text>
            <Text style={styles.commentVerseText}>{currentVerse?.text}</Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Digite seu comentário..."
              multiline
              numberOfLines={4}
              value={commentText}
              onChangeText={setCommentText}
              autoFocus
            />

            <View style={styles.commentModalButtons}>
              <TouchableOpacity
                style={styles.commentCancelButton}
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={styles.commentButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.commentSaveButton,
                  !commentText.trim() && styles.disabledButton,
                ]}
                onPress={saveComment}
                disabled={!commentText.trim()}
              >
                <Text style={styles.commentButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderViewCommentModal = () => {
    if (!currentVerse) return null;

    const verseKey = `${bookName}-${chapterNumber}-${currentVerse.number}-${currentBibleVersion}`;
    const verseComments = comments[verseKey] || [];

    return (
      <Modal
        transparent={true}
        visible={viewCommentModalVisible}
        onRequestClose={() => setViewCommentModalVisible(false)}
        animationType="fade"
      >
        <View style={styles.viewCommentModalContainer}>
          <View style={styles.viewCommentModalContent}>
            <View style={styles.viewCommentModalHeader}>
              <Text style={styles.viewCommentModalTitle}>
                Comentários - {bookName} {chapterNumber}:{currentVerse.number}
              </Text>
              <TouchableOpacity
                onPress={() => setViewCommentModalVisible(false)}
                style={styles.viewCommentModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {verseComments.length > 0 ? (
                verseComments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <View style={styles.commentFooter}>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteComment(comment.id)}
                        style={styles.deleteCommentButton}
                      >
                        <Ionicons name="trash" size={16} color="#ff4d4f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                  <Text style={styles.noCommentsText}>
                    Nenhum comentário ainda
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.addCommentButton}
              onPress={() => {
                setViewCommentModalVisible(false);
                setCommentModalVisible(true);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addCommentButtonText}>
                Adicionar Comentário
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const increaseFontSize = () => {
    setFontSize((prev) => prev + 2);
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => (prev > 12 ? prev - 2 : prev));
  };

  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.versionButton}
          onPress={() => setVersionModalVisible(true)}
        >
          <Text style={styles.versionButtonText}>Versão : </Text>
          <Text style={styles.versionButtonList}>{currentBibleVersion}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setSearchModalVisible(true)}
        >
          <Ionicons name="search" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>


      <View style={styles.header}>
        <Text style={styles.titleheader}>{bookName}</Text>
      </View>
      <View style={styles.header}>
        <Image style={styles.imgheader} source={APP_LOGO} />
        <Text style={styles.txtheader}>Capítulo {chapterNumber}</Text>
        <TouchableOpacity onPress={() => setIntroModalVisible(true)}>
          <View style={styles.btnIntroContainer}>
            <Text style={styles.btnIntroTxt}>INTRO</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentChapter}
        renderItem={renderVerseItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        extraData={[favorites, currentBibleVersion, comments]}
      />

      {/* Modal de versículo */}
      <Modal
        transparent={true}
        visible={verseModalVisible}
        onRequestClose={() => setVerseModalVisible(false)}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setVerseModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Image
                    source={APP_LOGO}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                  <Text style={styles.modalTitle}>
                    Versículo {currentVerse?.number}
                  </Text>
                </View>

                <View style={styles.colorGrid}>
                  {COLOR_PALETTE.map((color) => (
                    <View key={color} style={styles.colorContainer}>
                      <TouchableOpacity
                        style={[styles.colorCircle, { backgroundColor: color }]}
                        onPress={() => handleColorSelect(color)}
                      />
                      {currentVerse?.currentColor === color && (
                        <View style={styles.removeIndicator}>
                          <Ionicons name="close" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.favoriteButton]}
                    onPress={toggleFavorito}
                  >
                    <Ionicons
                      name={favorito ? "heart" : "heart-outline"}
                      size={20}
                      color={favorito ? "red" : "black"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.commentButton]}
                    onPress={() => {
                      setVerseModalVisible(false);
                      setCommentModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="black"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.shareButton]}
                    onPress={navigateToVerseScreen}
                  >
                    <Ionicons
                      name="share-social-sharp"
                      size={20}
                      color="black"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de adicionar comentário */}
      {renderCommentModal()}

      {/* Modal de visualizar comentários */}
      {renderViewCommentModal()}

      {/* Modal de seleção de versão */}
      {renderVersionModal()}

      {/* Modal de busca */}
      {renderSearchModal()}

      {/* Modal de busca */}
      {renderIntroModal()}

      {/* Botões flutuantes */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={increaseFontSize}
      >
        <Ionicons name="add" size={24} color="#ffff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.floatingButton, { bottom: 80 }]}
        onPress={decreaseFontSize}
      >
        <Ionicons name="remove" size={24} color="#ffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
        paddingBottom: Platform.select({
          android: 60,
          ios: 10,
        }),
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: Platform.select({
      android: 25,
      ios: 0,
    }),
  },
  searchIconButton: {
    padding: 8,
  },
  versionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  versionButtonText: {
    color: "#000",
    fontSize: 18,
    marginRight: 5,
    fontWeight: "500",
    fontFamily: "Montserrat_500Medium",
  },
  versionButtonList: {
    color: "#007AFF",
    fontSize: 18,
    marginRight: 5,
    fontWeight: "500",
    fontFamily: "Montserrat_500Medium",
  },
  header: {
    backgroundColor: "transparent",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 10,
  },
  imgheader: {
    width: 45,
    height: 45,
  },
   titleheader: {
    marginTop:5,
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  txtheader: {
    fontSize: 24,
    fontWeight:'200',
    color: "#000",
    paddingVertical: 10,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  listContent: {
    padding: 16,
    paddingBottom: 150,
  },
  verseItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 2,
    marginHorizontal: -8,
    marginVertical: 2,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  verseNumberContainer: {
    // container numero versiculo
    flexDirection: "column",
    alignItems: "center",
    marginRight: 15,
    width: 40,
    minHeight: 40,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
    marginTop: 2,
    marginLeft: 6,
  },
  verseIconsContainer: {
    // Icones 'fav' e 'coment'
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 7,
  },
  verseIconButton: {
    padding: 2,
    marginVertical: 5,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
  },
  footerContainer: {
    marginTop: 20,
    marginHorizontal:50
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 1,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    elevation: 5,
    alignItems: "center",
  },
  versionModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: width * 0.85,
    elevation: 5,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  commentModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  commentModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  viewCommentModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  viewCommentModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  commentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  viewCommentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  viewCommentModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  commentModalCloseButton: {
    padding: 5,
  },
  viewCommentModalCloseButton: {
    padding: 5,
    marginLeft: 10,
  },
  commentVerseReference: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  commentVerseText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
    fontStyle: "italic",
    fontFamily: "Montserrat_500Medium",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: "top",
  },
  commentModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  commentCancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  commentSaveButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentsList: {
    padding: 15,
    maxHeight: height * 0.5,
  },
  commentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  commentText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  commentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentDate: {
    fontSize: 12,
    color: "#888",
  },
  deleteCommentButton: {
    padding: 5,
  },
  noCommentsContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noCommentsText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  addCommentButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  addCommentButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: height * 0.05,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 10,
  },
  searchButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  searchResultsContainer: {
    padding: 10,
  },
  searchResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchResultReference: {
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  searchResultText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
  versionOption: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: "#f5f5f5",
  },
  activeVersionOption: {
    backgroundColor: "#e6f7ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  versionOptionText: {
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 5,
  },
  colorContainer: {
    margin: 8,
    position: "relative",
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 20,
  },
  removeIndicator: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#ff4d4f",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  favoriteButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  commentButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  shareButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  floatingButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "#000",
    opacity: 0.9,
    borderRadius: 50,
    padding: 12,
    elevation: 5,
    bottom: Platform.select({
          android: 150,
          ios: 150,
        }),
  },
  metaText: {
    fontSize: 18,
    marginBottom: 8,
    color: "#444",
  },
  metaLabel: {
    fontWeight: "bold",
    color: "#000",
  },
  contentText: {
    fontSize: 16,
    lineHeight: 28,
    marginTop: 16,
    color: "#333",

  },
  btnIntroContainer: {
    backgroundColor: "#000",
    borderRadius: 5,
    padding: 5
  },
  btnIntroTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: "#fff",
    fontFamily: "Montserrat_500Medium",
  },


  modalIntroContainer: {
    backgroundColor: "#f7ebdb",
    borderRadius: 16,
    padding: 20,
    marginLeft: "7%",
    width: width * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: "20%",
      },
      android: {
        elevation: 10,
        marginTop: "10%",
      },
    }),
    alignItems: "center",
  },
  modalIntroHeader: {
    alignItems: "center",
  },
  backIntroHeader: {
    position: 'absolute',
    left: 15,
    top: 15
  },
  modalIntroTitle: {
    fontSize: 26,
    fontWeight: "bold",
  },
  modalIntroContent: {
    padding: 15,
    height: "auto",
  },
});

export default ChapterScreen;
