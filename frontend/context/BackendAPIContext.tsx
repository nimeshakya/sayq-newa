import React from 'react';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/constants';
import * as SecureStore from 'expo-secure-store';

type BackendAPIContextType = {
    client: AxiosInstance;
};

const BackendAPIContext = React.createContext<BackendAPIContextType | null>(
    null
);

const BackendAPIProvider = ({ children }: React.PropsWithChildren) => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
    });

    React.useEffect(() => {
        const initAuth = async () => {
            const savedToken = await SecureStore.getItemAsync('userToken');
            if (savedToken) {
                client.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            }
        }
        initAuth();
    }, [])

    return (
        <BackendAPIContext.Provider value={{ client }}>
            {children}
        </BackendAPIContext.Provider>
    );
};

export const useBackendAPIContext = () => {
    const context = React.useContext(BackendAPIContext);
    if (!context) {
        throw new Error(
            'useBackendAPIContext must be used within a BackendAPIProvider'
        );
    }
    return context;
};

export default BackendAPIProvider;
