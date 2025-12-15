import React, { createContext, useEffect } from 'react';
import type { CredentialResponse } from '@react-oauth/google';

import { useBackendAPIContext } from './BackendAPIContext';

export type UserType = {
    id: string;
    email: string;
    name: string;
    given_name?: string;
    family_name?: string;
    imageUrl: string;
    expertise_lvl: 0 | 1 | 2 | 3 | 4 | 5;
};

export type UserContextType = {
    user: UserType | null;
    setUser: React.Dispatch<React.SetStateAction<UserContextType['user']>>;
    googleSignIn: (credentialResponse: CredentialResponse) => Promise<void>;
    logout: () => void;
    loading: boolean;
    // silentGoogleSignIn: () => Promise<boolean | undefined>;
    // fetchUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

const UserProvider = ({ children }: React.PropsWithChildren) => {
    const { client } = useBackendAPIContext();
    const [user, setUser] = React.useState<UserType | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await client.get('/auth/check-session');
                setUser(res.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const googleSignIn = async (credentialResponse: CredentialResponse) => {
        try {
            if (!credentialResponse.credential) return;

            const res = await client.post('/auth/google-sign-in', {
                credential: credentialResponse.credential,
            });

            setUser(res.data.user);
        } catch (error) {
            console.error('Login Error: ', error);
        }
    };

    const logout = async () => {
        await client.post('/auth/logout');
        setUser(null);
    };

    return (
        <UserContext.Provider
            value={{ user, setUser, googleSignIn, logout, loading }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = React.useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};

export default UserProvider;
