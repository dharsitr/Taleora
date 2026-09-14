import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getUserLibrary, UserLibraryData } from "../../services/libraryService";
import { getUserBookmarks, getUserHighlights, deleteBookmark, deleteHighlight } from "../../services/annotationService";
import { Bookmark, Highlight, ReadingProgress } from "../../types";
import { Button } from "../../components/common/Button";

type LibraryTab = "reading" | "completed" | "annotations";

export const LibraryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<LibraryTab>("reading");
  const [libraryData, setLibraryData] = useState<UserLibraryData>({
    currentlyReading: [],
    completed: [],
    all: [],
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [lib, bm, hl] = await Promise.all([
        getUserLibrary(user.id),
        getUserBookmarks(user.id),
        getUserHighlights(user.id),
      ]);

      setLibraryData(lib);
      setBookmarks(bm);
      setHighlights(hl);
    } catch (err) {
      console.error("Error loading library data:", err);
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

  const handleDeleteBookmark = async (id: string) => {
    if (!user) return;
    const ok = await deleteBookmark(id, user.id);
    if (ok) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return;
    const ok = await deleteHighlight(id, user.id);
    if (ok) {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPromptContainer}>
          <Ionicons name="book-outline" size={64} color={colors.accent} />
          <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
            Your Taleora Library
          </Text>
          <Text style={[styles.authDesc, { color: colors.textSecondary }]}>
            Sign in to access your personal reading shelf, sync progress across devices, and keep all your bookmarks and notes safe.
          </Text>
          <Button
            title="Sign In to Taleora"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: 24, width: "100%" }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderReadingItem = (item: ReadingProgress) => {
    if (!item.book) return null;
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("Reader", {
            bookSlug: item.book?.slug,
            chapterSlug: item.current_chapter?.slug,
          })
        }
        style={[
          styles.itemCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.book.title}
            </Text>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
              {item.current_chapter
                ? `Chapter ${item.current_chapter.chapter_number}: ${item.current_chapter.title}`
                : "Continue reading"}
            </Text>
          </View>
          <Text style={[styles.progressBadge, { color: colors.accent }]}>
            {Math.round(item.progress_percentage)}%
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceHover }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.accent,
                width: `${Math.min(100, Math.max(0, item.progress_percentage))}%`,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Title */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Library</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("reading")}
          style={[
            styles.tabButton,
            activeTab === "reading" && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "reading" ? colors.accent : colors.textSecondary },
            ]}
          >
            Reading ({libraryData.currentlyReading.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          style={[
            styles.tabButton,
            activeTab === "completed" && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "completed" ? colors.accent : colors.textSecondary },
            ]}
          >
            Completed ({libraryData.completed.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("annotations")}
          style={[
            styles.tabButton,
            activeTab === "annotations" && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "annotations" ? colors.accent : colors.textSecondary },
            ]}
          >
            Notes ({bookmarks.length + highlights.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
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
          {activeTab === "reading" && (
            <View>
              {libraryData.currentlyReading.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No active stories
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Explore books and start reading to track your progress here.
                  </Text>
                  <Button
                    title="Discover Stories"
                    onPress={() => navigation.navigate("ExploreTab")}
                    style={{ marginTop: 16 }}
                  />
                </View>
              ) : (
                libraryData.currentlyReading.map(renderReadingItem)
              )}
            </View>
          )}

          {activeTab === "completed" && (
            <View>
              {libraryData.completed.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                    No completed stories yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Stories you finish will be cataloged here.
                  </Text>
                </View>
              ) : (
                libraryData.completed.map(renderReadingItem)
              )}
            </View>
          )}

          {activeTab === "annotations" && (
            <View>
              {/* Bookmarks */}
              <Text style={[styles.subSectionTitle, { color: colors.textPrimary }]}>
                Bookmarks ({bookmarks.length})
              </Text>
              {bookmarks.length === 0 ? (
                <Text style={[styles.annotationEmptyText, { color: colors.textMuted }]}>
                  No bookmarks saved yet. Use the bookmark icon in the reader to save positions.
                </Text>
              ) : (
                bookmarks.map((bm) => (
                  <View
                    key={bm.id}
                    style={[
                      styles.annotationCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        navigation.navigate("Reader", {
                          bookSlug: bm.book?.slug,
                          chapterSlug: bm.chapter?.slug,
                        })
                      }
                    >
                      <Text style={[styles.annotationBook, { color: colors.accent }]}>
                        {bm.book?.title} • Ch. {bm.chapter?.chapter_number}
                      </Text>
                      {bm.snippet && (
                        <Text
                          style={[styles.annotationSnippet, { color: colors.textPrimary }]}
                          numberOfLines={2}
                        >
                          "{bm.snippet}"
                        </Text>
                      )}
                      <Text style={[styles.annotationDate, { color: colors.textMuted }]}>
                        {new Date(bm.created_at).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBookmark(bm.id)}
                      style={styles.deleteAction}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Highlights & Notes */}
              <Text style={[styles.subSectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
                Highlights & Notes ({highlights.length})
              </Text>
              {highlights.length === 0 ? (
                <Text style={[styles.annotationEmptyText, { color: colors.textMuted }]}>
                  No highlighted passages yet. Tap text while reading to create notes.
                </Text>
              ) : (
                highlights.map((hl) => (
                  <View
                    key={hl.id}
                    style={[
                      styles.annotationCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        navigation.navigate("Reader", {
                          bookSlug: hl.book?.slug,
                          chapterSlug: hl.chapter?.slug,
                        })
                      }
                    >
                      <Text style={[styles.annotationBook, { color: colors.accent }]}>
                        {hl.book?.title} • Ch. {hl.chapter?.chapter_number}
                      </Text>
                      <Text
                        style={[
                          styles.highlightQuote,
                          {
                            color: colors.textPrimary,
                            borderLeftColor: colors.accent,
                          },
                        ]}
                      >
                        "{hl.selected_text}"
                      </Text>
                      {hl.note && (
                        <Text style={[styles.highlightNote, { color: colors.textSecondary }]}>
                          Note: {hl.note}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteHighlight(hl.id)}
                      style={styles.deleteAction}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  itemCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBadge: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  annotationEmptyText: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 12,
  },
  annotationCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  annotationBook: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  annotationSnippet: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  annotationDate: {
    fontSize: 11,
    marginTop: 4,
  },
  deleteAction: {
    padding: 6,
    marginLeft: 8,
  },
  highlightQuote: {
    fontSize: 13,
    fontStyle: "italic",
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginVertical: 4,
    lineHeight: 18,
  },
  highlightNote: {
    fontSize: 12,
    marginTop: 4,
  },
  authPromptContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 16,
  },
  authDesc: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
