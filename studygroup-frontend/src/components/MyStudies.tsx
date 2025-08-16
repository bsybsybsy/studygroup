import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../services/api';

interface StudyPost {
  id: number;
  title: string;
  content: string;
  studyStatus: string;
  currentNumber: number;
  recruitNumber: number;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface StudyMembership {
  id: number;
  role: string;
  joinedAt: string;
  post: StudyPost;
}

const MyStudies: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studies, setStudies] = useState<StudyMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyStudies();
    }
  }, [user]);

  const fetchMyStudies = async () => {
    try {
      console.log('🔍 fetchMyStudies 시작');
      console.log('🔍 현재 사용자:', user);
      
      // studymember 테이블에서 leader 또는 member 역할로 있는 스터디들 가져오기
      const memberStudiesResponse = await postAPI.getMyMemberStudies();
      console.log('🔍 fetchMyStudies - memberStudiesResponse:', memberStudiesResponse);
      console.log('🔍 memberStudiesResponse.status:', memberStudiesResponse.status);
      console.log('🔍 memberStudiesResponse.statusText:', memberStudiesResponse.statusText);
      
      let memberStudiesData = [];
      console.log('🔍 memberStudiesResponse.data:', memberStudiesResponse.data);
      console.log('🔍 memberStudiesResponse.data.data:', memberStudiesResponse.data?.data);
      
      if (memberStudiesResponse.data?.data?.data && Array.isArray(memberStudiesResponse.data.data.data)) {
        // response.data.data.data 구조
        memberStudiesData = memberStudiesResponse.data.data.data;
        console.log('🔍 Using response.data.data.data structure for memberStudies');
      } else if (memberStudiesResponse.data?.data && Array.isArray(memberStudiesResponse.data.data)) {
        // response.data.data 구조
        memberStudiesData = memberStudiesResponse.data.data;
        console.log('🔍 Using response.data.data structure for memberStudies');
      } else if (memberStudiesResponse.data && Array.isArray(memberStudiesResponse.data)) {
        // response.data 구조
        memberStudiesData = memberStudiesResponse.data;
        console.log('🔍 Using response.data structure for memberStudies');
      } else if (Array.isArray(memberStudiesResponse)) {
        // response 자체가 배열
        memberStudiesData = memberStudiesResponse;
        console.log('🔍 Using response directly for memberStudies');
      }
      
      console.log('🔍 memberStudiesData:', memberStudiesData);
      console.log('🔍 memberStudiesData.length:', memberStudiesData.length);
      
      // studyStatus가 'in-process'인 스터디들만 필터링
      const inProcessStudies = memberStudiesData.filter(study => {
        const isInProcess = study.post?.studyStatus === 'in-process';
        console.log(`🔍 Study ${study.post?.id}: status=${study.post?.studyStatus}, isInProcess=${isInProcess}`);
        return isInProcess;
      });
      
      console.log('🔍 fetchMyStudies - inProcessStudies (after filtering):', inProcessStudies);
      console.log('🔍 inProcessStudies.length:', inProcessStudies.length);
      
      setStudies(inProcessStudies);
    } catch (error) {
      console.error('🔍 fetchMyStudies 에러:', error);
      setStudies([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recruiting':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">모집중</span>;
      case 'in-process':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">모집완료</span>;
      case 'in-process':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">진행중</span>;
      case 'over':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">종료</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleStudyClick = (studyId: number) => {
    // studymember 테이블에서 member 역할로 있고, 해당 postId의 post에서 status가 in-process인 경우
    // 또는 studyinvite에서 accepted한 post의 sessions 화면으로 redirect
    navigate(`/studies/${studyId}/sessions`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">리더</span>;
      case 'member':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">멤버</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{role}</span>;
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">내 스터디들</h1>
          <p className="text-gray-600 mt-2">내가 참여하고 있는 진행 중인 스터디 목록입니다. (studyStatus: in-process)</p>
        </div>

        {/* 스터디 목록 */}
        {!Array.isArray(studies) || studies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">진행 중인 스터디가 없습니다</h3>
            <p className="text-gray-500">아직 studyStatus가 'in-process'인 스터디에 참여하지 않았습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {Array.isArray(studies) && studies.map((membership) => (
               <div 
                 key={membership.id} 
                 className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => handleStudyClick(membership.post.id)}
               >
                 <div className="p-6">
                   <div className="flex items-center justify-between mb-3">
                     <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{membership.post.title}</h3>
                     <div className="flex items-center space-x-2">
                       {getStatusBadge(membership.post.studyStatus)}
                       {getRoleBadge(membership.role)}
                     </div>
                   </div>
                   
                   <p className="text-gray-600 mb-4 line-clamp-3">{membership.post.content}</p>
                   
                   <div className="space-y-2 text-sm text-gray-500">
                     <div className="flex items-center justify-between">
                       <span>작성자</span>
                       <span className="font-medium">{membership.post.author.name}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span>참여 인원</span>
                       <span className="font-medium">{membership.post.currentNumber}/{membership.post.recruitNumber}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span>참여일</span>
                       <span>{formatDate(membership.joinedAt)}</span>
                     </div>
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-gray-100">
                     <div className="flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition-colors">
                       <span className="text-sm font-medium">스터디 세션 관리</span>
                       <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                     </div>
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

export default MyStudies;
