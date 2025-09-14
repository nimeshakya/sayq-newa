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
    <ScrollView contentContainerStyle={[{ flex: 1 }, styles.bodyContainer]}>
      {content}
    </ScrollView>
  ) : (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={[styles.bodyContainer, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyle(
  theme: { background: string; text: string },
  colorScheme: string
) {
  return StyleSheet.create({
    bodyContainer: {
      backgroundColor: theme.background,
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 35,
    },
  });
}
