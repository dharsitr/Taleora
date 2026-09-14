import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { BookDetailScreen } from "../screens/book/BookDetailScreen";
import { ReaderScreen } from "../screens/reader/ReaderScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  BookDetail: { bookSlug: string; bookId?: string };
  Reader: { bookSlug: string; chapterSlug?: string };
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ animation: "fade_from_bottom", gestureEnabled: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack.Navigator>
  );
};
