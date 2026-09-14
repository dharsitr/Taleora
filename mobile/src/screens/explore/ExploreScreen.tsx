import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getBooks, getGenres, BookFilterParams } from "../../services/bookService";
import { Book, Genre } from "../../types";
import { BookCard } from "../../components/book/BookCard";

export const ExploreScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();

  const initialGenre = route.params?.genreSlug || "all";
  const initialSort = route.params?.sort || "featured";

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<BookFilterParams["sortBy"]>(initialSort);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGenres = async () => {
    const list = await getGenres();
    setGenres([{ id: "all", name: "All Genres", slug: "all" }, ...list]);
  };

  const loadBooks = useCallback(async () => {
    try {
      const results = await getBooks({
        search: search.trim() || undefined,
        genreSlug: selectedGenre !== "all" ? selectedGenre : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
        limit: 40,
      });
      setBooks(results);
    } catch (err) {
      console.error("Error exploring books:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedGenre, minRating, sortBy]);

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      loadBooks();
    }, 250); // debounce search
    return () => clearTimeout(timer);
  }, [loadBooks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const handleBookPress = (book: Book) => {
    navigation.navigate("BookDetail", { bookSlug: book.slug, bookId: book.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search stories, authors, or genres..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips (Genre & Rating) */}
      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {genres.map((g) => {
            const isSelected = selectedGenre === g.slug;
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => setSelectedGenre(g.slug)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? "#ffffff" : colors.textPrimary,
                    },
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Rating & Sort Quick Toggles */}
        <View style={styles.subFiltersRow}>
          <TouchableOpacity
            onPress={() => setMinRating((prev) => (prev === 4 ? 0 : 4))}
            style={[
              styles.subFilterBtn,
              {
                backgroundColor: minRating === 4 ? colors.accent + "20" : colors.surface,
                borderColor: minRating === 4 ? colors.accent : colors.border,
              },
            ]}
          >
            <Ionicons
              name="star"
              size={12}
              color={minRating === 4 ? colors.accent : colors.textSecondary}
            />
            <Text
              style={[
                styles.subFilterBtnText,
                { color: minRating === 4 ? colors.accent : colors.textSecondary },
              ]}
            >
              4.0+ Stars
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setSortBy((prev) =>
                prev === "featured"
                  ? "popular"
                  : prev === "popular"
                  ? "rating"
                  : prev === "rating"
                  ? "newest"
                  : "featured"
              )
            }
            style={[styles.subFilterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="swap-vertical" size={13} color={colors.accent} />
            <Text style={[styles.subFilterBtnText, { color: colors.textPrimary }]}>
              Sort: {sortBy?.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="book-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No stories found
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Try modifying your search keywords or active filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          renderItem={({ item }) => (
            <BookCard
              book={item}
              style={{ width: "47%", marginRight: 0 }}
              onPress={() => handleBookPress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filtersSection: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subFiltersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  subFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  subFilterBtnText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
});
