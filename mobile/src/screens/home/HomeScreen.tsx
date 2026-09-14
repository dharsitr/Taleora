import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getFeaturedBooks, getTrendingBooks, getGenres } from "../../services/bookService";
import { getUserLibrary } from "../../services/libraryService";
import { Book, Genre, ReadingProgress } from "../../types";
import { BookCard } from "../../components/book/BookCard";
import { ContinueReadingCard } from "../../components/book/ContinueReadingCard";

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, profile } = useAuth();

  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [recentProgress, setRecentProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [featured, trending, genresList] = await Promise.all([
        getFeaturedBooks(6),
        getTrendingBooks(8),
        getGenres(),
      ]);

      setFeaturedBooks(featured);
      setTrendingBooks(trending);
      setGenres(genresList);

      if (user) {
        const library = await getUserLibrary(user.id);
        if (library.currentlyReading.length > 0) {
          setRecentProgress(library.currentlyReading[0]);
        } else {
          setRecentProgress(null);
        }
      }
    } catch (err) {
      console.error("Error loading home data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBookPress = (book: Book) => {
    navigation.navigate("BookDetail", { bookSlug: book.slug, bookId: book.id });
  };

  const handleContinueReading = () => {
    if (!recentProgress || !recentProgress.book) return;
    navigation.navigate("Reader", {
      bookSlug: recentProgress.book.slug,
      chapterSlug: recentProgress.current_chapter?.slug,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top App Bar */}
      <View
        style={[
          styles.appBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Tale<Text style={{ color: colors.accent }}>ora</Text>
          </Text>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {user && profile?.username
              ? `Welcome back, ${profile.username}`
              : "Discover captivating stories"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.searchIconButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate("ExploreTab")}
        >
          <Ionicons name="search" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Curating your library...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {/* Active Reading Progress (if user has active book) */}
          {recentProgress && (
            <View style={styles.section}>
              <ContinueReadingCard
                progress={recentProgress}
                onPress={handleContinueReading}
              />
            </View>
          )}

          {/* Featured Stories Carousel */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Featured Stories
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ExploreTab", { sort: "featured" })}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featuredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onPress={() => handleBookPress(book)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Genres Chips */}
          {genres.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Browse by Genre
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genresList}
              >
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    onPress={() =>
                      navigation.navigate("ExploreTab", { genreSlug: genre.slug })
                    }
                    style={[
                      styles.genreChip,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.genreChipText, { color: colors.textPrimary }]}
                    >
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Trending Books */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Trending Now
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ExploreTab", { sort: "popular" })}
              >
                <Text style={[styles.seeAllText, { color: colors.accent }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.verticalList}>
              {trendingBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  layout="list"
                  onPress={() => handleBookPress(book)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 12,
    marginTop: 2,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  horizontalList: {
    paddingRight: 16,
  },
  genresList: {
    paddingRight: 16,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  verticalList: {
    marginTop: 4,
  },
});
