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

const MyCreatedStudies: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studies, setStudies] = useState<StudyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyCreatedStudies();
    }
  }, [user]);

  const fetchMyCreatedStudies = async () => {
    try {
      const response = await postAPI.getMyStudies();
      console.log('🔍 fetchMyCreatedStudies - response:', response);
      console.log('🔍 fetchMyCreatedStudies - response.data:', response.data);
      console.log('🔍 fetchMyCreatedStudies - response.data.data:', response.data?.data);
      console.log('🔍 fetchMyCreatedStudies - current user id:', user?.id);
      
      let studiesData = [];
      
      // API 응답 구조를 정확히 파악
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        // response.data.data.data 구조
        studiesData = response.data.data.data;
        console.log('🔍 Using response.data.data.data structure');
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // response.data.data 구조
        studiesData = response.data.data;
        console.log('🔍 Using response.data.data structure');
      } else if (response.data && Array.isArray(response.data)) {
        // response.data 구조
        studiesData = response.data;
        console.log('🔍 Using response.data structure');
      } else if (Array.isArray(response)) {
        // response 자체가 배열
        studiesData = response;
        console.log('🔍 Using response directly');
      }
      
      console.log('🔍 fetchMyCreatedStudies - studiesData (before filtering):', studiesData);
      
      // 프론트엔드에서도 한 번 더 필터링: post.author.id가 현재 사용자의 id인 것만
      const filteredStudies = studiesData.filter(study => {
        const isMyStudy = study.author?.id === user?.id;
        console.log(`🔍 Study ${study.id}: author.id=${study.author?.id}, user.id=${user?.id}, isMyStudy=${isMyStudy}`);
        return isMyStudy;
      });
      
      console.log('🔍 fetchMyCreatedStudies - filteredStudies (after filtering):', filteredStudies);
      
      // post id 45가 포함되어 있는지 확인
      const hasPost45 = filteredStudies.some(study => study.id === 45);
      console.log('🔍 fetchMyCreatedStudies - hasPost45:', hasPost45);
      
      if (hasPost45) {
        const post45Study = filteredStudies.find(study => study.id === 45);
        console.log('🔍 fetchMyCreatedStudies - post45Study:', post45Study);
      }
      
      setStudies(filteredStudies);
    } catch (error) {
      console.error('Failed to fetch my created studies:', error);
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
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">모집완료</span>;
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
    navigate(`/studies/${studyId}`);
  };

  const handleManageApplications = (studyId: number) => {
    navigate(`/studies/${studyId}/applicants`);
  };

  const handleStartStudy = async (studyId: number) => {
    try {
      console.log(`🚀 Starting study ${studyId}...`);
      console.log(`🔍 Current user:`, user);
      console.log(`🔍 Study ID: ${studyId}`);
      
      const response = await postAPI.startStudy(studyId);
      console.log('스터디 시작 성공:', response.data);
      console.log('스터디 시작 응답 전체:', response);
      
      // 성공 시 데이터 새로고침
      console.log('🔄 Refreshing data...');
      await fetchMyCreatedStudies();
      
      // 성공 메시지 표시
      alert('스터디가 시작되었습니다! 멤버들에게 초대장이 전송되었습니다.');
      
      // 스터디 세션 관리 페이지로 이동
      console.log(`📍 Navigating to study sessions: /studies/${studyId}/sessions`);
      navigate(`/studies/${studyId}/sessions`);
    } catch (error) {
      console.error('스터디 시작 실패:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('스터디 시작에 실패했습니다.');
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
          <h1 className="text-3xl font-bold text-gray-900">내가 만든 스터디</h1>
          <p className="text-gray-600 mt-2">내가 작성한 스터디 모집글들을 관리할 수 있습니다.</p>
        </div>

        {/* 스터디 목록 */}
        {!Array.isArray(studies) || studies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 만든 스터디가 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 스터디를 만들어보세요!</p>
            <div className="space-x-3">
              <button
                onClick={() => navigate("/create-study")}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
              >
                스터디 만들기
              </button>
              <button
                onClick={() => navigate("/studies")}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors"
              >
                다른 스터디 둘러보기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(studies) && studies.map((study) => (
              <div 
                key={study.id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{study.title}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(study.studyStatus)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{study.content}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>참여 인원</span>
                      <span className="font-medium">{study.currentNumber}/{study.recruitNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>생성일</span>
                      <span>{formatDate(study.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => handleStudyClick(study.id)}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      스터디 상세보기
                    </button>
                    
                    <button
                      onClick={() => handleManageApplications(study.id)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      지원자 관리
                    </button>
                    
                    {study.studyStatus === 'in-process' && (
                      <button
                        onClick={() => handleStartStudy(study.id)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        스터디 시작
                      </button>
                    )}
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

export default MyCreatedStudies;
