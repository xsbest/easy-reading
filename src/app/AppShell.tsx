import { SafeAreaView, StyleSheet } from 'react-native';

import { BookshelfScreen } from '../features/bookshelf/BookshelfScreen';
import { ReaderScreen } from '../features/reader/ReaderScreen';
import { useLibrary } from '../state/library-context';
import { colors } from '../theme/tokens';

export function AppShell() {
  const { selectedBook, openBook, closeBook } = useLibrary();

  return (
    <SafeAreaView style={styles.safeArea}>
      {selectedBook ? (
        <ReaderScreen book={selectedBook} onClose={closeBook} />
      ) : (
        <BookshelfScreen onOpenBook={openBook} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  }
});
