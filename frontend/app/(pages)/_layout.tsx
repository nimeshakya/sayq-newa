import { Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";

import { OptionProvider } from "@/context/optionContext";
import { MessageProvider } from "@/context/messageContext";
import { MCQProvider } from "@/context/MCQContext";

export default function PagesLayout() {
  const colorScheme = useColorScheme();

  return (
    <OptionProvider>
      <MessageProvider>
        <MCQProvider>
          <Stack
            screenOptions={{
              title: "",
              headerShown: true,
              headerStyle: {
                backgroundColor: Colors[colorScheme ?? "light"].background,
              },
              headerTintColor: Colors[colorScheme ?? "light"].text,
            }}
          >
            <Stack.Screen name="index" />
            {/* <Stack.Screen name="start" /> */}
            {/* You can add more screens and options here if needed */}
          </Stack>
        </MCQProvider>
      </MessageProvider>
    </OptionProvider>
  );
}
