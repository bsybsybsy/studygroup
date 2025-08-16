import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "react-query";
import { Toaster, toast } from "react-hot-toast";
import StudyApplicants from "./pages/StudyApplicants";
import StudyDetail from "./pages/StudyDetail";
import { GOOGLE_CLIENT_ID } from "./config";
import Header from "./components/Layout/Header";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import RequestFormBuilder from "./components/RequestFormBuilder";
import { postAPI } from "./services/api";
import StudySessions from "./components/StudySessions";
import MyInvites from "./components/MyInvites";
import MyParticipatingStudies from "./components/MyStudies";
import MyCreatedStudies from "./components/MyCreatedStudies";
import { RequestForm } from "./types";

// Google OAuth 타입 정의
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Add basic types to fix TypeScript errors
interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  provider?: string;
}

interface StudySession {
  id: number;
  title: string;
  description: string;
  recruitNumber: number;
  currentNumber: number;
  studyStatus: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  category: string;
  mode: string;
  location?: string;
  isClosed: boolean;
  members?: StudyMember[];
  role?: string; // 추가: 사용자의 역할 (leader/member)
  joinedAt?: string; // 추가: 참여한 날짜
}

interface StudyApplication {
  id: number;
  applicant: User;
  post: {
    id: number;
    title: string;
    description: string;
    author: User;
    studyStatus: string;
    recruitNumber: number;
    currentNumber: number;
  };
  answers: any;
  isAccepted: boolean;
  isRejected: boolean;
  appliedAt: string;
}

interface StudyMember {
  id: number;
  userId: number;
  postId: number;
  role: string;
  joinedAt: string;
  user: User;
}

const queryClient = new QueryClient();

// ApplicationForm 컴포넌트 - 임시로 완전 차단
const ApplicationForm = ({
  questions,
  onSubmit,
  onCancel,
  loading = false,
}: {
  questions: any[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}) => {
  // 임시로 완전 차단
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">스터디 지원서</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">임시로 비활성화되었습니다.</p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const { login, loginWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const initializeGoogleOAuth = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (error) {
          console.error('Google OAuth 초기화 오류:', error);
        }
      } else {
        setTimeout(initializeGoogleOAuth, 1000);
      }
    };

    const waitForGoogleScript = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        initializeGoogleOAuth();
        return;
      }

      // Wait for the script to load from HTML head
      const checkInterval = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(checkInterval);
          initializeGoogleOAuth();
        }
      }, 100);
    };

    waitForGoogleScript();
  }, []);

  const handleGoogleCredential = (response: any) => {
    if (response.credential) {
      loginWithGoogle(response.credential);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    console.log('Email:', email);
    console.log('Password:', password);
    try {
      await login(email, password);
      console.log('Login successful');
      console.log('Redirecting to home page...');
      // 로그인 성공 후 홈페이지로 이동
      window.location.href = '/';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            StudyGroup에 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              새 계정 만들기
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => {
          console.log('Form onSubmit triggered');
          handleSubmit(e);
        }}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                autoComplete="off"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={() => console.log('Login button clicked')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                  window.google.accounts.id.prompt();
                } catch (error) {
                  console.error('Google OAuth prompt 오류:', error);
                  alert("Google 로그인 중 오류가 발생했습니다.");
                }
              } else {
                alert("Google 로그인을 사용할 수 없습니다. 페이지를 새로고침해주세요.");
              }
            }}
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 로그인
          </button>
        </form>
      </div>
    </div>
  );
};

