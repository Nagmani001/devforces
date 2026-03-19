"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type NavBarActionsContextValue = {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
};

const NavBarActionsContext = createContext<NavBarActionsContextValue | null>(null);

export function NavBarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);

  return (
    <NavBarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </NavBarActionsContext.Provider>
  );
}

export function useNavBarActions() {
  const ctx = useContext(NavBarActionsContext);
  if (!ctx) {
    throw new Error("useNavBarActions must be used within NavBarActionsProvider");
  }
  return ctx;
}
