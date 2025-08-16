import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userAPI } from '../services/api';

// Firebase 타입 선언
declare global {
  interface Window {
    firebase: any;
  }
}

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  provider?: string;
  fcmToken?: string;
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
  updateFCMToken: () => Promise<void>;
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
        
        // 사용자 정보 가져온 후 FCM 토큰 업데이트 시도
        await updateFCMTokenIfAvailable();
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
        
        // FCM 토큰 업데이트 시도
        await updateFCMTokenIfAvailable();
        
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

  // FCM 토큰 업데이트 함수
  const updateFCMTokenIfAvailable = async () => {
    try {
      console.log('AuthContext: Starting FCM token update...');
      console.log('AuthContext: ServiceWorker support:', 'serviceWorker' in navigator);
      console.log('AuthContext: PushManager support:', 'PushManager' in window);
      console.log('AuthContext: Notification permission:', Notification.permission);
      
      // 브라우저가 FCM을 지원하는지 확인
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Firebase Messaging이 초기화되어 있는지 확인
        if (window.firebase && window.firebase.messaging) {
          console.log('AuthContext: Firebase messaging available');
          const messaging = window.firebase.messaging();
          
          // 알림 권한 확인
          if (Notification.permission === 'granted') {
            console.log('AuthContext: Notification permission granted, getting FCM token...');
            try {
              // FCM 토큰 가져오기
              const fcmToken = await messaging.getToken();
              console.log('AuthContext: FCM token received:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
              
              if (fcmToken) {
                console.log('AuthContext: FCM token received, updating backend');
                // 백엔드로 FCM 토큰 전송
                const response = await userAPI.updateFCMToken(fcmToken);
                console.log('AuthContext: Backend response:', response.data);
                console.log('AuthContext: FCM token updated successfully');
              } else {
                console.log('AuthContext: FCM token is null or empty');
              }
            } catch (fcmError) {
              console.error('AuthContext: Failed to get FCM token:', fcmError);
            }
          } else {
            console.log('AuthContext: Notification permission not granted:', Notification.permission);
          }
        } else {
          console.log('AuthContext: Firebase messaging not available');
          console.log('AuthContext: window.firebase:', !!window.firebase);
          console.log('AuthContext: window.firebase.messaging:', !!(window.firebase && window.firebase.messaging));
        }
      } else {
        console.log('AuthContext: FCM not supported in this browser');
      }
    } catch (error) {
      console.error('AuthContext: FCM token update failed:', error);
    }
  };

  // 수동으로 FCM 토큰 업데이트하는 함수
  const updateFCMToken = async () => {
    console.log('AuthContext: Manual FCM token update requested');
    await updateFCMTokenIfAvailable();
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
    updateFCMToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 