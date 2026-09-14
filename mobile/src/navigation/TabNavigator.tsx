import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { HomeScreen } from "../screens/home/HomeScreen";
import { ExploreScreen } from "../screens/explore/ExploreScreen";
import { LibraryScreen } from "../screens/library/LibraryScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navBackground,
          borderTopColor: colors.borderSubtle,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.navActive,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "ExploreTab") {
            iconName = focused ? "compass" : "compass-outline";
          } else if (route.name === "LibraryTab") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{ tabBarLabel: "Explore" }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{ tabBarLabel: "Library" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};
