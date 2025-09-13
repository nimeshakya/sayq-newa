import { Colors } from "@/constants/theme";
import React from "react";
import { Appearance, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BaseProps = {
  children: (args: {
    theme: { background: string; text: string };
    colorScheme: string;
    styles: ReturnType<typeof createStyle>;
  }) => React.ReactNode;
};

export function Base({ children }: BaseProps) {
  const colorScheme = Appearance.getColorScheme() ?? "light";
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyle(theme, colorScheme);

  const content = children({ theme, colorScheme, styles });

  return Platform.OS === "web" ? (
    <ScrollView contentContainerStyle={styles.bodyContainer}>
      {content}
    </ScrollView>
  ) : (
    <SafeAreaView style={styles.bodyContainer}>{content}</SafeAreaView>
  );
}

function createStyle(
  theme: { background: string; text: string },
  colorScheme: string
) {
  return StyleSheet.create({
    bodyContainer: {
      backgroundColor: theme.background,
      flex: 1,
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 35,
    },
  });
}
