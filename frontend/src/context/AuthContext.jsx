import { useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api("/auth/me");
      setUser(u);
    } catch {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password, captchaToken) => {
    const { user: u, token } = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, captchaToken }),
    });
    localStorage.setItem("token", token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password, name, captchaToken) => {
    const { user: u, token } = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, captchaToken }),
    });
    localStorage.setItem("token", token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
