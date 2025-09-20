import { createContext, useContext } from "react";
import React from "react";
import { useState } from "react";

type MessageContextType = {
  message: string;
  setMessage: (message: string) => void;
  clearMessage: () => void;
};

export const MessageContext = createContext<MessageContextType | undefined>(
  undefined
);

export const MessageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState("");
  const clearMessage = () => setMessage("");
  return (
    <MessageContext.Provider value={{ message, setMessage, clearMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used inside MessageProvider");
  }
  return context;
};
