import { createContext, useContext } from "react";
import React from "react";
import { useState } from "react";

type OptionType = { key: string; value: string };

type OptionContextType = {
  option: OptionType;
  level: OptionType;
  time: OptionType;
  setOption: (option: OptionType) => void;
  setLevel: (option: OptionType) => void;
  setTime: (option: OptionType) => void;
  clearOption: () => void;
};

export const OptionContext = createContext<OptionContextType | undefined>(
  undefined
);

export const OptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [option, setOption] = useState<OptionType>({
    key: "",
    value: "",
  });
  const [level, setLevel] = useState<OptionType>({
    key: "",
    value: "",
  });
  const [time, setTime] = useState<OptionType>({
    key: "",
    value: "",
  });
  const clearOption = () =>
    setOption({
      key: "",
      value: "",
    });
  return (
    <OptionContext.Provider
      value={{ option, level, time, setOption, clearOption, setLevel, setTime }}
    >
      {children}
    </OptionContext.Provider>
  );
};

export const useOption = () => {
  const context = useContext(OptionContext);
  if (!context) {
    throw new Error("useOption must be used inside OptionProvider");
  }
  return context;
};
