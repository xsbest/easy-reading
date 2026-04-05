import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useReducer
} from 'react';

import { mockBooks } from '../data/mockBooks';
import { voicePresets } from '../data/voicePresets';
import { Book, BookRemoteContentPayload, LibraryState } from '../types/book';

type LibraryAction =
  | { type: 'OPEN_BOOK'; bookId: string }
  | { type: 'CLOSE_BOOK' }
  | { type: 'NEXT_PAGE'; bookId: string }
  | { type: 'PREVIOUS_PAGE'; bookId: string }
  | { type: 'GO_TO_PAGE'; bookId: string; page: number }
  | { type: 'START_NARRATION'; bookId: string; page: number }
  | { type: 'PAUSE_NARRATION' }
  | { type: 'RESUME_NARRATION' }
  | { type: 'STOP_NARRATION' }
  | { type: 'SET_VOICE_PRESET'; presetId: string }
  | { type: 'HYDRATE_BOOK_CONTENT'; bookId: string; content: BookRemoteContentPayload };

type LibraryContextValue = {
  state: LibraryState;
  selectedBook: Book | null;
  lastOpenedBook: Book | null;
  openBook: (bookId: string) => void;
  closeBook: () => void;
  nextPage: (bookId: string) => void;
  previousPage: (bookId: string) => void;
  goToPage: (bookId: string, page: number) => void;
  startNarration: (bookId: string, page: number) => void;
  pauseNarration: () => void;
  resumeNarration: () => void;
  stopNarration: () => void;
  setVoicePreset: (presetId: string) => void;
  hydrateBookContent: (bookId: string, content: BookRemoteContentPayload) => void;
};

const initialState: LibraryState = {
  books: mockBooks,
  selectedBookId: null,
  lastOpenedBookId: null,
  currentPageByBookId: Object.fromEntries(mockBooks.map((book) => [book.id, 0])),
  isNarrationActive: false,
  isNarrationPaused: false,
  narrationBookId: null,
  narrationPageByBookId: Object.fromEntries(mockBooks.map((book) => [book.id, 0])),
  selectedVoicePresetId: voicePresets[0].id
};

function clampPage(book: Book | undefined, page: number) {
  if (!book) {
    return 0;
  }

  return Math.max(0, Math.min(page, book.pages.length - 1));
}

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'OPEN_BOOK':
      return {
        ...state,
        selectedBookId: action.bookId,
        lastOpenedBookId: action.bookId
      };
    case 'CLOSE_BOOK':
      return {
        ...state,
        selectedBookId: null
      };
    case 'NEXT_PAGE': {
      const book = state.books.find((item) => item.id === action.bookId);
      const currentPage = state.currentPageByBookId[action.bookId] ?? 0;
      const nextPage = clampPage(book, currentPage + 1);

      return {
        ...state,
        currentPageByBookId: {
          ...state.currentPageByBookId,
          [action.bookId]: nextPage
        }
      };
    }
    case 'PREVIOUS_PAGE': {
      const book = state.books.find((item) => item.id === action.bookId);
      const currentPage = state.currentPageByBookId[action.bookId] ?? 0;
      const previousPage = clampPage(book, currentPage - 1);

      return {
        ...state,
        currentPageByBookId: {
          ...state.currentPageByBookId,
          [action.bookId]: previousPage
        }
      };
    }
    case 'GO_TO_PAGE': {
      const book = state.books.find((item) => item.id === action.bookId);

      return {
        ...state,
        currentPageByBookId: {
          ...state.currentPageByBookId,
          [action.bookId]: clampPage(book, action.page)
        }
      };
    }
    case 'START_NARRATION':
      return {
        ...state,
        isNarrationActive: true,
        isNarrationPaused: false,
        narrationBookId: action.bookId,
        narrationPageByBookId: {
          ...state.narrationPageByBookId,
          [action.bookId]: action.page
        }
      };
    case 'PAUSE_NARRATION':
      return {
        ...state,
        isNarrationPaused: state.isNarrationActive
      };
    case 'RESUME_NARRATION':
      return {
        ...state,
        isNarrationPaused: false
      };
    case 'STOP_NARRATION':
      return {
        ...state,
        isNarrationActive: false,
        isNarrationPaused: false,
        narrationBookId: null
      };
    case 'SET_VOICE_PRESET':
      return {
        ...state,
        selectedVoicePresetId: voicePresets.some((preset) => preset.id === action.presetId)
          ? action.presetId
          : state.selectedVoicePresetId
      };
    case 'HYDRATE_BOOK_CONTENT': {
      const nextBooks = state.books.map((book) =>
        book.id === action.bookId
          ? {
              ...book,
              ...action.content,
              pages: action.content.pages,
              translatedPages: action.content.translatedPages,
              tableOfContents: action.content.tableOfContents ?? book.tableOfContents
            }
          : book
      );
      const updatedBook = nextBooks.find((book) => book.id === action.bookId);

      return {
        ...state,
        books: nextBooks,
        currentPageByBookId: {
          ...state.currentPageByBookId,
          [action.bookId]: clampPage(updatedBook, state.currentPageByBookId[action.bookId] ?? 0)
        },
        narrationPageByBookId: {
          ...state.narrationPageByBookId,
          [action.bookId]: clampPage(updatedBook, state.narrationPageByBookId[action.bookId] ?? 0)
        }
      };
    }
    default:
      return state;
  }
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(libraryReducer, initialState);

  const value = useMemo<LibraryContextValue>(() => {
    const selectedBook = state.books.find((book) => book.id === state.selectedBookId) ?? null;
    const lastOpenedBook =
      state.books.find((book) => book.id === state.lastOpenedBookId) ?? null;

    return {
      state,
      selectedBook,
      lastOpenedBook,
      openBook: (bookId: string) => dispatch({ type: 'OPEN_BOOK', bookId }),
      closeBook: () => dispatch({ type: 'CLOSE_BOOK' }),
      nextPage: (bookId: string) => dispatch({ type: 'NEXT_PAGE', bookId }),
      previousPage: (bookId: string) => dispatch({ type: 'PREVIOUS_PAGE', bookId }),
      goToPage: (bookId: string, page: number) => dispatch({ type: 'GO_TO_PAGE', bookId, page }),
      startNarration: (bookId: string, page: number) =>
        dispatch({ type: 'START_NARRATION', bookId, page }),
      pauseNarration: () => dispatch({ type: 'PAUSE_NARRATION' }),
      resumeNarration: () => dispatch({ type: 'RESUME_NARRATION' }),
      stopNarration: () => dispatch({ type: 'STOP_NARRATION' }),
      setVoicePreset: (presetId: string) => dispatch({ type: 'SET_VOICE_PRESET', presetId }),
      hydrateBookContent: (bookId: string, content: BookRemoteContentPayload) =>
        dispatch({ type: 'HYDRATE_BOOK_CONTENT', bookId, content })
    };
  }, [state]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }

  return context;
}
