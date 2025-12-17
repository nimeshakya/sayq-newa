import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useBackendAPIContext } from './backendAPI.context';

export type UserType = {
    id: string;
    email: string;
    name: string;
    given_name?: string;
    family_name?: string;
    imageUrl: string;
    expertise_lvl: 0 | 1 | 2 | 3 | 4 | 5;
};

type LevelProp = { id: number; level: string; value: string };
type TimeProp = { id: number; time: number; value: string };
type StartingProp = { id: number; option: string; value: string };

type UserContextType = {
    user: UserType | null;
    isLoggedin: boolean;
    isLoginVisible: boolean;
    setIsLoggedin: React.Dispatch<React.SetStateAction<boolean>>;
    setLoginVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setUser: React.Dispatch<React.SetStateAction<UserType | null>>;

    setSelectedTime: React.Dispatch<React.SetStateAction<TimeProp | undefined>>;
    setSelectedLevel: React.Dispatch<
        React.SetStateAction<LevelProp | undefined>
    >;
    setSelectedStartOption: React.Dispatch<
        React.SetStateAction<StartingProp | undefined>
    >;

    selectedTime: TimeProp | undefined;
    selectedLevel: LevelProp | undefined;
    selectedStartOption: StartingProp | undefined;
    googleSignIn: (credentialResponse: CredentialResponse) => Promise<void>;
    logout: () => void;
    loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<UserType | null>(null);
    const [isLoggedin, setIsLoggedin] = useState<boolean>(false);
    const [isLoginVisible, setLoginVisible] = useState<boolean>(false);
    const [selectedTime, setSelectedTime] = useState<TimeProp | undefined>(
        undefined
    );
    const [selectedLevel, setSelectedLevel] = useState<LevelProp | undefined>(
        undefined
    );
    const [selectedStartOption, setSelectedStartOption] = useState<
        StartingProp | undefined
    >(undefined);

    const { client } = useBackendAPIContext();
    const [loading, setLoading] = React.useState<boolean>(true);
    const navigate = useNavigate();

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await client.get('/auth/check-session');
                setUser(res.data.user);
                setIsLoggedin(true);
                // Only redirect if user is actually logged in
                if (res.data.user) {
                    navigate('/dashboard');
                }
            } catch (error) {
                setUser(null);
                setIsLoggedin(false);
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
            console.log(res.data.user);

            setUser(res.data.user);
            setIsLoggedin(true);
            navigate('/initialPage');
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
            value={{
                isLoggedin,
                isLoginVisible,
                user,
                setLoginVisible,
                setIsLoggedin,
                setUser,

                setSelectedTime,
                setSelectedLevel,
                setSelectedStartOption,
                selectedTime,
                selectedLevel,
                selectedStartOption,
                googleSignIn,
                loading,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used inside UserProvider');
    }
    return context;
};
