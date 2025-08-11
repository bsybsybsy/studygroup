import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { postAPI } from '../services/api';
import { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
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
  const [applicationAnswers, setApplicationAnswers] = useState<{[key: string]: string | string[]}>({});
  const [currentRequestForm, setCurrentRequestForm] = useState<any>(null);
  
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

  const posts = postsResponse?.data?.data || [];
  const myStudies = myStudiesResponse?.data?.data || [];
  const myApplications = myApplicationsResponse?.data?.data || [];

  // Safety check: ensure myApplications is an array
  const safeMyApplications = Array.isArray(myApplications) ? myApplications : [];

  // 지원 가능 여부 판단 함수
  const canApplyToPost = (post: Post) => {
    if (!user || !post) return false;
    
    // 내가 만든 스터디는 지원할 수 없음
    if (post.author?.id === user.id) {
      console.log(`🔒 내가 만든 스터디: ${post.title} - 지원 불가`);
      return false;
    }
    
    // 아직 지원하지 않은 post
    const hasApplied = safeMyApplications.some((application: any) => 
      application.post?.id === post.id
    );
    if (hasApplied) {
      console.log(`✅ 이미 지원한 스터디: ${post.title} - 지원 불가`);
      return false;
    }
    
    // 인원이 다 차지 않은 post
    if ((post.currentNumber || 0) >= post.recruitNumber) {
      console.log(`👥 인원이 다 찬 스터디: ${post.title} - 지원 불가`);
      return false;
    }
    
    // 모집 중인 상태
    if (post.studyStatus !== 'recruiting') {
      console.log(`📋 모집 중이 아닌 스터디: ${post.title} (상태: ${post.studyStatus}) - 지원 불가`);
      return false;
    }
    
    console.log(`✅ 지원 가능한 스터디: ${post.title}`);
    return true;
  };

  // 지원하기 버튼 클릭 시 requestform 가져오기
  const handleShowApplicationForm = async (postId: number) => {
    try {
      const response = await postAPI.getRequestForm(postId);
      if (response.data?.data) {
        setCurrentRequestForm(response.data.data);
      }
      setShowApplicationForm(postId);
    } catch (error) {
      console.log('RequestForm이 없거나 가져오기 실패:', error);
      setCurrentRequestForm(null);
      setShowApplicationForm(postId);
    }
  };

  // 지원하기 mutation
  const applyMutation = useMutation(
    ({ postId, answers }: { postId: number; answers?: any }) => 
      postAPI.applyToStudy(postId, answers),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['myApplications']);
        setShowApplicationForm(null);
        setApplicationAnswers({});
        setCurrentRequestForm(null);
        alert('스터디에 성공적으로 지원했습니다!');
      },
      onError: (error: any) => {
        alert(`지원하기 실패: ${error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'}`);
      },
    }
  );
  
  // 디버깅 로그 추가
  console.log('🔍 postsResponse:', postsResponse);
  console.log('🔍 myStudiesResponse:', myStudiesResponse);
  console.log('🔍 posts 배열:', posts);
  console.log('🔍 myStudies 배열:', myStudies);
  console.log('🔍 myStudies.length:', myStudies.length);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600">스터디 목록을 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">함께 성장하는</span>
              <span className="block text-primary-600">스터디 그룹</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              다양한 분야의 스터디에 참여하고, 함께 학습하며 성장해보세요.
              목표를 향해 나아가는 동료들과 함께라면 더욱 즐겁고 효과적입니다.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/studies"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                >
                  스터디 찾기
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 내가 만든 스터디 섹션 */}
      {(() => {
        console.log('🔍 "내가 만든 스터디" 섹션 렌더링 조건 체크');
        console.log('🔍 조건: true (항상 렌더링)');
        return true;
      })() && (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">내가 만든 스터디</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              내가 운영하는 스터디
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              내가 만든 스터디를 관리하고 지원자를 확인해보세요.
            </p>
            {/* 디버깅 정보 */}
            <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
              <p className="text-sm text-gray-700">
                디버깅: 사용자 {user?.username || '로그인 안됨'}, 내가 만든 스터디 {myStudies.length}개
              </p>
            </div>
          </div>

          <div className="mt-12">
            {(() => {
              console.log('🔍 myStudies.length === 0 조건 체크');
              console.log('🔍 myStudies.length:', myStudies.length);
              console.log('🔍 조건 결과:', myStudies.length === 0);
              return myStudies.length === 0;
            })() ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 만든 스터디가 없습니다</h3>
                <p className="text-gray-500 mb-6">
                  첫 번째 스터디를 만들어보세요!
                </p>

                

              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(myStudies) && myStudies.map((post: Post) => {
                  console.log('🔍 개별 스터디 카드 렌더링:', post);
                  return (
                    <div key={post.id} className="card hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(post.createdAt), 'MM/dd', { locale: ko })}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <UserGroupIcon className="w-4 h-4 mr-2" />
                          <span>모집인원: {post.recruitNumber}명</span>
                        </div>
                        
                        {post.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPinIcon className="w-4 h-4 mr-2" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        
                        {post.studyStartDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <span>
                              {format(new Date(post.studyStartDate), 'yyyy년 MM월 dd일', { locale: ko })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {post.author.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="ml-2 text-sm text-gray-700">{post.author.username}</span>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="mt-4 flex space-x-2">
                        {(() => {
                          console.log('🔍 액션 버튼들 렌더링 시작');
                          console.log('🔍 post.id:', post.id);
                          return null;
                        })()}
                        <Link
                          to={`/studies/${post.id}`}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          상세보기
                        </Link>
                        <Link
                          to={`/studies/${post.id}/edit`}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          수정
                        </Link>
                        <Link
                          to={`/studies/${post.id}/applicants`}
                          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                          onClick={() => console.log('🔍 지원자 내역 버튼 클릭됨!')}
                        >
                          <UsersIcon className="w-4 h-4 mr-1" />
                          지원자 내역
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 최근 스터디 섹션 */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">최근 스터디</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            새로 시작하는 스터디
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            다양한 분야의 새로운 스터디들이 기다리고 있습니다.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(posts) && posts.slice(0, 6).map((post: Post) => (
              <div key={post.id} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(post.createdAt), 'MM/dd', { locale: ko })}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    <span>모집인원: {post.recruitNumber}명</span>
                  </div>
                  
                  {post.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      <span>{post.location}</span>
                    </div>
                  )}
                  
                  {post.studyStartDate && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span>
                        {format(new Date(post.studyStartDate), 'yyyy년 MM월 dd일', { locale: ko })}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {post.author.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-2 text-sm text-gray-700">{post.author.username}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {post.author?.id === user?.id ? (
                      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                        내가 만든 스터디
                      </span>
                    ) : canApplyToPost(post) ? (
                      <button
                        onClick={() => handleShowApplicationForm(post.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        지원하기
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-md">
                        지원 불가
                      </span>
                    )}
                    
                    <Link
                      to={`/studies/${post.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      자세히 보기
                      <ArrowRightIcon className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {Array.isArray(posts) && posts.length > 6 && (
            <div className="mt-12 text-center">
              <Link
                to="/studies"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100"
              >
                모든 스터디 보기
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 통계 섹션 */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base font-semibold text-primary-200 tracking-wide uppercase">통계</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              StudyGroup과 함께하는 사용자들
            </p>
          </div>
          
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white">{posts.length}</div>
                <div className="mt-2 text-xl text-primary-200">활성 스터디</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white">100+</div>
                <div className="mt-2 text-xl text-primary-200">참여 사용자</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white">50+</div>
                <div className="mt-2 text-xl text-primary-200">완료된 스터디</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 지원하기 폼 모달 */}
      {showApplicationForm && (() => {
        const post = Array.isArray(posts) ? posts.find(p => p.id === showApplicationForm) : null;
        return post && post.author?.id !== user?.id;
      })() && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">스터디 지원하기</h3>
              
              {(() => {
                const post = Array.isArray(posts) ? posts.find(p => p.id === showApplicationForm) : null;
                if (!post) return null;
                
                return (
                  <>
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">{post.title}</h4>
                      <p className="text-sm text-gray-600">{post.description}</p>
                    </div>
                    
                    {currentRequestForm && currentRequestForm.questions && Array.isArray(currentRequestForm.questions) && currentRequestForm.questions.length > 0 ? (
                      <div className="mb-4">
                        {currentRequestForm.questions.map((question: any, index: number) => (
                          <div key={question.id || index}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="답변을 입력해주세요"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={3}
                                placeholder="답변을 입력해주세요"
                                required={question.isRequired}
                              />
                            )}
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="space-y-1">
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
                                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300"
                                      required={question.isRequired}
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'checkbox' && question.options && (
                              <div className="space-y-1">
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
                                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">
                        지원 양식이 없습니다. 바로 지원할 수 있습니다.
                      </p>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowApplicationForm(null);
                          setApplicationAnswers({});
                          setCurrentRequestForm(null);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => applyMutation.mutate({ 
                          postId: showApplicationForm, 
                          answers: Object.keys(applicationAnswers).length > 0 ? applicationAnswers : undefined 
                        })}
                        disabled={applyMutation.isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyMutation.isLoading ? '지원 중...' : '지원하기'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 