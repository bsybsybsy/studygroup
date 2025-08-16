import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../services/api';

interface StudyInvite {
  id: number;
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  post: {
    id: number;
    title: string;
    content: string;
    author: {
      id: number;
      name: string;
    };
  };
}

const MyInvites: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<StudyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyInvites();
    }
  }, [user]);

  const fetchMyInvites = async () => {
    try {
      const response = await postAPI.getMyInvites();
      console.log('🔍 fetchMyInvites - response:', response);
      console.log('🔍 fetchMyInvites - response.data:', response.data);
      
             let invitesData = [];
       if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
         invitesData = response.data.data.data;
       } else if (response.data?.data && Array.isArray(response.data.data)) {
         invitesData = response.data.data;
       } else if (response.data && Array.isArray(response.data)) {
         invitesData = response.data;
       } else if (Array.isArray(response)) {
         invitesData = response;
       }
      
      console.log('🔍 fetchMyInvites - invitesData:', invitesData);
      setInvites(invitesData);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (invite: StudyInvite) => {
    if (!window.confirm(`"${invite.post.title}" 스터디 초대를 수락하시겠습니까?`)) {
      return;
    }

    setProcessing(invite.id);
    try {
      await postAPI.acceptInvite(invite.token);
      alert('초대장을 수락했습니다!');
      // 초대장 목록에서 제거
      setInvites(prev => prev.filter(inv => inv.id !== invite.id));
    } catch (error) {
      console.error('Failed to accept invite:', error);
      alert('초대장 수락에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineInvite = async (invite: StudyInvite) => {
    if (!window.confirm(`"${invite.post.title}" 스터디 초대를 거절하시겠습니까?`)) {
      return;
    }

    setProcessing(invite.id);
    try {
      await postAPI.declineInvite(invite.id);
      alert('초대장을 거절했습니다.');
      // 초대장 목록에서 제거
      setInvites(prev => prev.filter(inv => inv.id !== invite.id));
    } catch (error) {
      console.error('Failed to decline invite:', error);
      alert('초대장 거절에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">대기중</span>;
      case 'accepted':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">수락됨</span>;
      case 'declined':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">거절됨</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold text-gray-900">내 초대장</h1>
          <p className="text-gray-600 mt-2">받은 스터디 초대장을 확인하고 수락/거절할 수 있습니다.</p>
        </div>

        {/* 초대장 목록 */}
        {!Array.isArray(invites) || invites.length === 0 ? (
          <div className="text-center py-12">
                         <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
               <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
               </svg>
             </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">받은 초대장이 없습니다</h3>
            <p className="text-gray-500">아직 스터디 초대장을 받지 못했습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(invites) && invites.map((invite) => (
              <div key={invite.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{invite.post.title}</h3>
                      {getStatusBadge(invite.status)}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{invite.post.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {invite.post.author.name}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(invite.createdAt)}
                      </div>
                    </div>
                  </div>

                  {invite.status === 'pending' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleAcceptInvite(invite)}
                        disabled={processing === invite.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === invite.id ? '처리중...' : '수락'}
                      </button>
                      <button
                        onClick={() => handleDeclineInvite(invite)}
                        disabled={processing === invite.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === invite.id ? '처리중...' : '거절'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvites;
