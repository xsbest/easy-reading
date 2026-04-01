import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '../types/book';
import { colors } from '../theme/tokens';

type BookCardProps = {
  book: Book;
  progressLabel: string;
  onPress: () => void;
};

export function BookCard({ book, progressLabel, onPress }: BookCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.cover, { backgroundColor: book.accentColor }]}>
        <Text style={styles.coverTitle}>{book.title}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        <Text numberOfLines={2} style={styles.description}>
          {book.description}
        </Text>
        <Text style={styles.progress}>{progressLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 16
  },
  pressed: {
    opacity: 0.88
  },
  cover: {
    alignItems: 'flex-start',
    borderRadius: 16,
    justifyContent: 'flex-end',
    minHeight: 140,
    padding: 14,
    width: 96
  },
  coverTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700'
  },
  content: {
    flex: 1,
    gap: 8,
    justifyContent: 'center'
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  author: {
    color: colors.textSecondary,
    fontSize: 14
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  progress: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
  }
});

