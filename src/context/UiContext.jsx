"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const UIContext = createContext(null);

export default function UIProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const savedLang = window.localStorage.getItem("lang");

    setTimeout(() => {
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
      if (savedLang) {
        setLang(savedLang);
      }
      setHydrated(true);
    }, 0);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hydrated) {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme, hydrated]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("lang", lang);
    }
  }, [lang, hydrated]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  const toggleLang = () => setLang((current) => (current === "uz" ? "ru" : "uz"));

  const value = useMemo(
    () => ({
      theme,
      lang,
      sidebarOpen,
      setTheme,
      setLang,
      toggleTheme,
      toggleLang,
      toggleSidebar: () => setSidebarOpen((open) => !open),
      closeSidebar: () => setSidebarOpen(false),
      openSidebar: () => setSidebarOpen(true),
    }),
    [theme, lang, sidebarOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error("useUI UIProvider ichida ishlatilishi kerak");
  }

  return context;
}
