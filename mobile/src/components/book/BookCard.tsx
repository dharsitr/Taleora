import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Book } from "../../types";

interface BookCardProps {
  book: Book;
  onPress: () => void;
  layout?: "grid" | "list";
  style?: ViewStyle;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  layout = "grid",
  style,
}) => {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Gradient or solid fallback color based on title hash
  const getFallbackColor = () => {
    const colorsList = ["#1e293b", "#0f172a", "#312e81", "#1e1b4b", "#451a03"];
    let hash = 0;
    for (let i = 0; i < book.title.length; i++) {
      hash = (hash + book.title.charCodeAt(i)) % colorsList.length;
    }
    return colorsList[hash];
  };

  if (layout === "list") {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.listContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          style,
        ]}
      >
        {/* Cover Thumbnail */}
        <View
          style={[
            styles.listCover,
            { backgroundColor: getFallbackColor() },
          ]}
        >
          {book.cover_image_url && !imageError ? (
            <Image
              source={{ uri: book.cover_image_url }}
              style={styles.coverImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallbackIcon}>
              <Ionicons name="book-outline" size={24} color={colors.accent} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.listContent}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {book.title}
          </Text>
          <Text
            style={[styles.author, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {book.author.display_name}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={colors.accent} />
              <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                {book.average_rating > 0 ? book.average_rating.toFixed(1) : "New"}
              </Text>
            </View>
            <Text style={[styles.bullet, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
              {book.total_chapters} {book.total_chapters === 1 ? "ch" : "chs"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default Grid Layout
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.gridContainer, style]}
    >
      <View
        style={[
          styles.gridCoverWrapper,
          {
            backgroundColor: getFallbackColor(),
            borderColor: colors.border,
          },
        ]}
      >
        {book.cover_image_url && !imageError ? (
          <Image
            source={{ uri: book.cover_image_url }}
            style={styles.coverImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackContent}>
            <Ionicons name="book-outline" size={32} color={colors.accent} />
            <Text
              style={[styles.fallbackTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {book.title}
            </Text>
          </View>
        )}

        {book.featured && (
          <View style={[styles.featuredTag, { backgroundColor: colors.accent }]}>
            <Text style={styles.featuredTagText}>FEATURED</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.gridTitle, { color: colors.textPrimary }]}
        numberOfLines={2}
      >
        {book.title}
      </Text>

      <Text
        style={[styles.gridAuthor, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {book.author.display_name}
      </Text>

      <View style={styles.ratingRow}>
        <Ionicons name="star" size={12} color={colors.accent} />
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          {book.average_rating > 0 ? book.average_rating.toFixed(1) : "New"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    width: 140,
    marginRight: 14,
    marginBottom: 16,
  },
  gridCoverWrapper: {
    width: 140,
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  fallbackContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  fallbackTitle: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  fallbackIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredTag: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredTagText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 18,
  },
  gridAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  bullet: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  chapterCount: {
    fontSize: 11,
  },
  listContainer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  listCover: {
    width: 60,
    height: 85,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 14,
  },
  listContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  author: {
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
});
