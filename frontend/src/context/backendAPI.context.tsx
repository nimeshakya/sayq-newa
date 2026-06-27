import React from "react";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { BACKEND_API } from "../constants";

type BackendAPIContextType = {
  client: AxiosInstance;
};

const BackendAPIContext = React.createContext<
  BackendAPIContextType | undefined
>(undefined);

const BackendAPIProvider = ({ children }: React.PropsWithChildren) => {
  const client = axios.create({
    baseURL: BACKEND_API,
    withCredentials: true,
  });

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
      "useBackendAPIContext must be used within a BackendAPIProvider",
    );
  }
  return context;
};

export default BackendAPIProvider;
