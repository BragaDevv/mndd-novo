import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppLoadContextType {
  hasLoaded: boolean;
  setHasLoaded: (value: boolean) => void;
}

const AppLoadContext = createContext<AppLoadContextType>({
  hasLoaded: false,
  setHasLoaded: () => {},
});

export const AppLoadProvider = ({ children }: { children: ReactNode }) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <AppLoadContext.Provider value={{ hasLoaded, setHasLoaded }}>
      {children}
    </AppLoadContext.Provider>
  );
};

export const useAppLoad = () => useContext(AppLoadContext);
