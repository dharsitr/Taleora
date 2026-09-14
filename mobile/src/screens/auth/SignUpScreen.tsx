import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";

export const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !username.trim()) {
      setErrorMsg("Please fill in email, username, and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { error } = await signUp(email, password, username, fullName);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account.");
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              Tale<Text style={{ color: colors.accent }}>ora</Text>
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join readers and authors discovering captivating serial fiction.
            </Text>
          </View>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + "20" }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errorMsg}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              USERNAME
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="at-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="reader_hero"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={[styles.input, { color: colors.textPrimary }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              FULL NAME (OPTIONAL)
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="Jane Doe"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { color: colors.textPrimary }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              EMAIL ADDRESS
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="reader@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: colors.textPrimary }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { color: colors.textPrimary }]}
              />
            </View>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              size="large"
              style={{ marginTop: 24 }}
            />

            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={[styles.signupLink, { color: colors.accent }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 16,
    left: 20,
    zIndex: 10,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  form: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  signupLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
