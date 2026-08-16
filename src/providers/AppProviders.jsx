"use client";

import AuthProvider from "@/context/AuthContext";
import UIProvider from "@/context/UiContext";
import QueryProvider from "@/providers/QueryProvider";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <UIProvider>{children}</UIProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
