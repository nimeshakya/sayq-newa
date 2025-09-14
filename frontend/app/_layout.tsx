import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <SafeAreaProvider>
            <ThemeProvider
                value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
            >
                <Stack
                    screenOptions={{
                        headerStyle: {
                            backgroundColor:
                                Colors[colorScheme ?? 'light'].background,
                        },
                        headerTintColor: Colors[colorScheme ?? 'light'].text,
                    }}
                >
                    <Stack.Screen
                        name='index'
                        options={{ title: '', headerShown: false }}
                    />
                    <Stack.Screen name='start' options={{ title: '' }} />
                    <Stack.Screen
                        name='learnTime'
                        options={{
                            title: '',
                        }}
                    />
                    <Stack.Screen
                        name='level'
                        options={{
                            title: '',
                        }}
                    />
                </Stack>
                <StatusBar style='auto' />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
