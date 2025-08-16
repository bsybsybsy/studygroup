import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../services/api';
import { SessionGoals, Post, StudyMember } from '../types';

interface StudySession {
  id: number;
  title: string;
  content: string;
  scheduledDate?: string;
  startHour?: string;
  duration: number;
  status: string;
  sessionNumber: number;
}





const StudySessions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  
  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    console.log('🔍 StudySessions 컴포넌트 마운트됨');
    console.log('🔍 현재 postId:', postId);
    console.log('🔍 현재 URL:', window.location.href);
    console.log('🔍 현재 사용자:', user);
    
    return () => {
      console.log('🔍 StudySessions 컴포넌트 언마운트됨');
    };
  }, [postId, user]);
  const [post, setPost] = useState<Post | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [invitesSent, setInvitesSent] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    scheduledDate: '',
    startHour: '',
    duration: 60,
    status: 'scheduled'
  });

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editingSessionForGoals, setEditingSessionForGoals] = useState<StudySession | null>(null);
  const [goalsData, setGoalsData] = useState({
    goalofToday: '',
    proofofToday: [] as {
      type: 'text' | 'link' | 'image' | 'file';
      content: string;
      url?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }[]
  });
  const [updatingGoals, setUpdatingGoals] = useState(false);
  const [sessionGoals, setSessionGoals] = useState<SessionGoals[]>([]);
  const [showGoalsTable, setShowGoalsTable] = useState(false);
  const [selectedSessionForGoals, setSelectedSessionForGoals] = useState<StudySession | null>(null);
  
  // 새로운 한일 추가를 위한 상태
  const [newProofType, setNewProofType] = useState<'text' | 'link' | 'image' | 'file'>('text');
  const [newProofContent, setNewProofContent] = useState('');
  const [newProofUrl, setNewProofUrl] = useState('');
  const [newProofFileName, setNewProofFileName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // 출석 상태 관리를 위한 state 추가
  const [attendanceStatus, setAttendanceStatus] = useState<{[sessionId: number]: boolean}>({});

  // selectedFiles 상태 변화 추적
  useEffect(() => {
    console.log('🔥 selectedFiles 상태 변화:', selectedFiles);
  }, [selectedFiles]);

  // 파일 다운로드 함수
  const handleFileDownload = async (fileItem: any) => {
    try {
      if (fileItem.type === 'file') {
        // serverFileName이 있으면 사용
        if (fileItem.serverFileName) {
          const response = await fetch(`/api/upload/files/${fileItem.serverFileName}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileItem.fileName || fileItem.serverFileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else {
            alert('파일 다운로드에 실패했습니다.');
          }
        } else if (fileItem.url && !fileItem.url.startsWith('blob:')) {
          // blob URL이 아닌 경우 직접 다운로드
          const a = document.createElement('a');
          a.href = fileItem.url;
          a.download = fileItem.fileName || '파일';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert('이 파일은 다운로드할 수 없습니다. 파일이 서버에 제대로 업로드되지 않았습니다.');
        }
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 새로운 한일 추가 함수
  const addNewProof = () => {
    if (!newProofContent.trim()) return;
    
    // 파일 타입인 경우 파일이 선택되었는지 확인
    if (newProofType === 'file' && selectedFiles.length === 0) {
      alert('파일을 선택해주세요.');
      return;
    }
    
    const newProof = {
      type: newProofType,
      content: newProofContent,
      url: newProofUrl,
      fileName: newProofFileName,
      fileSize: selectedFiles[0]?.size,
      mimeType: selectedFiles[0]?.type,
    };
    
    console.log('🔍 addNewProof - newProof:', newProof);
    console.log('🔍 addNewProof - selectedFiles:', selectedFiles);
    console.log('🔍 addNewProof - selectedFiles.length:', selectedFiles.length);
    console.log('🔍 addNewProof - newProofUrl:', newProofUrl);
    console.log('🔍 addNewProof - newProofFileName:', newProofFileName);
    
    setGoalsData({
      ...goalsData,
      proofofToday: [...goalsData.proofofToday, newProof]
    });
    
    // 입력 필드 초기화 (파일은 유지)
    setNewProofContent('');
    setNewProofUrl('');
    setNewProofFileName('');
    // setSelectedFiles([]); // 파일은 유지하여 나중에 업로드할 수 있도록
    setNewProofType('text');
  };

  // FCM 토큰 등록 함수
  const registerFCMToken = async (token: string) => {
    try {
      const response = await fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      if (response.ok) {
        console.log('🔥 FCM 토큰 등록 성공');
      } else {
        console.error('🔥 FCM 토큰 등록 실패:', response.status);
      }
    } catch (error) {
      console.error('🔥 FCM 토큰 등록 오류:', error);
    }
  };

  // FCM 초기화 및 토큰 등록 (fcm-test 방식 사용)
  const initializeFCM = async () => {
    console.log('🔥 initializeFCM 함수 시작');
    
    try {
      // Firebase 앱이 이미 초기화되었는지 확인
      console.log('🔥 브라우저 지원 확인 - serviceWorker:', 'serviceWorker' in navigator, 'PushManager:', 'PushManager' in window);
      
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('🔥 브라우저 지원됨, 서비스 워커 등록 시작');
        
        // 서비스 워커 등록
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('🔥 서비스 워커 등록 성공:', registration);

        // 알림 권한 요청
        console.log('🔥 알림 권한 요청 시작');
        const permission = await Notification.requestPermission();
        console.log('🔥 알림 권한 결과:', permission);
        
        if (permission === 'granted') {
          console.log('🔥 알림 권한 허용됨');
          
          // fcm-test 방식으로 FCM 토큰 가져오기
          try {
            console.log('🔥 Firebase 모듈 import 시작');
            const { getFCMToken } = await import('../firebase');
            console.log('🔥 Firebase 모듈 import 성공');
            
            console.log('🔥 FCM 토큰 가져오기 시작');
            const token = await getFCMToken();
            console.log('🔥 FCM 토큰 가져오기 결과:', token ? '성공' : '실패');
            
            if (token) {
              console.log('🔥 FCM 토큰 획득:', token);
              await registerFCMToken(token);
            } else {
              console.log('🔥 FCM 토큰을 가져올 수 없습니다.');
            }
          } catch (firebaseError) {
            console.error('🔥 Firebase 모듈 로드 오류:', firebaseError);
          }
        } else if (permission === 'denied') {
          console.log('🔥 알림 권한이 차단되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
          console.log('🔥 Chrome/Edge: URL 옆 🔒 아이콘 → 알림 허용');
          console.log('🔥 또는 브라우저 설정 → 사이트 설정 → 알림 → 권한 초기화');
          
          // 사용자에게 안내 메시지 표시 (선택사항)
          if (typeof window !== 'undefined' && window.alert) {
            alert('알림 권한이 차단되었습니다.\n\n브라우저에서 다음을 확인해주세요:\n1. URL 옆 🔒 아이콘 클릭\n2. "알림" 권한을 "허용"으로 변경\n3. 페이지 새로고침');
          }
        } else {
          console.log('🔥 알림 권한 거부됨 (default)');
        }
      } else {
        console.log('🔥 브라우저가 Service Worker 또는 PushManager를 지원하지 않음');
      }
    } catch (error) {
      console.error('🔥 FCM 초기화 오류:', error);
    }
    
    console.log('🔥 initializeFCM 함수 종료');
  };

  useEffect(() => {
    console.log('🔍 useEffect 실행됨 - user:', user, 'postId:', postId);
    
    if (user && postId) {
      console.log('🔍 사용자와 postId가 있음, FCM 초기화 시작');
      fetchPostDetails();
      fetchSessions();
      
      // FCM 초기화
      console.log('🔍 initializeFCM() 호출 시작');
      initializeFCM();
      console.log('🔍 initializeFCM() 호출 완료');
      
      // URL에서 스터디 시작 여부 확인
      const urlParams = new URLSearchParams(window.location.search);
      const justStarted = urlParams.get('started');
      if (justStarted === 'true') {
        // 첫 번째 시작일 때만 환영 메시지 표시
        const hasStartedBefore = localStorage.getItem(`study_${postId}_started`);
        if (!hasStartedBefore) {
          setShowWelcomeMessage(true);
          localStorage.setItem(`study_${postId}_started`, 'true');
        }
        // URL에서 started 파라미터 제거
        window.history.replaceState({}, window.location.pathname);
      }
    } else {
      console.log('🔍 사용자 또는 postId가 없음 - user:', !!user, 'postId:', !!postId);
    }
  }, [user, postId]);

  // 세션 데이터가 로드된 후 기존 출석 상태 확인
  useEffect(() => {
    if (sessions.length > 0 && user) {
      checkExistingAttendance();
    }
  }, [sessions, user]);

  // 현재 사용자의 스터디 역할 확인
  const getUserRole = () => {
    if (!post || !user) return null;
    
    const membership = post.studyMembers?.find(member => member.user && typeof member.user.id === 'number' && user && typeof user.id === 'number' && member.user.id === user.id);
    return membership?.role || null;
  };

  // 사용자가 Leader인지 확인
  const isUserLeader = () => {
    const role = getUserRole();
    return role && typeof role === 'string' && role === 'LEADER';
  };

  // 기존 출석 상태를 확인하는 함수
  const checkExistingAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      console.log('🔍 오늘 날짜:', today);
      
      // 각 세션에 대해 오늘 출석 여부 확인
      const attendancePromises = sessions.map(async (session) => {
        try {
          // 출석 API를 통해 오늘 출석 여부 확인 (백엔드에서 처리)
          const response = await postAPI.getAttendanceStatus(typeof session.id === 'number' ? session.id : 0);
          const isAttended = response.data?.data?.isPresent || false;
          
          console.log(`🔍 세션 ${typeof session.id === 'number' ? session.id : 'unknown'} 출석 상태:`, isAttended);
          
          return { sessionId: typeof session.id === 'number' ? session.id : 0, isAttended };
        } catch (error) {
          console.log(`🔍 세션 ${typeof session.id === 'number' ? session.id : 'unknown'} 출석 상태 확인 실패:`, error);
                      return { sessionId: typeof session.id === 'number' ? session.id : 0, isAttended: false };
        }
      });
      
      const attendanceResults = await Promise.all(attendancePromises);
      
      // 출석 상태 업데이트
      const newAttendanceStatus: {[sessionId: number]: boolean} = {};
      attendanceResults.forEach(({ sessionId, isAttended }) => {
        newAttendanceStatus[sessionId] = isAttended;
      });
      
      setAttendanceStatus(newAttendanceStatus);
      console.log('🔍 전체 출석 상태:', newAttendanceStatus);
      
    } catch (error) {
      console.error('🔍 출석 상태 확인 실패:', error);
    }
  };

  const fetchPostDetails = async () => {
    try {
      const response = await postAPI.getPost(Number(postId));
      const postData = response.data?.data || response.data;
      console.log('🔍 fetchPostDetails - postData:', postData);
      console.log('🔍 fetchPostDetails - studyStatus:', postData?.studyStatus);
      console.log('🔍 fetchPostDetails - studyMembers:', postData?.studyMembers);
      
      setPost(postData);
      
             // 초대장 전송 상태 확인 (로컬 스토리지에서)
       if ((postData?.studyStatus === 'in-process') && 
           (postData?.studyMembers && postData.studyMembers.length > 0)) {
         const invitesSentKey = `study_${postId}_invites_sent`;
         const hasInvitesSent = localStorage.getItem(invitesSentKey);
         if (hasInvitesSent) {
           setInvitesSent(true);
         }
       }
    } catch (error) {
      console.error('Failed to fetch post details:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await postAPI.getStudySessions(Number(postId));
      const sessionsData = response.data?.data || response.data || [];
      setSessions(sessionsData);
      
      // 기존 세션들에 알람 설정
      sessionsData.forEach(session => {
        setStudyAlarm(session);
      });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

     const sendInvitesToMembers = async () => {
     console.log('🔍 sendInvitesToMembers - post:', post);
     console.log('🔍 sendInvitesToMembers - post.studyMembers:', post?.studyMembers);
     
     // studyMembers에서 직접 필터링
     let availableMembers = post?.studyMembers;
     if (!availableMembers || availableMembers.length === 0) {
       console.log('🔍 sendInvitesToMembers - studyMembers가 비어있음');
       alert('멤버 정보를 가져올 수 없습니다.');
       return;
     }
     
     if (availableMembers.length === 0) {
       console.log('🔍 sendInvitesToMembers - 사용 가능한 멤버가 없음');
       alert('멤버 정보를 가져올 수 없습니다.');
       return;
     }

     const memberRoleMembers = availableMembers.filter((member: StudyMember) => member.role && typeof member.role === 'string' && member.role === 'member');
     console.log('🔍 sendInvitesToMembers - memberRoleMembers:', memberRoleMembers);
     
     if (memberRoleMembers.length === 0) {
       console.log('🔍 sendInvitesToMembers - member 역할을 가진 멤버가 없음');
       alert('초대할 멤버가 없습니다.');
       return;
     }

    setSendingInvites(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const member of memberRoleMembers) {
        try {
          await postAPI.createInvite(Number(postId), member.user && typeof member.user.id === 'number' ? member.user.id : 0);
          successCount++;
        } catch (error) {
          console.error(`Failed to send invite to ${member.user && typeof member.user.username === 'string' ? member.user.username : 'Unknown User'}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        setInvitesSent(true);
        // 로컬 스토리지에 초대장 전송 완료 상태 저장
        localStorage.setItem(`study_${postId}_invites_sent`, 'true');
        alert(`초대장을 ${successCount}명에게 전송했습니다.${failCount > 0 ? ` (${failCount}명 실패)` : ''}`);
      } else {
        alert('초대장 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send invites:', error);
      alert('초대장 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingInvites(false);
    }
  };

  const handleCreateSession = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      console.log('🔍 세션 생성 시작');
      console.log('🔍 postId:', postId);
      console.log('🔍 formData:', formData);
      console.log('🔍 전송할 데이터:', {
        title: formData.title,
        content: formData.content,
        scheduledDate: formData.scheduledDate,
        startHour: formData.startHour,
        duration: formData.duration
      });
      
      // sessionNumber는 백엔드에서 자동으로 계산
      const result = await postAPI.createStudySession(Number(postId), {
        title: formData.title,
        content: formData.content,
        scheduledDate: formData.scheduledDate,
        startHour: formData.startHour,
        duration: formData.duration
      });
      
      console.log('🔍 세션 생성 성공:', result);
      
      // 새로 생성된 세션에 알람 설정
      if (result.data?.data) {
        setStudyAlarm(result.data.data);
      }
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        scheduledDate: '',
        startHour: '',
        duration: 60,
        status: 'scheduled'
      });
      fetchSessions();
      alert('스터디 세션이 생성되었습니다!');
    } catch (error) {
      console.error('Failed to create session:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      alert('세션 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSession = async (sessionId: number) => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      const result = await postAPI.updateStudySession(sessionId, {
        title: formData.title,
        content: formData.content,
        scheduledDate: formData.scheduledDate,
        startHour: formData.startHour,
        duration: formData.duration
      });
      
      // 수정된 세션에 알람 재설정
      if (result.data?.data) {
        setStudyAlarm(result.data.data);
      }
      
      setEditingSession(null);
      setFormData({
        title: '',
        content: '',
        scheduledDate: '',
        startHour: '',
        duration: 60,
        status: 'scheduled'
      });
      fetchSessions();
      alert('스터디 세션이 수정되었습니다!');
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('세션 수정에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('정말로 이 세션을 삭제하시겠습니까?')) return;

    try {
      await postAPI.deleteStudySession(sessionId);
      fetchSessions();
      alert('세션이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('세션 삭제에 실패했습니다.');
    }
  };

  const handleOpenGoalsModal = (session: StudySession) => {
    setEditingSessionForGoals(session);
    setGoalsData({
      goalofToday: '',
      proofofToday: []
    });
    setShowGoalsModal(true);
  };

  const handleEditGoal = (goal: SessionGoals) => {
    try {
      console.log('🔍 handleEditGoal 호출됨:', goal);
      console.log('🔍 현재 사용자:', user);
      console.log('🔍 현재 URL:', window.location.href);
      console.log('🔍 현재 postId:', postId);
      
      // 현재 사용자가 해당 목표의 작성자인지 확인
      if (goal.user.id !== user?.id) {
        alert('자신이 작성한 목표만 수정할 수 있습니다.');
        return;
      }
      
      console.log('🔍 권한 확인 통과');
      
      // 목표 데이터 설정
      const newGoalsData = {
        goalofToday: goal.goalofToday || '',
        proofofToday: goal.proofofToday || []
      };
      
      console.log('🔍 설정할 목표 데이터:', newGoalsData);
      
      // 상태 변경 전 확인
      console.log('🔍 현재 showGoalsModal 상태:', showGoalsModal);
      console.log('🔍 현재 editingSessionForGoals 상태:', editingSessionForGoals);
      
      // 목표 데이터 설정
      setGoalsData(newGoalsData);
      
      // 수정 모달 열기
      const sessionData = {
        id: goal.session && typeof goal.session.id === 'number' ? goal.session.id : 0,
        title: goal.session.title || '',
        content: '',
        scheduledDate: '',
        startHour: '',
        duration: 60,
        status: 'scheduled',
        sessionNumber: 0
      };
      
      console.log('🔍 설정할 세션 데이터:', sessionData);
      setEditingSessionForGoals(sessionData);
      
      console.log('🔍 모달 열기 전 상태 확인');
      setShowGoalsModal(true);
      console.log('🔍 모달 열기 완료');
      
      // 상태 변경 후 확인
      setTimeout(() => {
        console.log('🔍 상태 변경 후 showGoalsModal:', showGoalsModal);
        console.log('🔍 상태 변경 후 editingSessionForGoals:', editingSessionForGoals);
      }, 100);
      
    } catch (error) {
      console.error('🔍 handleEditGoal 에러:', error);
      if (error instanceof Error) {
        console.error('🔍 에러 스택:', error.stack);
      }
      alert('목표 수정 중 오류가 발생했습니다.');
    }
  };

  // 기존 목표 업데이트 전용 함수
  const handleUpdateExistingGoal = async () => {
    console.log('🔥 handleUpdateExistingGoal 함수 시작!');
    console.log('🔥 editingSessionForGoals:', editingSessionForGoals);
    console.log('🔥 goalsData:', goalsData);
    
    if (!editingSessionForGoals) {
      console.log('🔥 editingSessionForGoals가 null입니다');
      return;
    }
    
    console.log('🔥 업데이트 시작 - setUpdatingGoals(true)');
    setUpdatingGoals(true);
    
    try {
      console.log('🔥 API 호출 준비 중...');
      console.log('🔥 전송할 데이터:', goalsData);
      console.log('🔥 세션 ID:', editingSessionForGoals.id);
      
              // 파일이 포함된 proofofToday가 있는지 확인
        console.log('🔥 goalsData.proofofToday:', goalsData.proofofToday);
        console.log('🔥 goalsData.proofofToday 상세:', JSON.stringify(goalsData.proofofToday, null, 2));
        console.log('🔥 selectedFiles:', selectedFiles);
        console.log('🔥 selectedFiles.length:', selectedFiles.length);
        
        const hasFiles = goalsData.proofofToday.some(item => item.type === 'file' && selectedFiles.length > 0);
        console.log('🔥 파일 포함 여부:', hasFiles);
        
        // 각 항목의 type 확인
        goalsData.proofofToday.forEach((item, index) => {
          console.log(`🔥 항목 ${index}:`, item.type, item.content);
        });
      
      if (hasFiles) {
        console.log('🔥 파일 업로드 모드 - FormData 사용');
        // 파일 업로드가 필요한 경우 FormData 사용
        const formData = new FormData();
        formData.append('goalofToday', goalsData.goalofToday || '');
        
        // proofofToday 데이터를 JSON으로 변환하여 전송
        const proofData = Array.isArray(goalsData.proofofToday) ? goalsData.proofofToday.map(item => {
          if (typeof item.type === 'string' && item.type === 'file') {
            // 파일인 경우 파일 정보만 전송 (실제 파일은 별도 처리 필요)
            return {
              type: item.type,
              content: typeof item.content === 'string' ? item.content : '',
              fileName: typeof item.fileName === 'string' ? item.fileName : '',
              fileSize: typeof item.fileSize === 'number' ? item.fileSize : 0,
              mimeType: typeof item.mimeType === 'string' ? item.mimeType : ''
            };
          }
          return item;
        }) : [];
        
        formData.append('proofofToday', JSON.stringify(proofData));
        console.log('🔥 FormData로 전송할 데이터:', formData);
        console.log('🔥 FormData 내용:');
        formData.forEach((value, key) => {
          console.log(`  ${key}:`, value);
        });
        
        // 파일들을 FormData에 추가
        if (Array.isArray(goalsData.proofofToday)) {
          let fileIndex = 0;
          goalsData.proofofToday.forEach((item, index) => {
            if (typeof item.type === 'string' && item.type === 'file') {
              // 파일 타입인 경우 selectedFiles에서 파일 찾기
              const file = selectedFiles[fileIndex];
              if (file) {
                console.log(`🔥 파일 ${fileIndex} 추가:`, file.name, file.size, file.type);
                formData.append(`file`, file);
                fileIndex++;
              }
            }
          });
        }
        
        console.log('🔥 FormData API 호출 시작');
        console.log('🔥 FormData 전송 전 최종 확인:');
        formData.forEach((value, key) => {
          if (value instanceof File) {
            console.log(`  ${key}:`, value.name, value.size, value.type);
          } else {
            console.log(`  ${key}:`, value);
          }
        });
        
        const result = await postAPI.updateExistingSessionGoals(
          editingSessionForGoals.id, 
          user!.id, 
          formData
        );
        console.log('🔥 FormData API 호출 결과:', result);
      } else {
        console.log('🔥 일반 모드 - JSON 데이터 전송');
        // API 호출 - 새로운 전용 Update 함수 사용
        console.log('🔥 updateExistingSessionGoals API 호출 시작');
        const result = await postAPI.updateExistingSessionGoals(
          editingSessionForGoals.id, 
          user!.id, 
          goalsData
        );
        console.log('🔥 API 호출 결과:', result);
      }
      
      console.log('🔥 API 호출 성공 - 모달 닫기');
      setShowGoalsModal(false);
      setEditingSessionForGoals(null);
      alert('목표와 한일이 성공적으로 수정되었습니다!');
      
      // 목표 목록 새로고침
      if (selectedSessionForGoals) {
        const response = await postAPI.getSessionGoals(selectedSessionForGoals.id);
        setSessionGoals(response.data?.data || response.data || []);
      }
      
    } catch (error) {
      console.error('🔥 API 호출 실패:', error);
      alert('목표와 한일 수정에 실패했습니다.');
    } finally {
      console.log('🔥 업데이트 완료 - setUpdatingGoals(false)');
      setUpdatingGoals(false);
    }
  };

  // 출석 체크 시간 제한 확인 함수
  const isAttendanceTimeValid = (session: StudySession) => {
    if (!session.scheduledDate || !session.startHour) return false;
    
    const now = new Date();
    const sessionStart = new Date(`${session.scheduledDate}T${session.startHour}`);
    
    // 스터디 시작 10분 전부터 20분 이내
    const validStart = new Date(sessionStart.getTime() - 10 * 60 * 1000); // 10분 전
    const validEnd = new Date(sessionStart.getTime() + 20 * 60 * 1000);   // 20분 후
    
    return now >= validStart && now <= validEnd;
  };

  // 출석 체크 가능 시간까지 남은 시간 계산
  const getTimeUntilAttendance = (session: StudySession) => {
    if (!session.scheduledDate || !session.startHour) return null;
    
    const now = new Date();
    const sessionStart = new Date(`${session.scheduledDate}T${session.startHour}`);
    const validStart = new Date(sessionStart.getTime() - 10 * 60 * 1000);
    
    if (now < validStart) {
      const diff = validStart.getTime() - now.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `${minutes}분 ${seconds}초 후 출석 가능`;
    }
    
    return null;
  };

  // Firebase 푸시 알림 전송 함수
  const sendFirebaseNotification = async (session: StudySession) => {
    try {
      // 스터디 멤버 전체에게 알림을 보내는 엔드포인트 사용
      const response = await fetch('/api/firebase/send-study-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          title: '스터디 알림',
          body: `${session.title} 세션이 10분 후에 시작됩니다!`,
          data: {
            sessionId: session.id,
            sessionTitle: session.title,
            type: 'study_reminder',
            scheduledDate: session.scheduledDate,
            startHour: session.startHour
          }
        }),
      });

      if (response.ok) {
        console.log('🔥 Firebase 알림 전송 성공');
      } else {
        console.error('🔥 Firebase 알림 전송 실패:', response.status);
      }
    } catch (error) {
      console.error('🔥 Firebase 알림 전송 오류:', error);
    }
  };

  // 스터디 알람 설정 함수
  const setStudyAlarm = (session: StudySession) => {
    if (!session.scheduledDate || !session.startHour) return;
    
    const sessionStart = new Date(`${session.scheduledDate}T${session.startHour}`);
    const alarmTime = new Date(sessionStart.getTime() - 10 * 60 * 1000); // 10분 전 알람
    
    // 현재 시간보다 미래인 경우에만 알람 설정
    if (alarmTime > new Date()) {
      const timeUntilAlarm = alarmTime.getTime() - new Date().getTime();
      
      setTimeout(() => {
        // Firebase 푸시 알림 전송
        sendFirebaseNotification(session);
        
        // 브라우저 알림 권한 확인
        if (Notification.permission === 'granted') {
          new Notification('스터디 알림', {
            body: `${session.title} 세션이 10분 후에 시작됩니다!`,
            icon: '/favicon.ico',
            tag: `study-${session.id}`,
          });
        } else if (Notification.permission !== 'denied') {
          // 권한 요청
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('스터디 알림', {
                body: `${session.title} 세션이 10분 후에 시작됩니다!`,
                icon: '/favicon.ico',
                tag: `study-${session.id}`,
              });
            }
          });
        }
        
        // 추가로 페이지 내 알림 표시
        showPageNotification(`${session.title} 세션이 10분 후에 시작됩니다!`);
      }, timeUntilAlarm);
      
      console.log(`🔔 알람 설정 완료: ${session.title} - ${alarmTime.toLocaleString()}`);
    }
  };

  // 페이지 내 알림 표시 함수
  const showPageNotification = (message: string) => {
    // 기존 알림 제거
    const existingNotification = document.getElementById('page-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.id = 'page-notification';
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M9 11h.01M9 8h.01"/>
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 10초 후 자동 제거
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  };

  // 출석 체크 핸들러
  const handleAttendanceCheck = async (session: StudySession) => {
    console.log('📝 출석 체크 시작:', session);
    
    // 시간 제한 재확인
    if (!isAttendanceTimeValid(session)) {
      alert('출석 체크 가능 시간이 아닙니다.');
      return;
    }
    
    try {
      // 출석 체크 API 호출
      const result = await postAPI.updateAttendance(typeof session.id === 'number' ? session.id : 0, {
        isPresent: true,
        proof_text: `${session.title} 세션에 출석했습니다.`
      });
      
      console.log('📝 출석 체크 결과:', result);
      
      // 출석 상태 업데이트
      setAttendanceStatus(prev => ({
        ...prev,
        [typeof session.id === 'number' ? session.id : 0]: true
      }));
      
      alert('출석 체크가 완료되었습니다! ✅');
      
    } catch (error) {
      console.error('📝 출석 체크 실패:', error);
      alert('출석 체크에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleUpdateGoals = async () => {
    console.log('🔍 handleUpdateGoals 함수 시작');
    console.log('🔍 editingSessionForGoals:', editingSessionForGoals);
    console.log('🔍 goalsData:', goalsData);
    
    if (!editingSessionForGoals) {
      console.log('🔍 editingSessionForGoals가 null입니다');
      return;
    }
    
    console.log('🔍 업데이트 시작 - setUpdatingGoals(true)');
    setUpdatingGoals(true);
    
    try {
      console.log('🔍 API 호출 준비 중...');
      
      // 파일이 포함된 proofofToday가 있는지 확인
      const hasFiles = goalsData.proofofToday.some(item => item.type === 'file' && selectedFiles.length > 0);
      console.log('🔍 파일 포함 여부:', hasFiles);
      
      if (hasFiles) {
        console.log('🔍 파일 업로드 모드 - FormData 사용');
        // 파일 업로드가 필요한 경우 FormData 사용
        const formData = new FormData();
        formData.append('goalofToday', goalsData.goalofToday || '');
        
        // proofofToday 데이터를 JSON으로 변환하여 전송
        const proofData = Array.isArray(goalsData.proofofToday) ? goalsData.proofofToday.map(item => {
          if (typeof item.type === 'string' && item.type === 'file') {
            // 파일인 경우 파일 정보만 전송 (실제 파일은 별도 처리 필요)
            return {
              type: item.type,
              content: typeof item.content === 'string' ? item.content : '',
              fileName: typeof item.fileName === 'string' ? item.fileName : '',
              fileSize: typeof item.fileSize === 'number' ? item.fileSize : 0,
              mimeType: typeof item.mimeType === 'string' ? item.mimeType : ''
            };
          }
          return item;
        }) : [];
        
        formData.append('proofofToday', JSON.stringify(proofData));
        console.log('🔍 FormData로 전송할 데이터:', formData);
        
        // 파일들을 FormData에 추가
        if (Array.isArray(goalsData.proofofToday)) {
          goalsData.proofofToday.forEach((item, index) => {
            if (typeof item.type === 'string' && item.type === 'file') {
              // 파일 타입인 경우 selectedFiles에서 파일 찾기
              const file = selectedFiles[index];
              if (file) {
                formData.append(`file`, file);
              }
            }
          });
        }
        
        console.log('🔍 FormData API 호출 시작');
        // TODO: 백엔드에서 multipart/form-data 처리 필요
        const result = await postAPI.createOrUpdateSessionGoals(typeof editingSessionForGoals.id === 'number' ? editingSessionForGoals.id : 0, formData);
        console.log('🔍 FormData API 호출 결과:', result);
      } else {
        console.log('🔍 일반 모드 - JSON 데이터 전송');
        console.log('🔍 전송할 데이터:', goalsData);
        console.log('🔍 API 호출 시작 - createOrUpdateSessionGoals');
        
        // 파일이 없는 경우 기존 방식으로 전송
        const result = await postAPI.createOrUpdateSessionGoals(typeof editingSessionForGoals.id === 'number' ? editingSessionForGoals.id : 0, goalsData);
        console.log('🔥 API 호출 결과:', result);
      }
      
      console.log('🔍 API 호출 성공 - 모달 닫기');
      setShowGoalsModal(false);
      setEditingSessionForGoals(null);
      alert('목표와 한일이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('🔍 API 호출 실패:', error);
      alert('목표와 한일 저장에 실패했습니다.');
    } finally {
      console.log('🔍 업데이트 완료 - setUpdatingGoals(false)');
      setUpdatingGoals(false);
    }
  };

  const handleShowGoalsTable = async (session: StudySession) => {
    setSelectedSessionForGoals(session);
    try {
      const response = await postAPI.getSessionGoals(typeof session.id === 'number' ? session.id : 0);
      setSessionGoals(response.data?.data || response.data || []);
      setShowGoalsTable(true);
    } catch (error) {
      console.error('Failed to fetch session goals:', error);
      alert('목표와 한일 조회에 실패했습니다.');
    }
  };

  const startEditing = (session: StudySession) => {
    setEditingSession(session);
    setFormData({
      title: (typeof session.title === 'string' ? session.title : ''),
      content: (typeof session.content === 'string' ? session.content : ''),
      scheduledDate: (session.scheduledDate && typeof session.scheduledDate === 'string') ? new Date(session.scheduledDate).toISOString().split('T')[0] : '',
      startHour: (typeof session.startHour === 'string' ? session.startHour : ''),
      duration: (typeof session.duration === 'number' ? session.duration : 60),
      status: (typeof session.status === 'string' ? session.status : 'scheduled')
    });
  };

  const cancelEditing = () => {
    setEditingSession(null);
    setFormData({
      title: '',
      content: '',
      scheduledDate: '',
      startHour: '',
      duration: 60,
      status: 'scheduled'
    });
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
               {/* 환영 메시지 */}
       {showWelcomeMessage && (
         <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
           <div className="flex items-center">
             <div className="flex-shrink-0">
               <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <div className="ml-4">
               <h3 className="text-lg font-semibold text-green-800">🎉 스터디가 시작되었습니다!</h3>
               <p className="text-green-700 mt-1">
                 이제 스터디 세션을 추가하고 관리할 수 있습니다. 첫 번째 세션을 만들어보세요!
               </p>
             </div>
             <button
               onClick={() => setShowWelcomeMessage(false)}
               className="ml-auto text-green-600 hover:text-green-800"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
         </div>
       )}

                       {/* 초대장 전송 섹션 */}
        {(post?.studyStatus === 'in-process') && 
         (post?.studyMembers && post.studyMembers.length > 0) && (
         <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
               </div>
               <div className="ml-4">
                 <h3 className="text-lg font-semibold text-purple-800">📨 스터디 멤버 초대</h3>
                 <p className="text-purple-700 mt-1">
                   {post?.studyStatus === 'in-process' 
                     ? '스터디가 시작되었습니다! 멤버들에게 초대장을 보내 스터디 룸에 참여하도록 안내하세요.'
                     : '모집이 완료되었습니다! 멤버들에게 초대장을 보내 스터디 시작을 안내하세요.'
                   }
                 </p>
               </div>
             </div>
             <div className="flex items-center space-x-3">
               {invitesSent && (
                 <span className="text-green-600 text-sm font-medium">
                   ✅ 초대장 전송 완료
                 </span>
               )}
               <button
                 onClick={sendInvitesToMembers}
                 disabled={sendingInvites || invitesSent}
                 className={`px-4 py-2 rounded-md font-medium transition-colors ${
                   invitesSent
                     ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     : sendingInvites
                     ? 'bg-purple-400 text-white cursor-wait'
                     : 'bg-purple-600 text-white hover:bg-purple-700'
                 }`}
               >
                 {sendingInvites ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     전송 중...
                   </span>
                 ) : invitesSent ? (
                   '초대장 전송됨'
                 ) : (
                   '멤버들에게 초대장 보내기'
                 )}
               </button>
             </div>
           </div>
         </div>
       )}

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              뒤로가기
            </button>
            <h1 className="text-3xl font-bold text-gray-900">스터디 세션 관리</h1>
            <p className="text-gray-600 mt-2">{post && typeof post.title === 'string' ? post.title : '제목 없음'}</p>
            {/* 현재 사용자의 역할 표시 */}
            <p className="text-sm text-gray-500 mt-1">
              역할: {(getUserRole() && typeof getUserRole() === 'string' && getUserRole() === 'LEADER') ? '👑 리더' : '👤 멤버'}
            </p>
          </div>
          {/* Leader만 새 세션 추가 버튼 표시 */}
          {isUserLeader() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>새 세션 추가</span>
            </button>
          )}
        </div>

        {/* 세션 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
                            <div key={typeof session.id === 'number' ? session.id : Math.random()} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{typeof session.title === 'string' ? session.title : '제목 없음'}</h3>
                  {/* Leader만 수정/삭제 버튼 표시 */}
                  {isUserLeader() && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(session)}
                        className="text-indigo-600 hover:text-indigo-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(typeof session.id === 'number' ? session.id : 0)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M3 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="prose prose-sm max-w-none mb-4">
                  <div className="whitespace-pre-wrap text-gray-700">{typeof session.content === 'string' ? session.content : '내용 없음'}</div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {session.scheduledDate && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {session.scheduledDate && typeof session.scheduledDate === 'string' ? new Date(session.scheduledDate).toLocaleDateString() : '날짜 미정'}
                    </div>
                  )}
                  {session.startHour && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {typeof session.startHour === 'string' ? session.startHour : '시간 미정'} ({typeof session.duration === 'number' ? session.duration : 0}분)
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (typeof session.status === 'string' && session.status === 'scheduled') ? 'bg-yellow-100 text-yellow-800' :
                      (typeof session.status === 'string' && session.status === 'in_progress') ? 'bg-blue-100 text-blue-800' :
                      (typeof session.status === 'string' && session.status === 'completed') ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(typeof session.status === 'string' && session.status === 'scheduled') ? '예정' :
                       (typeof session.status === 'string' && session.status === 'in_progress') ? '진행중' :
                       (typeof session.status === 'string' && session.status === 'completed') ? '완료' :
                       (typeof session.status === 'string' ? session.status : '상태 미정')}
                    </span>
                  </div>
                  
                </div>
                
                {/* 목표 관련 버튼들 */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => handleOpenGoalsModal(session)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    목표/한일 작성
                  </button>
                  <button
                    onClick={() => handleShowGoalsTable(session)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    멤버별 목표 보기
                  </button>
                  {attendanceStatus[typeof session.id === 'number' ? session.id : 0] ? (
                    <button
                      disabled
                      className="w-full px-4 py-2 rounded-md transition-colors text-sm font-medium bg-green-600 text-white cursor-not-allowed"
                    >
                      ✅ 출석완료
                    </button>
                  ) : (
                    <div>
                      {isAttendanceTimeValid(session) ? (
                        <button
                          onClick={() => handleAttendanceCheck(session)}
                          className="w-full px-4 py-2 rounded-md transition-colors text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
                        >
                          📝 출석 체크
                        </button>
                      ) : (
                        <div className="text-center">
                          <div className="text-gray-500 text-xs mb-2">
                            {getTimeUntilAttendance(session) || '출석 시간이 지났습니다'}
                          </div>
                          <button
                            disabled
                            className="w-full px-4 py-2 rounded-md transition-colors text-sm font-medium bg-gray-400 text-white cursor-not-allowed"
                          >
                            📝 출석 체크
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 세션이 없을 때 */}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 스터디 세션이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              {isUserLeader() 
                ? '첫 번째 스터디 세션을 추가해보세요!' 
                : '스터디 리더가 세션을 추가할 때까지 기다려주세요.'
              }
            </p>
            {/* Leader만 세션 추가 버튼 표시 */}
            {isUserLeader() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                세션 추가하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 세션 생성/수정 모달 */}
      {(showCreateModal || editingSession) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingSession ? '세션 수정' : '새 세션 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="세션 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="세션 내용을 입력하세요 (노션처럼 자유롭게 작성 가능)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                  <input
                    type="time"
                    value={formData.startHour}
                    onChange={(e) => setFormData({...formData, startHour: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">소요 시간 (분)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    min="15"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={editingSession ? cancelEditing : () => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                disabled={creating}
              >
                취소
              </button>
              <button
                onClick={editingSession ? () => handleEditSession(typeof editingSession.id === 'number' ? editingSession.id : 0) : handleCreateSession}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                disabled={creating}
              >
                {creating ? '처리 중...' : (editingSession ? '수정하기' : '생성하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 목표 작성 모달 */}
      {showGoalsModal && editingSessionForGoals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {typeof editingSessionForGoals.title === 'string' ? editingSessionForGoals.title : '제목 없음'} - 목표와 한일 {(typeof goalsData.goalofToday === 'string' && goalsData.goalofToday) || (Array.isArray(goalsData.proofofToday) && goalsData.proofofToday.length > 0) ? '수정' : '작성'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오늘의 목표 <span className="text-gray-500">(선택사항)</span>
                </label>
                <textarea
                  value={typeof goalsData.goalofToday === 'string' ? goalsData.goalofToday : ''}
                  onChange={(e) => setGoalsData({...goalsData, goalofToday: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="오늘 이 세션에서 달성하고 싶은 목표를 작성해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오늘 한일 <span className="text-gray-500">(선택사항)</span>
                </label>
                
                {/* 기존 한일 목록 */}
                {Array.isArray(goalsData.proofofToday) && goalsData.proofofToday.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">추가된 한일:</h4>
                    <ul className="space-y-2">
                      {Array.isArray(goalsData.proofofToday) && goalsData.proofofToday.map((item, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 mr-2">[{typeof item.type === 'string' ? item.type : 'unknown'}]</span>
                            {(typeof item.type === 'string' && item.type === 'text') ? (
                              typeof item.content === 'string' ? item.content : '내용 없음'
                                                          ) : (typeof item.type === 'string' && item.type === 'link') ? (
                              <a href={typeof item.url === 'string' ? item.url : '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{typeof item.content === 'string' ? item.content : '내용 없음'}</a>
                                                          ) : (typeof item.type === 'string' && item.type === 'image') ? (
                              <div className="flex items-center space-x-2">
                                <img src={typeof item.url === 'string' ? item.url : ''} alt={typeof item.content === 'string' ? item.content : '이미지'} className="w-8 h-8 object-cover rounded" />
                                <span>{typeof item.content === 'string' ? item.content : '내용 없음'}</span>
                              </div>
                            ) : (
                              <span>{typeof item.fileName === 'string' ? item.fileName : (typeof item.content === 'string' ? item.content : '내용 없음')}</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newProof = Array.isArray(goalsData.proofofToday) ? goalsData.proofofToday.filter((_, i) => i !== index) : [];
                              setGoalsData({...goalsData, proofofToday: newProof});
                            }}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 새로운 한일 추가 폼 */}
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={typeof newProofType === 'string' ? newProofType : 'text'}
                      onChange={(e) => setNewProofType(e.target.value as 'text' | 'link' | 'image' | 'file')}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="text">텍스트</option>
                      <option value="link">링크</option>
                      <option value="image">이미지</option>
                      <option value="file">파일</option>
                    </select>
                    <button
                      onClick={addNewProof}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      추가
                    </button>
                  </div>
                  
                  {(typeof newProofType === 'string' && newProofType === 'text') && (
                    <div className="flex space-x-2">
                      <textarea
                        value={typeof newProofContent === 'string' ? newProofContent : ''}
                        onChange={(e) => setNewProofContent(e.target.value)}
                        placeholder="한일 내용을 입력하세요"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows={2}
                      />
                    </div>
                  )}
                  
                  {(typeof newProofType === 'string' && newProofType === 'link') && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typeof newProofContent === 'string' ? newProofContent : ''}
                        onChange={(e) => setNewProofContent(e.target.value)}
                        placeholder="링크 제목을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="url"
                        value={typeof newProofUrl === 'string' ? newProofUrl : ''}
                        onChange={(e) => setNewProofUrl(e.target.value)}
                        placeholder="URL을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  
                  {(typeof newProofType === 'string' && newProofType === 'image') && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typeof newProofContent === 'string' ? newProofContent : ''}
                        onChange={(e) => setNewProofContent(e.target.value)}
                        placeholder="이미지 설명을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="url"
                        value={typeof newProofUrl === 'string' ? newProofUrl : ''}
                        onChange={(e) => setNewProofUrl(e.target.value)}
                        placeholder="이미지 URL을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                  
                  {(typeof newProofType === 'string' && newProofType === 'file') && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typeof newProofContent === 'string' ? newProofContent : ''}
                        onChange={(e) => setNewProofContent(e.target.value)}
                        placeholder="파일 설명을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // 파일 크기 제한 (10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              alert('파일 크기는 10MB 이하여야 합니다.');
                              e.target.value = '';
                              return;
                            }
                            // 파일 타입 검증
                            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
                            if (!allowedTypes.includes(file.type)) {
                              alert('지원하지 않는 파일 형식입니다. (이미지, PDF, Word, 텍스트 파일만 가능)');
                              e.target.value = '';
                              return;
                            }
                            // 파일 정보 저장 (blob URL 생성하지 않음)
                            console.log('🔥 파일 선택됨:', file.name, file.size, file.type);
                            console.log('🔥 파일 선택 전 selectedFiles:', selectedFiles);
                            setSelectedFiles([file]);
                            console.log('🔥 selectedFiles 설정 후:', [file]);
                            console.log('🔥 setSelectedFiles 호출 완료');
                            setNewProofUrl(''); // blob URL 대신 빈 문자열
                            setNewProofFileName(file.name);
                          }
                        }}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {newProofFileName && (
                        <div className="text-sm text-gray-600">
                          선택된 파일: {typeof newProofFileName === 'string' ? newProofFileName : '파일명 없음'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowGoalsModal(false);
                  setEditingSessionForGoals(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                disabled={updatingGoals}
              >
                취소
              </button>
              <button
                onClick={handleUpdateExistingGoal}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={updatingGoals}
              >
                {updatingGoals ? '업데이트 중...' : (goalsData.goalofToday || goalsData.proofofToday.length > 0 ? '수정하기' : '저장하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 멤버별 목표 표 모달 */}
      {showGoalsTable && selectedSessionForGoals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedSessionForGoals.title} - 멤버별 목표와 한일
              </h3>
              <button
                onClick={() => {
                  setShowGoalsTable(false);
                  setSelectedSessionForGoals(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {sessionGoals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        멤버
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        오늘의 목표
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        오늘 한일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        수정
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessionGoals.map((goal) => (
                      <tr key={goal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
                          {goal.user.username}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {goal.goalofToday ? (
                            <div className="max-w-xs">
                              <div className="text-green-700 font-medium">목표</div>
                              <div className="text-gray-600 mt-1">{goal.goalofToday}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">작성하지 않음</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                          {goal.proofofToday && goal.proofofToday.length > 0 ? (
                            <div className="max-w-xs">
                              <div className="text-green-700 font-medium mb-2">한일 ({goal.proofofToday.length}개)</div>
                              <div className="space-y-2">
                                {goal.proofofToday.map((item, index) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-center mb-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                        {item.type === 'text' ? '📝 텍스트' : 
                                         item.type === 'link' ? '🔗 링크' : 
                                         item.type === 'image' ? '🖼️ 이미지' : 
                                         item.type === 'file' ? '📎 파일' : '📄 기타'}
                                      </span>
                                    </div>
                                    <div className="text-gray-800">
                                      {item.type === 'text' ? (
                                        <div className="whitespace-pre-wrap">{item.content}</div>
                                      ) : item.type === 'link' ? (
                                        <div>
                                          <div className="font-medium mb-1">{item.content}</div>
                                          <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:underline text-sm break-all"
                                          >
                                            {item.url}
                                          </a>
                                        </div>
                                      ) : item.type === 'image' ? (
                                        <div>
                                          <div className="font-medium mb-2">{item.content}</div>
                                          <img 
                                            src={item.url} 
                                            alt={item.content} 
                                            className="max-w-full max-h-32 object-contain rounded border"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                          />
                                          <div className="hidden text-red-500 text-xs mt-1">이미지를 불러올 수 없습니다</div>
                                        </div>
                                      ) : item.type === 'file' ? (
                                        <div>
                                          <div className="font-medium mb-1">{item.content}</div>
                                          {/* 디버깅 정보 */}
                                          <div className="text-xs text-gray-500 mb-2">
                                            Debug: serverFileName={item.serverFileName || '없음'}, 
                                            url={item.url || '없음'}, 
                                            isBlob={item.url?.startsWith('blob:') ? 'true' : 'false'}
                                          </div>
                                          {item.serverFileName || (item.url && !item.url.startsWith('blob:')) ? (
                                            <button
                                              onClick={() => handleFileDownload(item)}
                                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                            >
                                              📎 {item.fileName || '파일 다운로드'}
                                            </button>
                                          ) : (
                                            <div className="inline-flex items-center px-3 py-1 bg-gray-400 text-white text-sm rounded cursor-not-allowed">
                                              📎 {item.fileName || '파일 다운로드'} (사용 불가)
                                            </div>
                                          )}
                                          {item.fileSize && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              크기: {(item.fileSize / 1024).toFixed(1)}KB
                                            </div>
                                          )}
                                          {item.url && item.url.startsWith('blob:') && (
                                            <div className="text-xs text-red-500 mt-1">
                                              ⚠️ 이 파일은 다운로드할 수 없습니다. 새로 업로드해주세요.
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div>{item.content}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">작성하지 않음</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
                          {new Date(goal.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🔍 수정 버튼 클릭됨');
                              handleEditGoal(goal);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                            title="수정하기"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 작성된 목표가 없습니다</h3>
                <p className="text-gray-500">멤버들이 목표와 한일을 작성하면 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySessions;
