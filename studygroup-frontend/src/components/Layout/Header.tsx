import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  UserIcon, 
  PlusIcon, 
  BellIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeDropdown}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">StudyGroup</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={closeDropdown}
            >
              홈
            </Link>
            <Link
              to="/studies"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              onClick={closeDropdown}
            >
              스터디 목록
            </Link>
            {user && (
              <Link
                to="/my-studies"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={closeDropdown}
              >
                내 스터디
              </Link>
            )}
          </nav>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 알림 아이콘 */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <BellIcon className="w-5 h-5" />
                </button>

                {/* 스터디 생성 버튼 */}
                <Link
                  to="/create-study"
                  className="btn-primary flex items-center space-x-1"
                  onClick={closeDropdown}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>스터디 생성</span>
                </Link>

                {/* 사용자 드롭다운 */}
                <div className="relative">
                  <button 
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={toggleDropdown}
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.username}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <Link
                        to="/me"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors"
                        onClick={closeDropdown}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span>프로필</span>
                      </Link>
                      <Link
                        to="/my-applications"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors"
                        onClick={closeDropdown}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>내 지원</span>
                      </Link>
                      <Link
                        to="/my-studies"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 transition-colors"
                        onClick={closeDropdown}
                      >
                        <UserGroupIcon className="w-4 h-4" />
                        <span>내가 만든 스터디</span>
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeDropdown}
        />
      )}
    </header>
  );
};

export default Header; 