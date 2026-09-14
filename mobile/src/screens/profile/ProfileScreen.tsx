import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ThemeMode } from "../../types";

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, mode, setMode } = useTheme();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Taleora?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        {user ? (
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarText}>
                {profile?.username?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileUsername, { color: colors.textPrimary }]}>
                  {profile?.username || user.email}
                </Text>
                {profile?.role && profile.role !== "user" && (
                  <Badge
                    label={profile.role.toUpperCase()}
                    variant="accent"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.guestCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="person-circle-outline" size={48} color={colors.accent} />
            <Text style={[styles.guestTitle, { color: colors.textPrimary }]}>
              Sign in to Taleora
            </Text>
            <Text style={[styles.guestDesc, { color: colors.textSecondary }]}>
              Sync reading progress across web & mobile and save your personal annotations.
            </Text>
            <Button
              title="Sign In / Register"
              onPress={() => navigation.navigate("Login")}
              style={{ marginTop: 14, width: "100%" }}
            />
          </View>
        )}

        {/* Theme & Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Appearance
          </Text>

          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
              APP THEME
            </Text>

            <View style={styles.themeRow}>
              {(["dark", "light", "sepia"] as ThemeMode[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setMode(t)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor:
                        t === "dark" ? "#0b0f17" : t === "light" ? "#ffffff" : "#f6edd9",
                      borderColor: mode === t ? colors.accent : colors.border,
                      borderWidth: mode === t ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      t === "dark"
                        ? "moon"
                        : t === "light"
                        ? "sunny"
                        : "color-filter-outline"
                    }
                    size={16}
                    color={t === "dark" ? "#f59e0b" : t === "light" ? "#d97706" : "#78350f"}
                  />
                  <Text
                    style={[
                      styles.themeBtnText,
                      {
                        color: t === "dark" ? "#ffffff" : t === "light" ? "#0f172a" : "#432818",
                      },
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Reading & Library
          </Text>

          <View
            style={[
              styles.settingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate("LibraryTab")}
              style={[styles.menuRow, { borderBottomColor: colors.borderSubtle }]}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="library-outline" size={20} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                  Reading Shelf & Bookmarks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("ExploreTab")}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="compass-outline" size={20} color={colors.accent} />
                <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                  Discover Serial Novels
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Action */}
        {user && (
          <View style={styles.section}>
            <Button
              title="Sign Out"
              variant="outline"
              icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
              onPress={handleSignOut}
              style={{ borderColor: colors.danger }}
              textStyle={{ color: colors.danger }}
            />
          </View>
        )}

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Taleora Mobile • v1.0.0
          </Text>
          <Text style={[styles.versionSub, { color: colors.textMuted }]}>
            Connected to Taleora Cloud Supabase
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileUsername: {
    fontSize: 17,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 3,
  },
  guestCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  guestDesc: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  themeBtnText: {
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  versionSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
