# StudyGroup Frontend

StudyGroup 백엔드를 기반으로 한 React 프론트엔드 애플리케이션입니다.

## 🚀 주요 기능

- **인증 시스템**: 로그인/회원가입, JWT 토큰 기반 인증
- **스터디 관리**: 스터디 생성, 조회, 참여, 관리
- **스터디 세션**: 회차별 스터디 일정 관리
- **출석 관리**: 스터디 세션별 출석 체크
- **댓글 시스템**: 스터디별 댓글 작성 및 관리
- **푸시 알림**: FCM을 통한 스터디 알림
- **반응형 디자인**: 모바일/데스크톱 최적화

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query, Context API
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **UI Components**: Headless UI, Heroicons
- **Notifications**: React Hot Toast

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
cd studygroup-frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

### 3. 빌드
```bash
npm run build
```

## 🔧 환경 설정

### 백엔드 서버 연결
프로젝트는 기본적으로 `http://localhost:3001`의 백엔드 서버에 연결되도록 설정되어 있습니다.

`package.json`의 `proxy` 설정을 통해 API 요청이 자동으로 백엔드로 전달됩니다.

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Auth/           # 인증 관련 컴포넌트
│   ├── Layout/         # 레이아웃 컴포넌트
│   └── Study/          # 스터디 관련 컴포넌트
├── contexts/           # React Context
├── pages/              # 페이지 컴포넌트
├── services/           # API 서비스
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
├── App.tsx             # 메인 앱 컴포넌트
└── index.tsx           # 앱 진입점
```

## 🔐 인증 시스템

- JWT 토큰 기반 인증
- 자동 토큰 갱신
- 보호된 라우트
- 로그인 상태 유지

## 📱 반응형 디자인

- 모바일 우선 접근법
- Tailwind CSS를 활용한 반응형 레이아웃
- 터치 친화적 인터페이스

## 🔔 알림 시스템

- FCM 푸시 알림
- 스터디 세션 10분 전 자동 알림
- 실시간 알림 상태 관리

## 🚀 배포

### Vercel 배포 (권장)
```bash
npm install -g vercel
vercel
```

### Netlify 배포
```bash
npm run build
# build 폴더를 Netlify에 업로드
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요. 