import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserProvider from '@/context/UserContext';
import BackendAPIProvider from '@/context/BackendAPIContext';

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
                <BackendAPIProvider>
                    <UserProvider>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                            }}
                        >
                            {/* load pages from special folder (pages) */}
                            <Stack.Screen name='(pages)' />
                        </Stack>

                        <StatusBar style='auto' />
                    </UserProvider>
                </BackendAPIProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
