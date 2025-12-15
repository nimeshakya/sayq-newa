import React, { createContext } from 'react';

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
    googleSignIn: () => Promise<void>;
    silentGoogleSignIn: () => Promise<boolean | undefined>;
    // fetchUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

const UserProvider = ({ children }: React.PropsWithChildren) => {
    const [user, setUser] = React.useState<UserType | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
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