const RegisterForm = () => {
  const { register, registerWithGoogle, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const initializeGoogleOAuth = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (error) {
          console.error('Google OAuth 초기화 오류:', error);
        }
      } else {
        setTimeout(initializeGoogleOAuth, 1000);
      }
    };

    const waitForGoogleScript = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        initializeGoogleOAuth();
        return;
      }

      // Wait for the script to load from HTML head
      const checkInterval = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(checkInterval);
          initializeGoogleOAuth();
        }
      }, 100);
    };

    waitForGoogleScript();
  }, []);

  const handleGoogleCredential = (response: any) => {
    if (response.credential) {
      registerWithGoogle(response.credential);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.email) newErrors.email = "이메일을 입력해주세요.";
    if (!formData.username) newErrors.username = "사용자명을 입력해주세요.";
    if (!formData.password) newErrors.password = "비밀번호를 입력해주세요.";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await register(formData.email, formData.username, formData.password);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            StudyGroup 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            또는{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              기존 계정으로 로그인
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="off"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "회원가입 중..." : "회원가입"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">또는</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                  window.google.accounts.id.prompt();
                } catch (error) {
                  console.error('Google OAuth prompt 오류:', error);
                  alert("Google 회원가입 중 오류가 발생했습니다.");
                }
              } else {
                alert("Google 회원가입을 사용할 수 없습니다. 페이지를 새로고침해주세요.");
              }
            }}
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 회원가입
          </button>
        </form>
      </div>
    </div>
  );
};

