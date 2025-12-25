import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useBackendAPIContext } from "./backendAPI.context";
import { useCallback } from "react";

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
  setSelectedLevel: React.Dispatch<React.SetStateAction<LevelProp | undefined>>;
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

// Token management utilities
const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const setUserData = (user: UserType) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// const getUserData = (): UserType | null => {
//   const userData = localStorage.getItem(USER_KEY);
//   return userData ? JSON.parse(userData) : null;
// };

const removeUserData = () => {
  localStorage.removeItem(USER_KEY);
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
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
  const [loading, setLoading] = useState<boolean>(true);

  const { client } = useBackendAPIContext();
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();

      if (!token) {
        // No token found, user is not logged in
        setUser(null);
        setIsLoggedin(false);
        setLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const res = await client.get("/auth/check-session", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const u = res.data.user;

        if (u) {
          const mapped: UserType = {
            id: u._id ?? u.id,
            email: u.email,
            name: u.name,
            given_name: u.given_name,
            family_name: u.family_name,
            imageUrl: u.picture,
            expertise_lvl: (u.expertise_lvl ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
          };

          setUser(mapped);
          setUserData(mapped);
          setIsLoggedin(true);

          // Only navigate if on login page
          if (
            window.location.pathname === "/" ||
            window.location.pathname === "/login"
          ) {
            navigate("/");
          }
        } else {
          // Token invalid
          removeAuthToken();
          removeUserData();
          setUser(null);
          setIsLoggedin(false);
        }
      } catch (error) {
        console.error("Session check error:", error);
        // Token is invalid or expired
        removeAuthToken();
        removeUserData();
        setUser(null);
        setIsLoggedin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [client, navigate]);

  const googleSignIn = useCallback(
    async (credentialResponse: CredentialResponse) => {
      try {
        if (!credentialResponse.credential) {
          throw new Error("No credential received");
        }

        const res = await client.post("/auth/google-sign-in", {
          credential: credentialResponse.credential,
        });

        const { user: u, token } = res.data;

        if (!token) {
          throw new Error("No token received from server");
        }

        setAuthToken(token);

        const mapped: UserType = {
          id: u._id ?? u.id,
          email: u.email,
          name: u.name,
          given_name: u.given_name,
          family_name: u.family_name,
          imageUrl: u.picture,
          expertise_lvl: (u.expertise_lvl ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        };

        setUserData(mapped);
        setUser(mapped);
        setIsLoggedin(true);
        navigate("/initialPage");
      } catch (error) {
        console.error("Login Error: ", error);
        removeAuthToken();
        removeUserData();
        setUser(null);
        setIsLoggedin(false);
      }
    },
    [client, navigate]
  );

  const logout = useCallback(async () => {
    try {
      const token = getAuthToken();
      await client.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeAuthToken();
      removeUserData();
      setUser(null);
      setIsLoggedin(false);
      navigate("/");
    }
  }, [client, navigate]);

  const contextValue = useMemo(
    () => ({
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
      logout,
      loading,
    }),
    [
      isLoggedin,
      isLoginVisible,
      user,
      selectedTime,
      selectedLevel,
      selectedStartOption,
      googleSignIn,
      logout,
      loading,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used inside UserProvider");
  }
  return context;
};
