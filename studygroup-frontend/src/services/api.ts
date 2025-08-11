import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Post, 
  StudySession, 
  Comment, 
  Attendance, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ApiResponse 
} from '../types';

// API 기본 설정
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료된 경우에만 로그아웃
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // JWT 토큰 디코딩 (페이로드만)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          // 토큰이 실제로 만료된 경우에만 로그아웃
          if (payload.exp && payload.exp < currentTime) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        } catch (e) {
          // 토큰 디코딩 실패 시 로그아웃
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),
  
  googleLogin: (): Promise<AxiosResponse<any>> =>
    api.get('/auth/google'),
};

// 스터디 포스트 관련 API
export const postAPI = {
  getAllPosts: (): Promise<AxiosResponse<ApiResponse<Post[]>>> =>
    api.get('/post'),
  
  getPost: (id: number): Promise<AxiosResponse<ApiResponse<Post>>> =>
    api.get(`/post/${id}`),
  
  createPost: (data: any): Promise<AxiosResponse<ApiResponse<Post>>> =>
    api.post('/post', data),
  
  updatePost: (id: number, data: any): Promise<AxiosResponse<ApiResponse<Post>>> =>
    api.patch(`/post/${id}`, data),
  
  deletePost: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/post/${id}`),
  
  joinStudy: (postId: number, answers?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post(`/post/${postId}/join`, { answers }),
  
  leaveStudy: (postId: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/post/${postId}/leave`),
  
  // 내가 만든 스터디 목록
  getMyStudies: (): Promise<AxiosResponse<ApiResponse<Post[]>>> =>
    api.get('/post/my-studies'),
  
  // 내가 지원한 스터디 목록
  getMyApplications: (): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get('/post/applications'),

  // 스터디 지원하기
  applyToStudy: (postId: number, answers?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post(`/post/${postId}/apply`, { answers }),

  // 지원자 관리 관련 API
  getStudyApplications: (postId: number): Promise<AxiosResponse<ApiResponse<any[]>>> =>
    api.get(`/post/${postId}/applications`),
  
  acceptApplication: (applicationId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post(`/post/applications/${applicationId}/accept`),
  
  declineApplication: (applicationId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post(`/post/applications/${applicationId}/decline`),

  // RequestForm 관련 API
  // 지원 양식 생성
  createRequestForm: (data: {
    postId: number;
    title: string;
    questions: Array<{
      questionText: string;
      type: string;
      isRequired: boolean;
      order: number;
      options?: string[];
    }>;
  }): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/requestform', data),

  // 지원 양식 조회
  getRequestForm: (postId: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/requestform/${postId}`),

  // 지원 양식 수정
  updateRequestForm: (
    id: number,
    data: {
      postId: number;
      title: string;
      questions: Array<{
        questionText: string;
        type: string;
        isRequired: boolean;
        order: number;
        options?: string[];
      }>;
    }
  ): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.patch(`/requestform/${id}`, data),

  // 지원 양식 삭제
  deleteRequestForm: (id: number): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.delete(`/requestform/${id}`),
};

// 파일 업로드 관련 API
export const uploadAPI = {
  uploadFiles: (files: File[]): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// 댓글 관련 API
export const commentAPI = {
  getComments: (postId?: number): Promise<AxiosResponse<ApiResponse<Comment[]>>> =>
    api.get('/comment', { params: { postId } }),
  
  createComment: (data: any): Promise<AxiosResponse<ApiResponse<Comment>>> =>
    api.post('/comment', data),
  
  updateComment: (id: number, data: any): Promise<AxiosResponse<ApiResponse<Comment>>> =>
    api.patch(`/comment/${id}`, data),
  
  deleteComment: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    api.delete(`/comment/${id}`),
};

// 출석 관련 API
export const attendanceAPI = {
  checkAttendance: (postId: number, data: any, file?: File): Promise<AxiosResponse<ApiResponse<Attendance>>> => {
    const formData = new FormData();
    formData.append('proof_text', data.proof_text);
    if (file) {
      formData.append('proof_file', file);
    }
    return api.post(`/attendance/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  checkAttendanceForSession: (sessionId: number, data: any, file?: File): Promise<AxiosResponse<ApiResponse<Attendance>>> => {
    const formData = new FormData();
    formData.append('proof_text', data.proof_text);
    if (file) {
      formData.append('proof_file', file);
    }
    return api.post(`/attendance/session/${sessionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getAttendanceForSession: (sessionId: number): Promise<AxiosResponse<ApiResponse<Attendance[]>>> =>
    api.get(`/attendance/session/${sessionId}`),
};

// Firebase 관련 API
export const firebaseAPI = {
  sendNotification: (data: { token: string; title?: string; body?: string }): Promise<AxiosResponse<any>> =>
    api.post('/firebase/send-notification', data),
  
  startStudySessionReminder: (): Promise<AxiosResponse<any>> =>
    api.post('/firebase/study-session-reminder/start'),
  
  testStudySessionReminder: (sessionId: number): Promise<AxiosResponse<any>> =>
    api.post(`/firebase/study-session-reminder/test/${sessionId}`),
  
  getStudySessionReminderStatus: (): Promise<AxiosResponse<any>> =>
    api.get('/firebase/study-session-reminder/status'),
};

// 사용자 관련 API
export const userAPI = {
  getCurrentUser: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/user/me'),
  
  updateUser: (data: any): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.patch('/user', data),
  
  updateFcmToken: (token: string): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.patch('/user/fcm-token', { fcmToken: token }),
};

export default api; 