import React, { createContext, useContext, useState } from "react";

type User = {
  usename: string;
  fname: number;
  lname: number;
};

type LevelProp = { id: number; level: string; value: string };
type TimeProp = { id: number; time: number; value: string };
type StartingProp = { id: number; option: string; value: string };

type UserContextType = {
  user: User[];
  isLoggedin: boolean;
  isLoginVisible: boolean;
  setIsLoggedin: React.Dispatch<React.SetStateAction<boolean>>;
  setLoginVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setUser: React.Dispatch<React.SetStateAction<User[]>>;

  setSelectedTime: React.Dispatch<React.SetStateAction<TimeProp | undefined>>;
  setSelectedLevel: React.Dispatch<React.SetStateAction<LevelProp | undefined>>;
  setSlectedStartOption: React.Dispatch<
    React.SetStateAction<StartingProp | undefined>
  >;

  selectedTime: TimeProp | undefined;
  selectedLevel: LevelProp | undefined;
  selectedStartOption: StartingProp | undefined;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User[]>([]);
  const [isLoggedin, setIsLoggedin] = useState<boolean>(false);
  const [isLoginVisible, setLoginVisible] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<TimeProp | undefined>(
    undefined
  );
  const [selectedLevel, setSelectedLevel] = useState<LevelProp | undefined>(
    undefined
  );
  const [selectedStartOption, setSlectedStartOption] = useState<
    StartingProp | undefined
  >(undefined);

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
        setSlectedStartOption,
        selectedTime,
        selectedLevel,
        selectedStartOption,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used inside UserProvider");
  }
  return context;
};
