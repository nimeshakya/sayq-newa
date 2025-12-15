import React from 'react';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';

type BackendAPIContextType = {
    client: AxiosInstance;
};

const BackendAPIContext = React.createContext<
    BackendAPIContextType | undefined
>(undefined);

const BackendAPIProvider = ({ children }: React.PropsWithChildren) => {
    const client = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true,
    });

    return (
        <BackendAPIContext.Provider value={{ client }}>
            {children}
        </BackendAPIContext.Provider>
    );
};

export const useBackendAPI = () => {
    const context = React.useContext(BackendAPIContext);
    if (!context) {
        throw new Error(
            'useBackendAPI must be used within a BackendAPIProvider'
        );
    }
    return context;
};

export default BackendAPIProvider;
