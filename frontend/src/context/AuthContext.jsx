import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  // Hydrate auth state from localStorage on app startup
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setIsHydrating(false);
      return;
    }

    // Validate stored token against the server
    api
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
      .then((res) => {
        persistUser(res.data.user);
        setToken(savedToken);
      })
      .catch(() => {
        // Token expired or invalid: clean up
        persistUser(null);
        setToken(null);
        localStorage.removeItem("token");
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [persistUser]);

  // Call after successful login or registration
  const login = useCallback(
    (userData, authToken) => {
      persistUser(userData);
      setToken(authToken);
      localStorage.setItem("token", authToken);
    },
    [persistUser]
  );

  // Call to logout
  const logout = useCallback(() => {
    persistUser(null);
    setToken(null);
    localStorage.removeItem("token");
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: Boolean(user && token),
      isHydrating,
      login,
      logout,
    }),
    [user, token, isHydrating, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for components to access auth state
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
