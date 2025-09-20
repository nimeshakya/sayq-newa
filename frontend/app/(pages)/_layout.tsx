import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

import { OptionProvider } from "@/context/optionContext";

export default function PagesLayout() {
  const colorScheme = useColorScheme();

  return (
    <OptionProvider>
      <Stack
        screenOptions={{
          title: "",
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
          },
          headerTintColor: Colors[colorScheme ?? "light"].text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* You can add more screens and options here if needed */}
      </Stack>
    </OptionProvider>
  );
}
