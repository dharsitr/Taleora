import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getBookDetails } from "../../services/bookService";
import { getBookReadingProgress } from "../../services/readerService";
import { BookDetail, Chapter } from "../../types";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

export const BookDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { bookSlug, bookId } = route.params;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [readingProgress, setReadingProgress] = useState<{
    current_chapter_id: string | null;
    progress_percentage: number;
    is_completed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const detail = await getBookDetails(bookSlug || bookId);
        setBook(detail);

        if (user && detail) {
          const progress = await getBookReadingProgress(user.id, detail.id);
          setReadingProgress(progress);
        }
      } catch (err) {
        console.error("Error loading book detail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookSlug, bookId, user]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>
          Story Not Found
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        />
      </SafeAreaView>
    );
  }

  const handleStartReading = (chapterSlug?: string) => {
    const targetSlug =
      chapterSlug ||
      book.chapters.find((c) => c.id === readingProgress?.current_chapter_id)?.slug ||
      book.chapters[0]?.slug;

    navigation.navigate("Reader", {
      bookSlug: book.slug,
      chapterSlug: targetSlug,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover & Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.coverContainer, { backgroundColor: colors.surfaceHover }]}>
            {book.cover_image_url ? (
              <Image
                source={{ uri: book.cover_image_url }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="book-outline" size={54} color={colors.accent} />
            )}
          </View>

          <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>
            {book.title}
          </Text>

          {book.subtitle && (
            <Text style={[styles.bookSubtitle, { color: colors.textSecondary }]}>
              {book.subtitle}
            </Text>
          )}

          <Text style={[styles.authorName, { color: colors.accent }]}>
            By {book.author.display_name}
          </Text>

          {/* Genres */}
          <View style={styles.genreChipsRow}>
            {book.genres.map((g) => (
              <Badge key={g.id} label={g.name} style={styles.genreBadge} />
            ))}
          </View>

          {/* Stats Metrics Bar */}
          <View
            style={[
              styles.metricsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricItem}>
              <View style={styles.metricRatingRow}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                  {book.average_rating > 0 ? book.average_rating.toFixed(1) : "New"}
                </Text>
              </View>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                {book.ratings_count} {book.ratings_count === 1 ? "Rating" : "Ratings"}
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {book.chapters.length}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                Chapters
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {book.chapters.reduce((acc, c) => acc + (c.estimated_read_minutes || 3), 0)}m
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                Total Read
              </Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            title={
              readingProgress && readingProgress.progress_percentage > 0
                ? `Continue Reading (${Math.round(readingProgress.progress_percentage)}%)`
                : "Start Reading"
            }
            size="large"
            icon={<Ionicons name="book-outline" size={18} color="#ffffff" />}
            onPress={() => handleStartReading()}
            style={styles.ctaButton}
          />
        </View>

        {/* Synopsis / Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Synopsis
          </Text>
          <Text style={[styles.synopsisText, { color: colors.textSecondary }]}>
            {book.synopsis || book.description || "No synopsis provided for this story."}
          </Text>
        </View>

        {/* Chapter Table of Contents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Table of Contents ({book.chapters.length})
          </Text>

          {book.chapters.length === 0 ? (
            <Text style={[styles.noChaptersText, { color: colors.textMuted }]}>
              No published chapters available yet.
            </Text>
          ) : (
            book.chapters.map((chapter) => {
              const isCurrent =
                readingProgress?.current_chapter_id === chapter.id;

              return (
                <TouchableOpacity
                  key={chapter.id}
                  activeOpacity={0.7}
                  onPress={() => handleStartReading(chapter.slug)}
                  style={[
                    styles.chapterItem,
                    {
                      backgroundColor: isCurrent ? colors.accent + "15" : colors.surface,
                      borderColor: isCurrent ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <View style={styles.chapterNumberBadge}>
                    <Text
                      style={[
                        styles.chapterNumberText,
                        { color: isCurrent ? colors.accent : colors.textMuted },
                      ]}
                    >
                      {chapter.chapter_number}
                    </Text>
                  </View>

                  <View style={styles.chapterInfo}>
                    <Text
                      style={[
                        styles.chapterTitle,
                        { color: isCurrent ? colors.accent : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {chapter.title}
                    </Text>
                    <Text style={[styles.chapterMeta, { color: colors.textMuted }]}>
                      {chapter.word_count} words • {chapter.estimated_read_minutes || 3} min read
                    </Text>
                  </View>

                  <Ionicons
                    name={isCurrent ? "play-circle" : "chevron-forward"}
                    size={20}
                    color={isCurrent ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  coverContainer: {
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: -0.3,
  },
  bookSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  genreChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
  },
  genreBadge: {
    margin: 4,
  },
  metricsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 3,
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  ctaButton: {
    width: "100%",
    marginTop: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 22,
  },
  noChaptersText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  chapterNumberBadge: {
    width: 28,
    alignItems: "center",
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chapterInfo: {
    flex: 1,
    marginLeft: 10,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  chapterMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
