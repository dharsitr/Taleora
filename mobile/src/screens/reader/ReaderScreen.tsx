import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useReaderSettings } from "../../context/ReaderSettingsContext";
import { getChapterReaderData, syncReadingProgress, logReadingSession } from "../../services/readerService";
import {
  createBookmark,
  createHighlight,
  getUserBookmarks,
  getUserHighlights,
} from "../../services/annotationService";
import { ChapterReaderData, HighlightColor, ThemeMode } from "../../types";

export const ReaderScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { colors, mode: mainThemeMode } = useTheme();
  const { user } = useAuth();
  const {
    settings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    setReaderTheme,
  } = useReaderSettings();

  const { bookSlug, chapterSlug } = route.params;

  const [readerData, setReaderData] = useState<ChapterReaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [tocVisible, setTocVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [highlightModalVisible, setHighlightModalVisible] = useState(false);

  // Selected paragraph for highlight / bookmark
  const [selectedParaIdx, setSelectedParaIdx] = useState<number | null>(null);
  const [selectedParaText, setSelectedParaText] = useState<string>("");
  const [highlightColor, setHighlightColor] = useState<HighlightColor>("amber");
  const [highlightNote, setHighlightNote] = useState<string>("");

  // Reading progress tracking
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const scrollViewRef = useRef<ScrollView>(null);

  // Current active reader theme palette
  const activeReaderTheme = settings.theme || mainThemeMode;
  const getThemeBackground = () => {
    switch (activeReaderTheme) {
      case "light":
        return "#ffffff";
      case "sepia":
        return "#f6edd9";
      case "dark":
      default:
        return "#0b0f17";
    }
  };

  const getThemeTextColor = () => {
    switch (activeReaderTheme) {
      case "light":
        return "#1e293b";
      case "sepia":
        return "#432818";
      case "dark":
      default:
        return "#f1f5f9";
    }
  };

  const getThemeSecondaryColor = () => {
    switch (activeReaderTheme) {
      case "light":
        return "#64748b";
      case "sepia":
        return "#78350f";
      case "dark":
      default:
        return "#94a3b8";
    }
  };

  // Load Chapter Data
  const loadChapter = async (targetChapterSlug?: string) => {
    setLoading(true);
    try {
      const data = await getChapterReaderData(bookSlug, targetChapterSlug || chapterSlug);
      setReaderData(data);
      sessionStartTime.current = Date.now();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } catch (err) {
      console.error("Failed to load chapter:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapter(chapterSlug);

    return () => {
      // Sync progress & session duration when unmounting or changing chapters
      if (user && readerData) {
        const durationSec = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        logReadingSession(
          user.id,
          readerData.book.id,
          readerData.currentChapter.id,
          durationSec
        );
        syncReadingProgress(
          user.id,
          readerData.book.id,
          readerData.currentChapter.id,
          scrollPercentage,
          scrollPercentage >= 95
        );
      }
    };
  }, [bookSlug, chapterSlug]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const totalHeight = contentSize.height - layoutMeasurement.height;
    if (totalHeight > 0) {
      const currentProgress = Math.min(
        100,
        Math.max(0, (contentOffset.y / totalHeight) * 100)
      );
      setScrollPercentage(currentProgress);
    }
  };

  const handleToggleControls = () => {
    setControlsVisible((prev) => !prev);
  };

  const handleParagraphPress = (text: string, index: number) => {
    setSelectedParaIdx(index);
    setSelectedParaText(text);
    setHighlightModalVisible(true);
  };

  const handleCreateBookmark = async () => {
    if (!user || !readerData) {
      Alert.alert("Sign In Required", "Please sign in to save bookmarks.");
      return;
    }

    const currentIdx = selectedParaIdx !== null ? selectedParaIdx : 0;
    const snippet = selectedParaText ? selectedParaText.slice(0, 150) : "Chapter bookmark";

    const bm = await createBookmark(
      user.id,
      readerData.book.id,
      readerData.currentChapter.id,
      currentIdx,
      scrollPercentage,
      snippet
    );

    if (bm) {
      Alert.alert("Bookmark Saved", "Bookmark has been saved to your library.");
    }
  };

  const handleSaveHighlight = async () => {
    if (!user || !readerData || selectedParaIdx === null) {
      Alert.alert("Sign In Required", "Please sign in to save highlights and notes.");
      return;
    }

    const hl = await createHighlight(
      user.id,
      readerData.book.id,
      readerData.currentChapter.id,
      selectedParaIdx,
      0,
      selectedParaText.length,
      selectedParaText,
      highlightColor,
      highlightNote.trim() || undefined
    );

    if (hl) {
      setHighlightModalVisible(false);
      setHighlightNote("");
      Alert.alert("Highlight Saved", "Passage highlighted successfully.");
    }
  };

  const handleNavigateChapter = (targetSlug: string) => {
    // Save current progress before navigating
    if (user && readerData) {
      syncReadingProgress(
        user.id,
        readerData.book.id,
        readerData.currentChapter.id,
        scrollPercentage,
        scrollPercentage >= 95
      );
    }
    setTocVisible(false);
    loadChapter(targetSlug);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: getThemeBackground() }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: getThemeSecondaryColor() }]}>
          Opening manuscript...
        </Text>
      </View>
    );
  }

  if (!readerData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: getThemeBackground() }]}>
        <Ionicons name="book-outline" size={48} color={colors.accent} />
        <Text style={[styles.errorTitle, { color: getThemeTextColor() }]}>
          Chapter Not Found
        </Text>
        <TouchableOpacity
          style={[styles.backHomeBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backHomeBtnText}>Back to Book Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse chapter content into readable paragraphs
  const paragraphs = readerData.currentChapter.content
    ? readerData.currentChapter.content.split("\n\n").filter((p) => p.trim() !== "")
    : ["No chapter content available."];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getThemeBackground() }]}>
      {/* Top Controls Overlay */}
      {controlsVisible && (
        <View
          style={[
            styles.topOverlay,
            {
              backgroundColor: getThemeBackground(),
              borderBottomColor: colors.borderSubtle,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceHover }]}
          >
            <Ionicons name="arrow-back" size={20} color={getThemeTextColor()} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text
              style={[styles.headerBookTitle, { color: getThemeSecondaryColor() }]}
              numberOfLines={1}
            >
              {readerData.book.title}
            </Text>
            <Text
              style={[styles.headerChapterTitle, { color: getThemeTextColor() }]}
              numberOfLines={1}
            >
              Ch. {readerData.currentChapter.chapter_number}: {readerData.currentChapter.title}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleCreateBookmark}
              style={[styles.iconBtn, { backgroundColor: colors.surfaceHover, marginRight: 8 }]}
            >
              <Ionicons name="bookmark-outline" size={18} color={getThemeTextColor()} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSettingsModalVisible(true)}
              style={[styles.iconBtn, { backgroundColor: colors.surfaceHover }]}
            >
              <Ionicons name="text-outline" size={18} color={getThemeTextColor()} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Reading Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Chapter Title & Header */}
        <TouchableOpacity activeOpacity={1} onPress={handleToggleControls}>
          <View style={styles.chapterHeader}>
            <Text style={[styles.chapterNumberLabel, { color: colors.accent }]}>
              CHAPTER {readerData.currentChapter.chapter_number}
            </Text>
            <Text style={[styles.mainChapterTitle, { color: getThemeTextColor() }]}>
              {readerData.currentChapter.title}
            </Text>
            <Text style={[styles.chapterWordCount, { color: getThemeSecondaryColor() }]}>
              {readerData.currentChapter.word_count} words •{" "}
              {readerData.currentChapter.estimated_read_minutes || 3} min read
            </Text>
          </View>

          {/* Manuscript Paragraphs */}
          <View style={styles.bodyContainer}>
            {paragraphs.map((para, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                onPress={handleToggleControls}
                onLongPress={() => handleParagraphPress(para, idx)}
                style={styles.paragraphWrapper}
              >
                <Text
                  style={[
                    styles.paragraphText,
                    {
                      color: getThemeTextColor(),
                      fontSize: settings.fontSize,
                      lineHeight: settings.fontSize * settings.lineHeight,
                      fontFamily:
                        settings.fontFamily === "mono"
                          ? "monospace"
                          : settings.fontFamily === "serif"
                          ? "serif"
                          : "sans-serif",
                    },
                  ]}
                >
                  {para.trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>

        {/* End of Chapter Navigation */}
        <View style={[styles.chapterEndCard, { borderColor: colors.borderSubtle }]}>
          <Text style={[styles.endNoticeText, { color: getThemeSecondaryColor() }]}>
            End of Chapter {readerData.currentChapter.chapter_number}
          </Text>

          <View style={styles.chapterNavButtons}>
            {readerData.prevChapter && (
              <TouchableOpacity
                onPress={() => handleNavigateChapter(readerData.prevChapter!.slug)}
                style={[styles.adjacentNavBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="arrow-back" size={16} color={colors.accent} />
                <Text style={[styles.adjacentNavText, { color: colors.accent }]}>
                  Prev Chapter
                </Text>
              </TouchableOpacity>
            )}

            {readerData.nextChapter ? (
              <TouchableOpacity
                onPress={() => handleNavigateChapter(readerData.nextChapter!.slug)}
                style={[
                  styles.adjacentNavBtn,
                  { backgroundColor: colors.accent, marginLeft: "auto" },
                ]}
              >
                <Text style={[styles.adjacentNavText, { color: "#ffffff" }]}>
                  Next Chapter
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.caughtUpText, { color: colors.accent }]}>
                You're caught up to the latest chapter!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Controls Overlay */}
      {controlsVisible && (
        <View
          style={[
            styles.bottomOverlay,
            {
              backgroundColor: getThemeBackground(),
              borderTopColor: colors.borderSubtle,
            },
          ]}
        >
          {/* Progress Indicator */}
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: colors.surfaceHover },
              ]}
            >
              <View
                style={[
                  styles.progressBarProgress,
                  {
                    backgroundColor: colors.accent,
                    width: `${Math.round(scrollPercentage)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercentText, { color: getThemeSecondaryColor() }]}>
              {Math.round(scrollPercentage)}%
            </Text>
          </View>

          {/* Bottom Action Bar */}
          <View style={styles.bottomActionsRow}>
            <TouchableOpacity
              disabled={!readerData.prevChapter}
              onPress={() =>
                readerData.prevChapter && handleNavigateChapter(readerData.prevChapter.slug)
              }
              style={[
                styles.bottomNavBtn,
                !readerData.prevChapter && { opacity: 0.3 },
              ]}
            >
              <Ionicons name="play-skip-back" size={20} color={getThemeTextColor()} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTocVisible(true)}
              style={[styles.tocButton, { backgroundColor: colors.surfaceHover }]}
            >
              <Ionicons name="list" size={18} color={getThemeTextColor()} />
              <Text style={[styles.tocButtonText, { color: getThemeTextColor() }]}>
                Chapters ({readerData.allChapters.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!readerData.nextChapter}
              onPress={() =>
                readerData.nextChapter && handleNavigateChapter(readerData.nextChapter.slug)
              }
              style={[
                styles.bottomNavBtn,
                !readerData.nextChapter && { opacity: 0.3 },
              ]}
            >
              <Ionicons name="play-skip-forward" size={20} color={getThemeTextColor()} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Table of Contents Modal Drawer */}
      <Modal visible={tocVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.tocModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Table of Contents
              </Text>
              <TouchableOpacity onPress={() => setTocVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {readerData.allChapters.map((ch) => {
                const isCurrent = ch.id === readerData.currentChapter.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    onPress={() => handleNavigateChapter(ch.slug)}
                    style={[
                      styles.tocItem,
                      {
                        backgroundColor: isCurrent ? colors.accent + "15" : "transparent",
                        borderBottomColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tocItemNumber,
                        { color: isCurrent ? colors.accent : colors.textMuted },
                      ]}
                    >
                      Ch. {ch.chapter_number}
                    </Text>
                    <Text
                      style={[
                        styles.tocItemTitle,
                        { color: isCurrent ? colors.accent : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {ch.title}
                    </Text>
                    {isCurrent && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reader Settings Modal (Themes & Typography) */}
      <Modal visible={settingsModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSettingsModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.settingsModalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.settingsModalTitle, { color: colors.textPrimary }]}>
              Reader Settings
            </Text>

            {/* Theme Selector */}
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
              THEME
            </Text>
            <View style={styles.themeRow}>
              {(["dark", "light", "sepia"] as ThemeMode[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setReaderTheme(t)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor:
                        t === "dark" ? "#0b0f17" : t === "light" ? "#f8fafc" : "#f6edd9",
                      borderColor: activeReaderTheme === t ? colors.accent : colors.border,
                      borderWidth: activeReaderTheme === t ? 2 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: t === "dark" ? "#ffffff" : t === "light" ? "#0f172a" : "#432818",
                      fontWeight: "700",
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Font Size Adjuster */}
            <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              FONT SIZE ({settings.fontSize}px)
            </Text>
            <View style={styles.fontSizeRow}>
              <TouchableOpacity
                onPress={decreaseFontSize}
                style={[styles.fontAdjustBtn, { backgroundColor: colors.surfaceHover }]}
              >
                <Text style={[styles.fontAdjustBtnText, { color: colors.textPrimary }]}>
                  A-
                </Text>
              </TouchableOpacity>

              <Text style={[styles.currentFontSizeText, { color: colors.textPrimary }]}>
                {settings.fontSize}px
              </Text>

              <TouchableOpacity
                onPress={increaseFontSize}
                style={[styles.fontAdjustBtn, { backgroundColor: colors.surfaceHover }]}
              >
                <Text style={[styles.fontAdjustBtnText, { color: colors.textPrimary }]}>
                  A+
                </Text>
              </TouchableOpacity>
            </View>

            {/* Font Family Selector */}
            <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 16 }]}>
              TYPEFACE
            </Text>
            <View style={styles.fontFamilyRow}>
              {(["serif", "sans", "mono"] as const).map((ff) => (
                <TouchableOpacity
                  key={ff}
                  onPress={() => setFontFamily(ff)}
                  style={[
                    styles.fontFamilyBtn,
                    {
                      backgroundColor:
                        settings.fontFamily === ff ? colors.accent : colors.surfaceHover,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.fontFamilyBtnText,
                      {
                        color: settings.fontFamily === ff ? "#ffffff" : colors.textPrimary,
                        textTransform: "capitalize",
                      },
                    ]}
                  >
                    {ff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Paragraph Highlight & Note Modal */}
      <Modal visible={highlightModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.highlightModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Highlight Passage
              </Text>
              <TouchableOpacity onPress={() => setHighlightModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.highlightSnippet,
                { color: colors.textSecondary, borderColor: colors.borderSubtle },
              ]}
              numberOfLines={3}
            >
              "{selectedParaText}"
            </Text>

            {/* Color Swatches */}
            <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              COLOR
            </Text>
            <View style={styles.colorSwatchesRow}>
              {(["amber", "emerald", "sky", "rose", "violet"] as HighlightColor[]).map((c) => {
                const colorMap = {
                  amber: "#f59e0b",
                  emerald: "#10b981",
                  sky: "#0ea5e9",
                  rose: "#f43f5e",
                  violet: "#8b5cf6",
                };
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setHighlightColor(c)}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: colorMap[c],
                        borderColor: highlightColor === c ? "#ffffff" : "transparent",
                        borderWidth: highlightColor === c ? 3 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Note Input */}
            <Text style={[styles.settingLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              PERSONAL NOTE (OPTIONAL)
            </Text>
            <TextInput
              placeholder="Add your thoughts or reflections..."
              placeholderTextColor={colors.textMuted}
              value={highlightNote}
              onChangeText={setHighlightNote}
              multiline
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleSaveHighlight}
              style={[styles.saveHighlightBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.saveHighlightBtnText}>Save Highlight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  backHomeBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerBookTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  headerChapterTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 90,
  },
  chapterHeader: {
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 20,
  },
  chapterNumberLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  mainChapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: -0.3,
  },
  chapterWordCount: {
    fontSize: 12,
    marginTop: 6,
  },
  bodyContainer: {
    width: "100%",
  },
  paragraphWrapper: {
    marginBottom: 20,
  },
  paragraphText: {
    textAlign: "left",
  },
  chapterEndCard: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: "center",
  },
  endNoticeText: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 16,
  },
  chapterNavButtons: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  adjacentNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  adjacentNavText: {
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  caughtUpText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  progressBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 10,
  },
  progressBarProgress: {
    height: "100%",
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: "600",
    width: 35,
    textAlign: "right",
  },
  bottomActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomNavBtn: {
    padding: 8,
  },
  tocButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tocButtonText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  tocModalContent: {
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tocItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tocItemNumber: {
    fontSize: 13,
    fontWeight: "700",
    width: 60,
  },
  tocItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  settingsModalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignSelf: "center",
    width: "90%",
    marginBottom: "auto",
    marginTop: "auto",
  },
  settingsModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  fontSizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fontAdjustBtn: {
    width: 48,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fontAdjustBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  currentFontSizeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  fontFamilyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fontFamilyBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  fontFamilyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  highlightModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  highlightSnippet: {
    fontSize: 13,
    fontStyle: "italic",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  colorSwatchesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  noteInput: {
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    textAlignVertical: "top",
    fontSize: 13,
  },
  saveHighlightBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveHighlightBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
