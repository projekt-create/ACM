"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ACCESS_TOKEN_COOKIE = "access_token";
const USER_STORAGE_KEY = "user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const AuthContext = createContext(null);

function setAccessTokenCookie(token) {
  if (!token) return;

  document.cookie = [
    `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function removeAccessTokenCookie() {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function getStoredUser() {
  try {
    const value = window.localStorage.getItem(USER_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUser(getStoredUser());
      setIsLoading(false);
    }, 0);
  }, []);

  const login = (response) => {
    const payload = response?.data ?? response;
    const token = payload?.accessToken;
    const admin = payload?.admin;

    if (!token || !admin) {
      throw new Error("Login javobida accessToken yoki admin ma'lumoti yo'q");
    }

    setAccessTokenCookie(token);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(admin));
    setUser(admin);

    return { token, user: admin, expiresIn: payload.expiresIn };
  };

  const logout = () => {
    removeAccessTokenCookie();
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  }

  return context;
}
