import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceHover;
    switch (variant) {
      case "primary":
        return colors.accent;
      case "secondary":
        return colors.surface;
      case "danger":
        return colors.danger;
      case "outline":
      default:
        return "transparent";
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "primary":
        return "#ffffff";
      case "secondary":
        return colors.textPrimary;
      case "danger":
        return "#ffffff";
      case "outline":
      default:
        return colors.accent;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return disabled ? colors.borderSubtle : colors.accent;
    }
    return "transparent";
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: 8, paddingHorizontal: 14 };
      case "large":
        return { paddingVertical: 14, paddingHorizontal: 22 };
      case "medium":
      default:
        return { paddingVertical: 11, paddingHorizontal: 18 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 13;
      case "large":
        return 16;
      case "medium":
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#ffffff" : colors.accent}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
