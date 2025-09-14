import { View, Text, StyleSheet, Image } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

import appLogo from '@/assets/images/NewaSayQLogo.png';

const Login = () => {
    const colorScheme = useColorScheme();

    return (
        <View style={styles.container}>
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
