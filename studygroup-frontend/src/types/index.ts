// 사용자 관련 타입
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
  studyrole?: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

// RequestForm 관련 타입
export interface RequestFormQuestion {
  questionText: string;
  type: string;
  isRequired: boolean;
  order: number;
  options?: string[];
}

export interface RequestForm {
  id?: number;
  postId?: number;
  title: string;
  questions: RequestFormQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

// 스터디 포스트 관련 타입
export interface Post {
  id: number;
  title: string;
  description: string;
  category: string;
  mode: string;
  location?: string;
  recruitNumber: number;
  currentNumber?: number;
  author: User;
  studyStartDate?: string;
  studyEndDate?: string;
  studyStatus?: string;
  applicationFormTemplate?: any[];
  requestForm?: RequestForm; // requestForm 필드 추가
  createdAt: string;
  updatedAt: string;
  studySessions?: StudySession[];
  studyMembers?: StudyMember[];
  members?: StudyMember[]; // 백엔드에서 실제로 반환하는 필드
  comments?: Comment[];
}

// 스터디 세션 관련 타입
export interface StudySession {
  id: number;
  postId: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// 스터디 멤버 관련 타입
export interface StudyMember {
  id: number;
  user: User;
  post: Post;
  role: string;
  joinedAt: string;
}

// 댓글 관련 타입
export interface Comment {
  id: number;
  content: string;
  author: User;
  post: Post;
  createdAt: string;
  updatedAt: string;
}

// 출석 관련 타입
export interface Attendance {
  id: number;
  attender: User;
  post: Post;
  studySession?: StudySession;
  date: string;
  isPresent: boolean;
  proof_text?: string;
  proof_file?: string;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  statusCode: number;
  timeStamp: string;
  message: string;
  data: T;
}

// 폼 관련 타입
export interface RequestFormQuestion {
  id: number;
  questionText: string;
  type: QuestionType;
  isRequired: boolean;
  order: number;
  options?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestForm {
  id: number;
  postId: number;
  title: string;
  questions: RequestFormQuestion[];
  createdAt: string;
  updatedAt: string;
}

// 지원자 관련 타입
export interface StudyApplication {
  id: number;
  applicant: User;
  post: Post;
  answers: Record<string, any>;
  isAccepted: boolean;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

// 세션 목표 관련 타입
export interface SessionGoals {
  id: number;
  session: StudySession;
  user: User;
  goalofToday?: string;
  proofofToday?: {
    type: 'text' | 'link' | 'image' | 'file';
    content: string;
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    serverFileName?: string; // 실제 서버 파일명
  }[];
  createdAt: string;
  updatedAt: string;
} 