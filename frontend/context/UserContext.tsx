import React from 'react';
import {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { API_BASE_URL, EXPO_PUBLIC_GOOGLE_CLIENT_ID } from '@/constants';

import { useBackendAPIContext } from './BackendAPIContext';

type UserType = {
    id: string;
    email: string;
    name: string;
    given_name?: string;
    family_name?: string;
    imageUrl: string;
    expertise_lvl: 0 | 1 | 2 | 3 | 4 | 5 | null;
};

type UserContextType = {
    user: UserType | null;
    setUser: React.Dispatch<React.SetStateAction<UserContextType['user']>>;
    googleSignIn: () => Promise<void>;
    fetchUser: () => Promise<void>;
};

export const UserContext = React.createContext<any>(null);

const UserProvider = ({ children }: React.PropsWithChildren) => {
    const [user, setUser] = React.useState<any>(null);
    const { client } = useBackendAPIContext();

    // configure google sign in
    GoogleSignin.configure({
        webClientId: EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        offlineAccess: false,
    });

    const googleSignIn = async () => {
        try {
            // For dev testing purposes, sign out before signing in
            const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
            if (hasPreviousSignIn) {
                await GoogleSignin.signOut();
                setUser(null);
            }
            // check if device has google play services
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            if (!isSuccessResponse(response)) {
                console.error('Google Sign-In failed:', response);
                return;
            }

            // send token to backend and retrieve data of user as well as signed token
            const url = `${API_BASE_URL}/auth/google-sign-in`;
            client
                .post(url, {
                    token: response.data.idToken,
                })
                .then((res) => {
                    const {
                        email,
                        googleId,
                        name,
                        given_name,
                        family_name,
                        picture,
                    } = res.data.user;
                    setUser({
                        id: googleId,
                        email,
                        name,
                        given_name,
                        family_name,
                        imageUrl: picture,
                        expertise_lvl: null,
                    });
                })
                .catch((err) => console.error(err));
        } catch (error) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.IN_PROGRESS:
                        // operation (eg. sign in) already in progress
                        console.log('Sign-in already in progress');

                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        // Android only, play services not available or outdated
                        console.log('Play services not available');
                        break;
                    default:
                        console.error('Google Sign-In error:', error);
                        break;
                    // some other error happened
                }
            }
        }
    };

    React.useEffect(() => {
        console.log(user);
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser, googleSignIn }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;

export const useUserContext = () => {
    const context = React.useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};
