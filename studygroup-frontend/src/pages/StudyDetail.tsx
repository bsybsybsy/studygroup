import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postAPI } from '../services/api';
import { 
  UserGroupIcon, 
  MapPinIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { getSafeApplicationFormTemplate } from '../utils/dataTransform';

// Safe date formatting function
const safeFormatDate = (dateValue: any, formatString: string, options?: any) => {
  if (!dateValue) return '날짜 없음';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '날짜 없음';
    return format(date, formatString, options);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '날짜 없음';
  }
};

const StudyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationAnswers, setApplicationAnswers] = useState<{[key: string]: string | string[]}>({});

  console.log('=== StudyDetail Component Mounted ===');
  console.log('ID:', id);
  console.log('User:', user);

  const { data: postResponse, isLoading, error } = useQuery(
    ['post', id],
    () => postAPI.getPost(Number(id)),
    {
      enabled: !!id,
    }
  );

  // 내가 지원한 스터디 목록 가져오기
  const { data: myApplicationsResponse } = useQuery(
    ['myApplications'],
    () => postAPI.getMyApplications(),
    {
      enabled: !!user,
    }
  );

  // 지원 양식 가져오기
  const { data: requestFormResponse } = useQuery(
    ['requestForm', id],
    () => postAPI.getRequestForm(Number(id)),
    {
      enabled: !!id,
    }
  );

  // 지원하기 mutation
  const applyMutation = useMutation(
    () => postAPI.applyToStudy(Number(id), applicationAnswers),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['myApplications']);
        setShowApplicationForm(false);
        setApplicationAnswers({});
        alert('스터디에 성공적으로 지원했습니다!');
      },
      onError: (error: any) => {
        alert(`지원하기 실패: ${error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'}`);
      },
    }
  );

  // 임시로 post 객체 완전 차단
  // const post = postResponse?.data?.data;
  const post = postResponse?.data?.data || {} as any;
  const requestForm = requestFormResponse?.data?.data;
  
  // 내가 지원한 스터디 목록에서 현재 스터디가 있는지 확인
  const myApplications = myApplicationsResponse?.data?.data || [];
  
  // Safety check: ensure myApplications is an array
  const safeMyApplications = Array.isArray(myApplications) ? myApplications : [];
  
  console.log('🔍 myApplicationsResponse 구조:', myApplicationsResponse);
  console.log('🔍 myApplicationsResponse.data:', myApplicationsResponse?.data);
  console.log('🔍 myApplicationsResponse.data.data:', myApplicationsResponse?.data?.data);
  console.log('🔍 myApplications:', myApplications);
  console.log('🔍 safeMyApplications:', safeMyApplications);
  
  console.log('=== StudyDetail myApplications Debug ===');
  console.log('myApplicationsResponse:', myApplicationsResponse);
  console.log('myApplicationsResponse?.data:', myApplicationsResponse?.data);
  console.log('myApplications:', myApplications);
  console.log('safeMyApplications:', safeMyApplications);
  console.log('Is Array:', Array.isArray(myApplications));
  
  const hasApplied = safeMyApplications.some((application: any) => 
    application.post?.id === Number(id)
  );

  // 지원 가능 여부 판단
  const canApply = user && 
    post && 
    post.id && // post가 실제로 존재하는지 확인
    post.author && 
    post.author.id !== user.id && // 내가 만든 스터디가 아닌 post
    !hasApplied && // 아직 지원하지 않은 post
    typeof post.currentNumber === 'number' && 
    typeof post.recruitNumber === 'number' &&
    post.currentNumber < post.recruitNumber && // 인원이 다 차지 않은 post
    (!post.studyStatus || post.studyStatus === 'recruiting'); // studyStatus가 없거나 모집 중인 상태
  
  console.log('=== StudyDetail Component ===');
  console.log('Post data:', post);
  console.log('Is loading:', isLoading);
  console.log('Has error:', !!error);
  console.log('Post exists:', !!post);
  console.log('My applications:', myApplications);
  console.log('Has applied:', hasApplied);
  console.log('=== 지원 가능 여부 디버깅 ===');
  console.log('User:', user);
  console.log('Post ID:', post?.id);
  console.log('Post author ID:', post?.author?.id);
  console.log('User ID:', user?.id);
  console.log('Is not author:', post?.author?.id !== user?.id);
  console.log('Has not applied:', !hasApplied);
  console.log('Current number:', post?.currentNumber, 'Type:', typeof post?.currentNumber);
  console.log('Recruit number:', post?.recruitNumber, 'Type:', typeof post?.recruitNumber);
  console.log('Has space:', typeof post?.currentNumber === 'number' && typeof post?.recruitNumber === 'number' && post?.currentNumber < post?.recruitNumber);
  console.log('Study status:', post?.studyStatus);
  console.log('Is recruiting:', post?.studyStatus === 'recruiting');
  console.log('Final canApply:', canApply);
  console.log('=== 전체 post 객체 구조 ===');
  console.log('Post object:', JSON.stringify(post, null, 2));
  // applicationFormTemplate 안전하게 가져오기
  const safeApplicationFormTemplate = getSafeApplicationFormTemplate(post);
  console.log('🔍 applicationFormTemplate:', safeApplicationFormTemplate);

  if (isLoading) {
    console.log('=== StudyDetail Loading ===');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 간단한 테스트 메시지 */}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>테스트 메시지:</strong> 이 텍스트가 보이면 컴포넌트는 정상 작동합니다.
        </div>

        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          뒤로가기
        </button>

        {/* 스터디 상세 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">
              {/* 날짜 표시 임시 제거 - 오류 해결 후 복원 예정 */}
              스터디 정보
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center text-gray-600 mb-4">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            <span>{post.currentNumber}/{post.recruitNumber}명</span>
          </div>

          {post.location && (
            <div className="flex items-center text-gray-600 mb-4">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{post.location}</span>
            </div>
          )}

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{post.description}</p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {/* 스터디 시작/들어가기 버튼 (작성자만) */}
          {post.author?.id === user?.id && (
            <button
              onClick={() => navigate(`/studies/${post.id}/sessions`)}
              className={`inline-flex items-center px-6 py-3 text-base font-medium rounded-md transition-colors ${
                post.studyStatus === 'in-process' || 
                (post.members && post.members.some((member: any) => member.studystatus === 'ongoing'))
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' // 스터디 진행중일 때 파란색
                  : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500' // 스터디 시작 전일 때 초록색
              }`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {post.studyStatus === 'in-process' || 
               (post.members && post.members.some((member: any) => member.studystatus === 'ongoing'))
                ? '스터디 들어가기' // 스터디 진행중일 때
                : '스터디 시작' // 스터디 시작 전일 때
              }
            </button>
          )}

          {/* 지원하기 버튼 */}
          {post.author?.id !== user?.id && canApply ? (
            <button
              onClick={() => setShowApplicationForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              스터디 지원하기
            </button>
          ) : post.author?.id !== user?.id && hasApplied ? (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-green-800 bg-green-100 border border-green-200">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              이미 지원한 스터디입니다
            </div>
          ) : post.author?.id !== user?.id ? (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-gray-600 bg-gray-100 border border-gray-200">
              지원할 수 없는 스터디입니다
            </div>
          ) : null}

          {/* 작성자 표시 */}
          {post.author?.id === user?.id && (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-blue-800 bg-blue-100 border border-blue-200">
              내가 만든 스터디입니다
            </div>
          )}
        </div>

        {/* 추가 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 상세보기 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              상세보기
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>카테고리:</span>
                <span className="font-medium">{post.category}</span>
              </div>
              <div className="flex justify-between">
                <span>모드:</span>
                <span className="font-medium">{post.mode}</span>
              </div>
              <div className="flex justify-between">
                <span>상태:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  post.studyStatus === 'recruiting' ? 'bg-blue-100 text-blue-800' :
                  post.studyStatus === 'in-process' ? 'bg-yellow-100 text-yellow-800' :
                  post.studyStatus === 'in-process' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.studyStatus === 'recruiting' ? '모집중' :
                   post.studyStatus === 'in-process' ? '모집완료' :
                   post.studyStatus === 'in-process' ? '진행중' :
                   post.studyStatus === 'over' ? '종료' : post.studyStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>작성일:</span>
                <span className="font-medium">
                  {safeFormatDate(post.createdAt, 'MM/dd', { locale: ko })}
                </span>
              </div>
            </div>
          </div>

          {/* 지원자 내역 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              지원자 내역
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>현재 인원:</span>
                <span className="font-medium">{post.currentNumber}명</span>
              </div>
              <div className="flex justify-between">
                <span>모집 인원:</span>
                <span className="font-medium">{post.recruitNumber}명</span>
              </div>
              <div className="flex justify-between">
                <span>남은 자리:</span>
                <span className="font-medium">{post.recruitNumber - (post.currentNumber || 0)}명</span>
              </div>
              <div className="flex justify-between">
                <span>진행률:</span>
                <span className="font-medium">{Math.round(((post.currentNumber || 0) / post.recruitNumber) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* 스터디 시작 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              스터디 시작
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>상태:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  post.studyStatus === 'recruiting' ? 'bg-blue-100 text-blue-800' :
                  post.studyStatus === 'in-process' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.studyStatus === 'recruiting' ? '모집중' :
                   post.studyStatus === 'in-process' ? '모집완료' :
                   post.studyStatus === 'over' ? '종료' : post.studyStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>조건:</span>
                <span className="font-medium">
                  {post.currentNumber === post.recruitNumber ? '✅ 모집 완료' : '⏳ 모집 중'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>권한:</span>
                <span className="font-medium">
                  {post.author?.id === user?.id ? '✅ 작성자' : '❌ 작성자만'}
                </span>
              </div>
              {post.author?.id === user?.id && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/studies/${post.id}/sessions`)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    세션 관리하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* 지원하기 폼 */}
        {showApplicationForm && post.author?.id !== user?.id && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">스터디 지원하기</h3>
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setApplicationAnswers({});
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 지원 양식 렌더링 */}
            {safeApplicationFormTemplate && safeApplicationFormTemplate.length > 0 ? (
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-medium text-gray-900">지원 질문</h4>
                {safeApplicationFormTemplate.map((question: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {question.content || `질문 ${index + 1}`}
                    </label>
                    <textarea
                      value={applicationAnswers[index] || ''}
                      onChange={(e) => setApplicationAnswers(prev => ({
                        ...prev,
                        [index]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="답변을 입력해주세요"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">
                  ✅ 지원 양식이 없습니다. 바로 지원할 수 있습니다.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setApplicationAnswers({});
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // 답변이 있는 경우에만 지원 가능
                  if (safeApplicationFormTemplate && safeApplicationFormTemplate.length > 0) {
                    const hasAnswers = safeApplicationFormTemplate.every((_: any, index: number) => 
                      applicationAnswers[index] && applicationAnswers[index].trim() !== ''
                    );
                    
                    if (!hasAnswers) {
                      alert('모든 질문에 답변해주세요.');
                      return;
                    }
                  }
                  
                  applyMutation.mutate({
                    postId: post.id,
                    answers: applicationAnswers
                  });
                }}
                disabled={applyMutation.isLoading}
                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {applyMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    지원 중...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    지원하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyDetail;
