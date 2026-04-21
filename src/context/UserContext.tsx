import React, { createContext, useContext } from "react";
import type { FormVetProp } from "../types/type";

interface UserContextType {
  userLogin: FormVetProp | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: React.ReactNode;
  userLogin: FormVetProp | null;
}

export function UserContextProvider({
  children,
  userLogin,
}: UserContextProviderProps) {
  return (
    <UserContext.Provider value={{ userLogin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserContextProvider");
  }
  return context;
}
