"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { login, signup, logout, fetchCurrentUser } from "../lib/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    const user = await login(credentials);
    setUser(user);
    setIsLoading(false);
    return user;
  };

  const handleSignup = async (data) => {
    setIsLoading(true);
    const user = await signup(data);
    setUser(user);
    setIsLoading(false);
    return user;
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setUser(null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser().then(setUser).finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login: handleLogin, signup: handleSignup, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
