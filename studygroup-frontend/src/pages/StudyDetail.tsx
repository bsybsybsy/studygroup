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

  const post = postResponse?.data?.data;
  const requestForm = requestFormResponse?.data?.data;
  
  // 내가 지원한 스터디 목록에서 현재 스터디가 있는지 확인
  const myApplications = myApplicationsResponse?.data?.data || [];
  
  // Safety check: ensure myApplications is an array
  const safeMyApplications = Array.isArray(myApplications) ? myApplications : [];
  
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
    post.author?.id !== user.id && // 내가 만든 스터디가 아닌 post
    !hasApplied && // 아직 지원하지 않은 post
    (post.currentNumber || 0) < (post.recruitNumber || 0) && // 인원이 다 차지 않은 post
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
  console.log('Post author ID:', post?.author?.id);
  console.log('User ID:', user?.id);
  console.log('Is not author:', post?.author?.id !== user?.id);
  console.log('Has not applied:', !hasApplied);
  console.log('Current number:', post?.currentNumber);
  console.log('Recruit number:', post?.recruitNumber);
  console.log('Has space:', (post?.currentNumber || 0) < (post?.recruitNumber || 0));
  console.log('Study status:', post?.studyStatus);
  console.log('Is recruiting:', post?.studyStatus === 'recruiting');
  console.log('Final canApply:', canApply);

  if (isLoading) {
    console.log('=== StudyDetail Loading ===');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !post) {
    console.log('=== StudyDetail Error or No Post ===');
    console.log('Error:', error);
    console.log('Post:', post);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">스터디를 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 스터디가 존재하지 않거나 삭제되었습니다.</p>
        </div>
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
              {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
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

        {/* 간단한 지원하기 버튼 */}
        <div className="text-center mb-6">
          {post.author?.id === user?.id ? (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-blue-800 bg-blue-100 border border-blue-200">
              내가 만든 스터디입니다
            </div>
          ) : canApply ? (
            <button
              onClick={() => setShowApplicationForm(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              스터디 지원하기
            </button>
          ) : hasApplied ? (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-green-800 bg-green-100 border border-green-200">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              이미 지원한 스터디입니다
            </div>
          ) : (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-gray-600 bg-gray-100 border border-gray-200">
              지원할 수 없는 스터디입니다
            </div>
          )}
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
            
            {requestForm && requestForm.questions && Array.isArray(requestForm.questions) && requestForm.questions.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    📝 지원 양식을 작성해주세요. 모든 질문에 답변해주시면 됩니다.
                  </p>
                </div>
                
                {requestForm.questions.map((question: any, index: number) => (
                  <div key={question.id || index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {question.questionText}
                      {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.type === 'short_answer' && (
                      <input
                        type="text"
                        value={applicationAnswers[question.id] || ''}
                        onChange={(e) => setApplicationAnswers({
                          ...applicationAnswers,
                          [question.id]: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="답변을 입력해주세요..."
                        required={question.isRequired}
                      />
                    )}
                    
                    {question.type === 'long_answer' && (
                      <textarea
                        value={applicationAnswers[question.id] || ''}
                        onChange={(e) => setApplicationAnswers({
                          ...applicationAnswers,
                          [question.id]: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        rows={4}
                        placeholder="답변을 입력해주세요..."
                        required={question.isRequired}
                      />
                    )}
                    
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center">
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={option}
                              checked={applicationAnswers[question.id] === option}
                              onChange={(e) => setApplicationAnswers({
                                ...applicationAnswers,
                                [question.id]: e.target.value
                              })}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              required={question.isRequired}
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'checkbox' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center">
                            <input
                              type="checkbox"
                              value={option}
                              checked={Array.isArray(applicationAnswers[question.id]) && (applicationAnswers[question.id] as string[]).includes(option)}
                              onChange={(e) => {
                                const currentAnswers = Array.isArray(applicationAnswers[question.id]) ? (applicationAnswers[question.id] as string[]) : [];
                                if (e.target.checked) {
                                  setApplicationAnswers({
                                    ...applicationAnswers,
                                    [question.id]: [...currentAnswers, option]
                                  });
                                } else {
                                  setApplicationAnswers({
                                    ...applicationAnswers,
                                    [question.id]: currentAnswers.filter((ans: string) => ans !== option)
                                  });
                                }
                              }}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
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
                onClick={() => applyMutation.mutate()}
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
