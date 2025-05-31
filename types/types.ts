export type RootStackParamList = {

  Quiz: undefined;
  Ranking: undefined;
  Questionario: undefined | { onComplete: (dados: any) => void };
  MNDD: undefined;
  Igreja: undefined;
  Usuarios: undefined;
  Carrossel: undefined;
  Cultos: undefined;
  Notificacao: undefined;
  AreaAdm: undefined;
  Login: undefined;
  Favoritos: undefined;
  Livros: undefined;
  BibleAssistant: undefined;
  EstudosScreen: undefined;
  HarpaScreen: undefined;
  Capitulos: {
    book: Book;
    bookName: string;
    bibleVersion: "ACF" | "AA" | "NIV" | "KJF";
  };
  Versiculos: {
    chapter: string[];
    chapterNumber: number;
    bookName: string;
    totalChapters: number;
    bibleVersion: "ACF" | "AA" | "NIV" | "KJF";
    bookAbbrev: string;
  };
  Versiculo: {
    verse: string;
    verseNumber: number;
    bookName: string;
    chapterNumber: number;
    bibleVersion: "ACF" | "AA" | "NIV" | "KJF";
  };
};

export type Book = {
  abbrev: string;
  chapters: string[][];
  name?: string;
};

export type BibleData = Book[];

export type BookIntroduction = {
  title: string;
  author?: string;
  date?: string;
  theme?: string;
  content: string;
};

// Tipo com todas as abreviações possíveis
export type BibleAbbreviation =
  | "gn"
  | "ex"
  | "lv"
  | "nm"
  | "dt"
  | "js"
  | "jz"
  | "rt"
  | "1sm"
  | "2sm"
  | "1rs"
  | "2rs"
  | "1cr"
  | "2cr"
  | "ed"
  | "ne"
  | "et"
  | "jó"
  | "sl"
  | "pv"
  | "ec"
  | "ct"
  | "is"
  | "jr"
  | "lm"
  | "ez"
  | "dn"
  | "os"
  | "jl"
  | "am"
  | "ob"
  | "jn"
  | "mq"
  | "na"
  | "hc"
  | "sf"
  | "ag"
  | "zc"
  | "ml"
  | "mt"
  | "mc"
  | "lc"
  | "jo"
  | "atos"
  | "rm"
  | "1co"
  | "2co"
  | "gl"
  | "ef"
  | "fp"
  | "cl"
  | "1ts"
  | "2ts"
  | "1tm"
  | "2tm"
  | "tt"
  | "fm"
  | "hb"
  | "tg"
  | "1pe"
  | "2pe"
  | "1jo"
  | "2jo"
  | "3jo"
  | "jd"
  | "ap";

export type IntroductionsData = {
  [key in BibleAbbreviation]: BookIntroduction;
} & {
  [key: string]: BookIntroduction;
};