const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user && user.username && typeof user.username === 'string' ? user.username.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user && user.username && typeof user.username === 'string' ? user.username : '사용자명 없음'}
                </h1>
                <p className="text-gray-600">{user && user.email && typeof user.email === 'string' ? user.email : '이메일 없음'}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    사용자명
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user && user.username && typeof user.username === 'string' ? user.username : '사용자명 없음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">이메일</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user && user.email && typeof user.email === 'string' ? user.email : '이메일 없음'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">역할</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user && user.role && typeof user.role === 'string' ? user.role : "일반 사용자"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    가입 방식
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user && user.provider && typeof user.provider === 'string' ? user.provider : "이메일"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex space-x-4">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                프로필 수정
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                비밀번호 변경
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            StudyGroup에 오신 것을 환영합니다!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            함께 성장하는 스터디를 찾아보세요
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/studies")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              스터디 찾기
            </button>
            <button
              onClick={() => navigate("/create-study")}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
            >
              스터디 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudyList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studies, setStudies] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      const response = await postAPI.getAllPosts();
      console.log("Studies API Response:", response.data); // Debug log
      
      // Handle different possible response structures
      const responseData = response.data as any;
      
      if (Array.isArray(responseData)) {
        setStudies(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setStudies(responseData.data);
      } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
        // 중첩된 data 구조 처리
        setStudies(responseData.data.data);
      } else {
        console.warn("Unexpected studies response structure:", responseData);
        setStudies([]);
      }
    } catch (error) {
      console.error("Failed to fetch studies:", error);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">스터디 목록</h1>
          <button
            onClick={() => navigate("/create-study")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            스터디 만들기
          </button>
        </div>

        {!Array.isArray(studies) || studies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">등록된 스터디가 없습니다.</p>
            <button
              onClick={() => navigate("/create-study")}
              className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              첫 번째 스터디를 만들어보세요!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((study) => (
              <div
                key={study && study.id && typeof study.id === 'number' ? study.id : Math.random()}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                  onClick={() => navigate(`/studies/${study && study.id && typeof study.id === 'number' ? study.id : 0}`)}
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {study && study.title && typeof study.title === 'string' ? study.title : '제목 없음'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {study && study.description && typeof study.description === 'string' ? study.description : '설명 없음'}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>작성자: {study.author && study.author.username && typeof study.author.username === 'string' ? study.author.username : '작성자 없음'}</span>
                    <span>{(study.currentNumber && typeof study.currentNumber === 'number' ? study.currentNumber : 0)}/{(study.recruitNumber && typeof study.recruitNumber === 'number' ? study.recruitNumber : 0)}명</span>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'recruiting') ? 'bg-green-100 text-green-800' :
                      (study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'in-process') ? 'bg-yellow-100 text-yellow-800' :
                      (study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'over') ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'recruiting') ? '모집중' :
                       (study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'in-process') ? '모집완료' :
                       (study.studyStatus && typeof study.studyStatus === 'string' && study.studyStatus === 'over') ? '종료' : 
                       (study.studyStatus && typeof study.studyStatus === 'string') ? `상태: ${study.studyStatus}` : '상태 미정'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {study.createdAt && typeof study.createdAt === 'string' ? new Date(study.createdAt).toLocaleDateString() : '날짜 없음'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CreateStudy = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showRequestFormBuilder, setShowRequestFormBuilder] = useState(false);
  const [requestFormData, setRequestFormData] = useState<RequestForm | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recruitNumber: 2,
    studyStatus: "recruiting",
    category: "기타",
    mode: "온라인"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // requestForm을 포함하여 스터디를 한 번에 생성
      const postData = {
        ...formData,
        requestForm: requestFormData // requestForm을 post 데이터에 포함
      };

      console.log('🔍 전송할 post 데이터:', postData);
      
      const postResponse = await postAPI.createPost(postData);

      if (postResponse.data?.data?.id) {
        toast.success("스터디가 성공적으로 생성되었습니다!");
        navigate("/studies");
      } else {
        toast.error("스터디 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create study:", error);
      toast.error("스터디 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'recruitNumber' ? parseInt(value) : value
    }));
  };

  const handleRequestFormSave = (formData: RequestForm) => {
    setRequestFormData(formData);
    setShowRequestFormBuilder(false);
  };

  const handleRequestFormCancel = () => {
    setShowRequestFormBuilder(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">새 스터디 만들기</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  스터디 제목 *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="스터디 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  스터디 설명 *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="스터디에 대한 자세한 설명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="recruitNumber" className="block text-sm font-medium text-gray-700">
                  최대 인원 *
                </label>
                <select
                  id="recruitNumber"
                  name="recruitNumber"
                  value={formData.recruitNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}명</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  카테고리 *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="기타">기타</option>
                  <option value="프로그래밍">프로그래밍</option>
                  <option value="언어">언어</option>
                  <option value="자격증">자격증</option>
                  <option value="취업준비">취업준비</option>
                  <option value="시험준비">시험준비</option>
                </select>
              </div>

              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                  진행 방식 *
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="온라인">온라인</option>
                  <option value="오프라인">오프라인</option>
                  <option value="혼합">혼합</option>
                </select>
              </div>

              {/* RequestForm Builder */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">지원 양식 설정 (선택사항)</h3>
                  <button
                    type="button"
                    onClick={() => setShowRequestFormBuilder(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    지원 양식 만들기
                  </button>
                </div>
                
                {false && requestFormData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          임시로 비활성화됨
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          질문 정보를 불러올 수 없습니다
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequestFormData(null)}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/studies")}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "생성 중..." : "스터디 만들기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* RequestForm Builder Modal */}
      {showRequestFormBuilder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-full max-w-6xl">
            <RequestFormBuilder
              onSave={handleRequestFormSave}
              onCancel={handleRequestFormCancel}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};






const MyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<StudyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyApplications = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await postAPI.getMyApplications();
      console.log("API Response:", response.data); // Debug log
      
      // Handle different possible response structures
      const responseData = response.data as any;
      
      let applicationsData: any[] = [];
      
      if (Array.isArray(responseData)) {
        applicationsData = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        applicationsData = responseData.data;
      } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
        // 중첩된 data 구조 처리
        applicationsData = responseData.data.data;
      } else {
        console.warn("Unexpected response structure:", responseData);
        applicationsData = [];
      }

      // 내가 만든 스터디는 제외하고 필터링
      const filteredApplications = applicationsData.filter(application => {
        // post.author.id가 현재 사용자의 id와 다른 경우만 포함
        return application.post?.author?.id !== user.id;
      });

      console.log("Filtered applications (excluding my own studies):", filteredApplications);
      setApplications(filteredApplications);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyApplications();
    }
  }, [user, fetchMyApplications]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 지원 현황</h1>
          <p className="text-gray-600">각 스터디를 클릭하면 상세 정보를 볼 수 있습니다</p>
        </div>

        {!Array.isArray(applications) || applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">지원한 스터디가 없습니다.</p>
            <button
              onClick={() => navigate("/studies")}
              className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              스터디 찾아보기
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application && application.id && typeof application.id === 'number' ? application.id : Math.random()}>
                  <div 
                    className="px-6 py-5 flex items-center justify-between hover:bg-blue-50 hover:border-l-4 hover:border-l-blue-500 cursor-pointer transition-all duration-200 group border-l-4 border-l-transparent"
                    onClick={() => navigate(`/studies/${application.post && application.post.id && typeof application.post.id === 'number' ? application.post.id : 0}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {application.post && application.post.title && typeof application.post.title === 'string' ? application.post.title : '제목 없음'}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {application.post && application.post.description && typeof application.post.description === 'string' ? application.post.description : '설명 없음'}
                          </p>
                          <p className="text-xs text-gray-400">
                            작성자: {application.post && application.post.author && application.post.author.username && typeof application.post.author.username === 'string' ? application.post.author.username : '작성자 없음'} | 
                            모집인원: {(application.post && application.post.currentNumber && typeof application.post.currentNumber === 'number' ? application.post.currentNumber : 0)}/{(application.post && application.post.recruitNumber && typeof application.post.recruitNumber === 'number' ? application.post.recruitNumber : 0)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        지원일: {application.appliedAt && typeof application.appliedAt === 'string' ? new Date(application.appliedAt).toLocaleDateString() : '날짜 없음'}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (application.isAccepted === true) ? 'bg-green-100 text-green-800' :
                        (application.isAccepted === false) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(application.isAccepted === true) ? '승인됨' :
                         (application.isAccepted === false) ? '대기중' : '알 수 없음'}
                      </span>
                      <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const StudyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [applications, setApplications] = useState<any[]>([]);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState<any>(null);

  useEffect(() => {
    if (postId) {
      fetchStudyApplications();
      fetchPostDetails();
      fetchRequestForm();
    }
  }, [postId]);

  const fetchStudyApplications = async () => {
    try {
      const response = await postAPI.getStudyApplications(parseInt(postId!));
      console.log("Study Applications API Response:", response.data);
      
      const responseData = response.data as any;
      
      if (Array.isArray(responseData)) {
        setApplications(responseData);
      } else if (responseData && Array.isArray(responseData.data)) {
        setApplications(responseData.data);
      } else if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
        setApplications(responseData.data.data);
      } else {
        console.warn("Unexpected applications response structure:", responseData);
        setApplications([]);
      }
    } catch (error) {
      console.error("Failed to fetch study applications:", error);
      setApplications([]);
    }
  };

  const fetchPostDetails = async () => {
    try {
      // 임시로 post 객체 완전 차단
      // const response = await postAPI.getPost(parseInt(postId!));
      // const responseData = response.data as any;
      
      // if (responseData && responseData.data) {
      //   setPost(responseData.data);
      // } else if (responseData) {
      //   setPost(responseData);
      // }
      setPost({} as any);
    } catch (error) {
      console.error("Failed to fetch post details:", error);
    }
  };

  const fetchRequestForm = async () => {
    try {
      const response = await postAPI.getRequestForm(parseInt(postId!));
      const responseData = response.data as any;
      
      if (responseData && responseData.data) {
        setRequestForm(responseData.data);
      } else if (responseData) {
        setRequestForm(responseData);
      }
    } catch (error) {
      console.error("Failed to fetch request form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: number) => {
    try {
      console.log("🔍 Accepting application:", applicationId);
      const response = await postAPI.acceptApplication(applicationId);
      console.log("🔍 Accept response:", response);
      toast.success("지원자를 승인했습니다.");
      // 목록 새로고침
      setTimeout(() => {
        fetchStudyApplications();
      }, 500);
    } catch (error) {
      console.error("Failed to accept application:", error);
      toast.error("지원자 승인에 실패했습니다.");
    }
  };

  const handleDeclineApplication = async (applicationId: number) => {
    try {
      console.log("🔍 Declining application:", applicationId);
      const response = await postAPI.declineApplication(applicationId);
      console.log("🔍 Decline response:", response);
      toast.success("지원자를 거절했습니다.");
      // 목록 새로고침
      setTimeout(() => {
        fetchStudyApplications();
      }, 500);
    } catch (error) {
      console.error("Failed to decline application:", error);
      toast.error("지원자 거절에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">스터디를 찾을 수 없습니다</h2>
          <button
            onClick={() => navigate("/my-studies")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            내 스터디로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate("/my-studies")}
                className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>내 스터디로 돌아가기</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title} - 지원자 관리</h1>
              <p className="text-gray-600">지원자들의 지원서를 확인하고 승인/거절할 수 있습니다</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                <p>모집 인원: {post.currentNumber || 0}/{post.recruitNumber || 0}명</p>
                <p>지원자: {applications.length}명</p>
              </div>
            </div>
          </div>
        </div>

        {/* 지원자 목록 */}
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 지원자가 없습니다</h3>
            <p className="text-gray-500">스터디 모집이 활발해지면 지원자들이 나타날 것입니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* 지원자 기본 정보 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {application.applicant?.username?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.applicant?.username || '알 수 없음'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {application.applicant?.email || '이메일 없음'}
                        </p>
                        <p className="text-xs text-gray-400">
                          지원일: {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        application.isAccepted === true ? 'bg-green-100 text-green-800' :
                        application.isRejected === true ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.isAccepted === true ? '승인됨' :
                         application.isRejected === true ? '거절됨' : '대기중'}
                      </span>
                      {/* 디버깅 정보 */}
                      <span className="text-xs text-gray-400">
                        (ID: {application.id}, isAccepted: {String(application.isAccepted)}, isRejected: {String(application.isRejected)})
                      </span>
                    </div>
                  </div>

                  {/* 지원서 답변 - 임시로 차단 */}
                  {false && requestForm && requestForm.questions && application.answers && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">지원서 답변</h4>
                      <div className="space-y-3">
                        {(() => {
                          try {
                            let questionsArray = requestForm.questions;
                            
                            // 객체인 경우 배열로 변환
                            if (questionsArray && typeof questionsArray === 'object' && !Array.isArray(questionsArray)) {
                              console.log('🔍 App - questions가 객체입니다. 배열로 변환합니다:', questionsArray);
                              questionsArray = Object.values(questionsArray);
                            }
                            
                            // 배열이고 길이가 0보다 큰 경우에만 표시
                            if (Array.isArray(questionsArray) && questionsArray.length > 0) {
                              return questionsArray.map((question: any, index: number) => {
                                const answer = application.answers[`question_${index}`] || application.answers[question.questionText] || '답변 없음';
                                return (
                                  <div key={question.id || index} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      {question.questionText}
                                      {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {Array.isArray(answer) ? answer.join(', ') : answer}
                                    </p>
                                  </div>
                                );
                              });
                            } else {
                              return (
                                <div className="text-sm text-gray-500">
                                  질문이 없습니다.
                                </div>
                              );
                            }
                          } catch (error) {
                            console.error('🔍 App - questions 처리 중 에러:', error);
                            return (
                              <div className="text-sm text-red-500">
                                질문 처리 중 오류가 발생했습니다.
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  {!application.isAccepted && !application.isRejected && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleAcceptApplication(application.id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        승인하기
                      </button>
                      <button
                        onClick={() => handleDeclineApplication(application.id)}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        거절하기
                      </button>
                    </div>
                  )}

                  {/* 이미 처리된 경우 상태 표시 */}
                  {(application.isAccepted || application.isRejected) && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        {application.isAccepted ? 
                          '✅ 이 지원자는 승인되었습니다.' : 
                          '❌ 이 지원자는 거절되었습니다.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header />}
      <main>{children}</main>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/me"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studies"
                element={
                  <ProtectedRoute>
                    <StudyList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studies/:id"
                element={
                  <ProtectedRoute>
                    <StudyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studies/:postId/applications"
                element={
                  <ProtectedRoute>
                    <StudyApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studies/:postId/sessions"
                element={
                  <ProtectedRoute>
                    <StudySessions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/studies/:id/applicants"
                element={
                  <ProtectedRoute>
                    <StudyApplicants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-applications"
                element={
                  <ProtectedRoute>
                    <MyApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-invites"
                element={
                  <ProtectedRoute>
                    <MyInvites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-studies"
                element={
                  <ProtectedRoute>
                    <MyParticipatingStudies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-created-studies"
                element={
                  <ProtectedRoute>
                    <MyCreatedStudies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-study"
                element={
                  <ProtectedRoute>
                    <CreateStudy />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

