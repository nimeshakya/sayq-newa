import { View, Text, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

import appLogo from '@/assets/images/NewaSayQLogo.png';
import { navigate } from 'expo-router/build/global-state/routing';
import { useEffect } from 'react';

const Login = () => {
    const colorScheme = useColorScheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/start');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View
            style={{
                ...styles.container,
                backgroundColor: Colors[colorScheme ?? 'light'].background,
            }}
        >
            <Image source={appLogo} />
            <Text
                style={{
                    ...styles.actionText,
                    color: Colors[colorScheme ?? 'light'].text,
                }}
            >
                Learn NepalBhasa
            </Text>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    actionText: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        letterSpacing: 2.4,
    },
});
