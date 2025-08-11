import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postAPI } from '../services/api';
import { Post, StudyApplication } from '../types';
import { 
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { message } from 'antd';

const StudyApplicants: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<StudyApplication | null>(null);

  const { data: postResponse, isLoading: postLoading } = useQuery(
    ['post', id],
    () => postAPI.getPost(Number(id)),
    { enabled: !!id }
  );

  const { data: applicationsResponse, isLoading: applicationsLoading, error: applicationsError } = useQuery(
    ['applications', id],
    () => postAPI.getStudyApplications(Number(id)),
    { 
      enabled: !!id,
      onError: (error) => {
        console.error('🔍 API 호출 에러:', error);
      }
    }
  );

  const acceptMutation = useMutation(
    (applicationId: number) => postAPI.acceptApplicant(applicationId),
    {
      onSuccess: () => {
        message.success('지원자를 승인했습니다!');
        queryClient.invalidateQueries(['applications', id]);
        queryClient.invalidateQueries(['post', id]);
      },
      onError: (error: any) => {
        message.error(error.response?.data?.message || '승인 중 오류가 발생했습니다.');
      },
    }
  );

  const declineMutation = useMutation(
    (applicationId: number) => postAPI.declineApplicant(applicationId),
    {
      onSuccess: () => {
        message.success('지원을 거절했습니다.');
        queryClient.invalidateQueries(['applications', id]);
      },
      onError: (error: any) => {
        message.error(error.response?.data?.message || '거절 중 오류가 발생했습니다.');
      },
    }
  );

  const post = postResponse?.data?.data;
  
  // NestJS 응답 구조에 맞게 수정 - 다양한 응답 구조 처리
  let applications = [];
  
  // 1. applicationsResponse?.data?.data?.data 구조 (중첩된 data)
  if (applicationsResponse?.data?.data?.data && Array.isArray(applicationsResponse.data.data.data)) {
    applications = applicationsResponse.data.data.data;
  }
  // 2. applicationsResponse?.data?.data 구조 (NestJS 표준)
  else if (applicationsResponse?.data?.data && Array.isArray(applicationsResponse.data.data)) {
    applications = applicationsResponse.data.data;
  }
  // 3. applicationsResponse?.data 구조 (직접 배열)
  else if (applicationsResponse?.data && Array.isArray(applicationsResponse.data)) {
    applications = applicationsResponse.data;
  }
  // 4. applicationsResponse 직접 배열 구조
  else if (Array.isArray(applicationsResponse)) {
    applications = applicationsResponse;
  }
  // 5. 빈 배열로 초기화
  else {
    applications = [];
  }



  // 디버깅 로그 추가
  console.log('🔍 StudyApplicants 디버깅:');
  console.log('🔍 postResponse:', postResponse);
  console.log('🔍 applicationsResponse:', applicationsResponse);
  console.log('🔍 applicationsResponse?.data:', applicationsResponse?.data);
  console.log('🔍 applicationsResponse?.data?.data:', applicationsResponse?.data?.data);
  console.log('🔍 applicationsResponse?.data?.data type:', typeof applicationsResponse?.data?.data);
  console.log('🔍 applicationsResponse?.data?.data isArray:', Array.isArray(applicationsResponse?.data?.data));
  console.log('🔍 applicationsResponse?.data?.data?.data:', applicationsResponse?.data?.data?.data);
  console.log('🔍 applicationsResponse?.data?.data?.data type:', typeof applicationsResponse?.data?.data?.data);
  console.log('🔍 applicationsResponse?.data?.data?.data isArray:', Array.isArray(applicationsResponse?.data?.data?.data));
  console.log('🔍 applications:', applications);
  console.log('🔍 applications.length:', applications.length);
  console.log('🔍 Array.isArray(applications):', Array.isArray(applications));
  
  // 응답 구조 분석
  if (applicationsResponse) {
    console.log('🔍 응답 구조 분석:');
    console.log('🔍 - applicationsResponse keys:', Object.keys(applicationsResponse));
    if (applicationsResponse.data) {
      console.log('🔍 - applicationsResponse.data keys:', Object.keys(applicationsResponse.data));
    }
  }

  // 에러 상태 로깅
  if (applicationsError) {
    console.error('🔍 applicationsError:', applicationsError);
  }

  if (postLoading || applicationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">지원자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">스터디를 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 스터디가 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  const handleAccept = (applicationId: number) => {
    acceptMutation.mutate(applicationId);
  };

  const handleDecline = (applicationId: number) => {
    declineMutation.mutate(applicationId);
  };

  const showApplicationDetail = (application: StudyApplication) => {
    setSelectedApplication(application);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          뒤로가기
        </button>

        {/* 스터디 정보 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{post.title}</h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">{post.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {post.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  모집인원: {post.recruitNumber}명
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  현재인원: {post.currentNumber || 0}명
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 지원자 목록 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">지원자 내역</h2>
                <p className="text-gray-600 mt-1">
                  총 <span className="font-semibold text-indigo-600">{Array.isArray(applications) ? applications.length : 0}명</span>의 지원자가 있습니다.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">승인됨</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full ml-4"></div>
                <span className="text-sm text-gray-600">대기중</span>
              </div>
            </div>
          </div>

          {!Array.isArray(applications) || applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">지원자가 없습니다</h3>
              <p className="text-gray-500">
                아직 이 스터디에 지원한 사람이 없습니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Array.isArray(applications) && applications.map((application: StudyApplication) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-white">
                            {application.applicant.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                          application.isAccepted ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                          {application.isAccepted ? (
                            <CheckIcon className="w-3 h-3 text-white" />
                          ) : (
                            <ClockIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {application.applicant.username}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {format(new Date(application.appliedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                          </span>
                          <span className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            application.isAccepted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.isAccepted ? '승인됨' : '대기중'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => showApplicationDetail(application)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        지원서 보기
                      </button>
                      
                      {!application.isAccepted && (
                        <>
                          <button
                            onClick={() => handleAccept(application.id)}
                            disabled={acceptMutation.isLoading}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            승인
                          </button>
                          <button
                            onClick={() => handleDecline(application.id)}
                            disabled={declineMutation.isLoading}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            <XMarkIcon className="w-4 h-4 mr-2" />
                            거절
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 지원서 상세 모달 */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">지원서 상세</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* 지원자 정보 */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {selectedApplication.applicant.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {selectedApplication.applicant.username}
                        </h3>
                        <p className="text-gray-600">
                          지원일: {format(new Date(selectedApplication.appliedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 지원서 답변 */}
                  {Object.keys(selectedApplication.answers).length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                        <DocumentTextIcon className="w-6 h-6 mr-2 text-indigo-600" />
                        지원서 답변
                      </h4>
                      <div className="space-y-4">
                        {Object.entries(selectedApplication.answers).map(([question, answer], index) => (
                          <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-3 text-lg">{question}</h5>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-gray-700 leading-relaxed">{answer as string}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">별도의 지원서 없이 지원했습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyApplicants;
