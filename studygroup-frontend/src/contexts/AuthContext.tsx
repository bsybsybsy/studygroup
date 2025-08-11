import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  registerWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('AuthContext: No token found, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('AuthContext: Fetching user with token:', token);
      const response = await fetch("http://localhost:3001/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: User data received:', data);
        setUser(data.data);
        console.log('AuthContext: User state updated:', data.data);
      } else {
        console.log('AuthContext: Failed to fetch user, removing token');
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("AuthContext: Failed to fetch user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log('AuthContext: Starting login process');
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log('AuthContext: Login response:', data);
      
      if (response.ok) {
        const token = data.token || (data.data && data.data.token);
        if (!token) {
          throw new Error("토큰을 받지 못했습니다.");
        }
        console.log('AuthContext: Token received, storing in localStorage');
        localStorage.setItem("token", token);
        console.log('AuthContext: Fetching current user...');
        await fetchCurrentUser();
        console.log('AuthContext: Login process completed successfully');
      } else {
        throw new Error(data.message || "로그인 실패");
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      
      if (response.ok) {
        const token = data.token || (data.data && data.data.token);
        if (!token) {
          throw new Error("Google 로그인 중 토큰을 받지 못했습니다.");
        }
        localStorage.setItem("token", token);
        await fetchCurrentUser();
      } else {
        throw new Error(data.message || "Google 로그인 실패");
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/auth/google/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      
      if (response.ok) {
        const token = data.token || (data.data && data.data.token);
        if (!token) {
          throw new Error("Google 회원가입 중 토큰을 받지 못했습니다.");
        }
        localStorage.setItem("token", token);
        await fetchCurrentUser();
      } else {
        throw new Error(data.message || "Google 회원가입 실패");
      }
    } catch (error) {
      console.error("Google registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Registration successful, no token needed
      } else {
        throw new Error(data.message || "회원가입 실패");
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    registerWithGoogle,
    logout,
    fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 