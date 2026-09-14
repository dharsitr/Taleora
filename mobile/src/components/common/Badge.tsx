import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface BadgeProps {
  label: string;
  variant?: "accent" | "surface" | "success" | "danger";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "surface",
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "accent":
        return colors.accent + "20"; // 12% opacity
      case "success":
        return colors.success + "20";
      case "danger":
        return colors.danger + "20";
      case "surface":
      default:
        return colors.surfaceHover;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "accent":
        return colors.accent;
      case "success":
        return colors.success;
      case "danger":
        return colors.danger;
      case "surface":
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
