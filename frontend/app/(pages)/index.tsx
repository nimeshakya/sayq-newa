import { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    Animated,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Colors, CustomFonts } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import appLogo from '@/assets/images/NewaSayQLogo.png';
import { navigate } from 'expo-router/build/global-state/routing';

const Login = () => {
    const [showSignIn, setShowSignIn] = useState(false);
    const colorScheme = useColorScheme();
    const [loadedFonts] = useFonts({
        'Poppins-Black': require('@/assets/fonts/Poppins-Black.ttf'),
        'Poppins-BlackItalic': require('@/assets/fonts/Poppins-BlackItalic.ttf'),
        'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
        'Poppins-BoldItalic': require('@/assets/fonts/Poppins-BoldItalic.ttf'),
        'Poppins-ExtraBold': require('@/assets/fonts/Poppins-ExtraBold.ttf'),
        'Poppins-ExtraBoldItalic': require('@/assets/fonts/Poppins-ExtraBoldItalic.ttf'),
        'Poppins-ExtraLight': require('@/assets/fonts/Poppins-ExtraLight.ttf'),
        'Poppins-ExtraLightItalic': require('@/assets/fonts/Poppins-ExtraLightItalic.ttf'),
        'Poppins-Italic': require('@/assets/fonts/Poppins-Italic.ttf'),
        'Poppins-Light': require('@/assets/fonts/Poppins-Light.ttf'),
        'Poppins-LightItalic': require('@/assets/fonts/Poppins-LightItalic.ttf'),
        'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
        'Poppins-MediumItalic': require('@/assets/fonts/Poppins-MediumItalic.ttf'),
        'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
        'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-SemiBoldItalic': require('@/assets/fonts/Poppins-SemiBoldItalic.ttf'),
        'Poppins-Thin': require('@/assets/fonts/Poppins-Thin.ttf'),
        'Poppins-ThinItalic': require('@/assets/fonts/Poppins-ThinItalic.ttf'),
        'Jost-Variable': require('@/assets/fonts/Jost-VariableFont_wght.ttf'),
        'Jost-Italic-Variable': require('@/assets/fonts/Jost-Italic-VariableFont_wght.ttf'),
    });

    // Animated values
    const logoTranslateY = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(0)).current;
    const signInContainerOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSignIn(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showSignIn) {
            Animated.timing(signInContainerOpacity, {
                toValue: showSignIn ? 1 : 0,
                duration: 400,
                useNativeDriver: true,
            }).start();

            Animated.timing(logoTranslateY, {
                toValue: -225,
                duration: 300,
                useNativeDriver: true,
            }).start();

            Animated.timing(textTranslateY, {
                toValue: 250,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [showSignIn, signInContainerOpacity]);

    if (!loadedFonts) return null;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                },
            ]}
        >
            <Animated.Image
                source={appLogo}
                style={[
                    styles.logo,
                    { transform: [{ translateY: logoTranslateY }] },
                ]}
            />

            {showSignIn && (
                <Animated.View
                    style={{
                        ...styles.signInContainer,
                        opacity: signInContainerOpacity,
                    }}
                >
                    <View style={styles.signInButtonContainer}>
                        <Pressable onPress={() => navigate('/start')}>
                            <Image
                                source={require('@/assets/images/google_icon.png')}
                            />
                        </Pressable>
                        <Pressable>
                            <Image
                                source={require('@/assets/images/facebook_icon.png')}
                            />
                        </Pressable>
                    </View>
                    <Text
                        style={{
                            ...styles.signInActionText,
                            color: Colors[colorScheme ?? 'light'].colorText,
                        }}
                    >
                        Sign In
                    </Text>
                </Animated.View>
            )}

            <Animated.Text
                style={[
                    styles.actionText,
                    {
                        color: Colors[colorScheme ?? 'light'].colorText,
                        transform: [{ translateY: textTranslateY }],
                    },
                ]}
            >
                Learn NepalBhasa
            </Animated.Text>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    logo: {
        width: 200,
        height: 200,
    },
    signInContainer: {
        alignItems: 'center',
        gap: 14,
    },
    signInButtonContainer: {
        padding: 10,
        borderRadius: 30,
        backgroundColor: '#fff',
        flexDirection: 'row',
        gap: 42,
    },
    signInActionText: {
        fontSize: 18,
        fontFamily: CustomFonts.JostVariable,
        fontWeight: '700',
    },
    actionText: {
        fontSize: 16,
        fontFamily: CustomFonts.PoppinsMedium,
        letterSpacing: 2.4,
    },
});
