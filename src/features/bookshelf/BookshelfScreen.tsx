import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookCard } from '../../components/BookCard';
import { SectionTitle } from '../../components/SectionTitle';
import { useLibrary } from '../../state/library-context';
import { colors } from '../../theme/tokens';

type BookshelfScreenProps = {
  onOpenBook: (bookId: string) => void;
};

export function BookshelfScreen({ onOpenBook }: BookshelfScreenProps) {
  const {
    state: { books, currentPageByBookId },
    lastOpenedBook
  } = useLibrary();

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <SectionTitle
        eyebrow="Flash Read"
        title="你的书架"
        description="围绕书架管理与沉浸式阅读的 React Native MVP 骨架。"
      />

      {lastOpenedBook ? (
        <Pressable onPress={() => onOpenBook(lastOpenedBook.id)} style={styles.resumeCard}>
          <Text style={styles.resumeLabel}>继续阅读</Text>
          <Text style={styles.resumeTitle}>{lastOpenedBook.title}</Text>
          <Text style={styles.resumeMeta}>
            第 {(currentPageByBookId[lastOpenedBook.id] ?? 0) + 1} 页 / 共 {lastOpenedBook.pages.length} 页
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionName}>书架管理</Text>
        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>书架还是空的</Text>
            <Text style={styles.emptyDescription}>后续可以在这里接入搜索、导入和书城能力。</Text>
          </View>
        ) : (
          books.map((book) => {
            const page = currentPageByBookId[book.id] ?? 0;
            const progressLabel = `已读 ${page + 1}/${book.pages.length} 页`;

            return (
              <BookCard
                book={book}
                key={book.id}
                onPress={() => onOpenBook(book.id)}
                progressLabel={progressLabel}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    gap: 24,
    padding: 20,
    paddingTop: 72
  },
  resumeCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    gap: 8,
    padding: 20
  },
  resumeLabel: {
    color: '#EEDFC9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  resumeTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700'
  },
  resumeMeta: {
    color: '#F7ECDD',
    fontSize: 14
  },
  section: {
    gap: 14
  },
  sectionName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  }
});

