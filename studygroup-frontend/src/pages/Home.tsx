import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postAPI } from '../services/api';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
// import { getSafeApplicationFormTemplate } from '../utils/dataTransform';
import { 
  UserGroupIcon, 
  MapPinIcon, 
  CalendarIcon,
  ArrowRightIcon,
  EyeIcon,
  PencilIcon,
  UsersIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const Home: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplicationForm, setShowApplicationForm] = useState<number | null>(null);
  const [applicationAnswers, setApplicationAnswers] = useState<{[key: string]: string}>({});
  
  // 디버깅 로그 추가
  console.log('🔍 Home 컴포넌트 렌더링 시작');
  console.log('🔍 user 상태:', user);
  console.log('🔍 user 존재 여부:', !!user);
  
  const { data: postsResponse, isLoading, error } = useQuery('posts', postAPI.getAllPosts);
  const { data: myStudiesResponse } = useQuery(
    'myStudies', 
    postAPI.getMyStudies,
    { enabled: !!user }
  );
  const { data: myApplicationsResponse } = useQuery(
    'myApplications',
    () => postAPI.getMyApplications(),
    { enabled: !!user }
  );

  // 임시로 post 객체들 완전 차단
  // const posts = postsResponse?.data?.data || [];
  // const myStudies = myStudiesResponse?.data?.data || [];
  // const myApplications = myApplicationsResponse?.data?.data || [];
  const posts = [] as any[];
  const myStudies = [] as any[];
  const myApplications = [] as any[];
  
  console.log('🔍 Home - myApplicationsResponse 구조:', myApplicationsResponse);
  console.log('🔍 Home - myApplicationsResponse.data:', myApplicationsResponse?.data);
  console.log('🔍 Home - myApplicationsResponse.data.data:', myApplicationsResponse?.data?.data);
  console.log('🔍 Home - myApplications:', myApplications);

  // 임시로 모든 post 관련 렌더링 완전 차단
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">임시로 차단됨</h1>
        <p className="text-lg text-gray-600">applicationFormTemplate 문제 해결 중...</p>
      </div>
    </div>
  );
};

export default Home; 