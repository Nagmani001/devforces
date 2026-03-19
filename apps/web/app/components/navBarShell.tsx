"use client";

import { ReactNode } from "react";
import NavBar from "@/app/components/navBar";
import { NavBarActionsProvider, useNavBarActions } from "@/app/components/navBarActions";

function NavBarWithActions({ children }: { children: ReactNode }) {
  const { actions } = useNavBarActions();

  return (
    <>
      <NavBar>{actions}</NavBar>
      {children}
    </>
  );
}

export default function NavBarShell({ children }: { children: ReactNode }) {
  return (
    <NavBarActionsProvider>
      <NavBarWithActions>{children}</NavBarWithActions>
    </NavBarActionsProvider>
  );
}
