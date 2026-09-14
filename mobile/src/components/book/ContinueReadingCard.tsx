import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { ReadingProgress } from "../../types";

interface ContinueReadingCardProps {
  progress: ReadingProgress;
  onPress: () => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  progress,
  onPress,
}) => {
  const { colors } = useTheme();
  const book = progress.book;
  if (!book) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Thumbnail */}
        <View style={[styles.coverContainer, { backgroundColor: colors.surfaceHover }]}>
          {book.cover_image_url ? (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="book-outline" size={24} color={colors.accent} />
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.accent + "25" }]}>
              <Text style={[styles.statusText, { color: colors.accent }]}>
                CONTINUE READING
              </Text>
            </View>
          </View>

          <Text
            style={[styles.bookTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {book.title}
          </Text>

          <Text
            style={[styles.chapterTitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {progress.current_chapter
              ? `Ch. ${progress.current_chapter.chapter_number}: ${progress.current_chapter.title}`
              : "Next Chapter"}
          </Text>
        </View>

        {/* Read action button icon */}
        <View
          style={[
            styles.playButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Ionicons name="play" size={16} color="#ffffff" style={{ marginLeft: 2 }} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            Chapter Progress
          </Text>
          <Text style={[styles.progressPercent, { color: colors.accent }]}>
            {Math.round(progress.progress_percentage)}%
          </Text>
        </View>

        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colors.surfaceHover },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.accent,
                width: `${Math.min(100, Math.max(0, progress.progress_percentage))}%`,
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coverContainer: {
    width: 48,
    height: 68,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  chapterTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressBarBackground: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
