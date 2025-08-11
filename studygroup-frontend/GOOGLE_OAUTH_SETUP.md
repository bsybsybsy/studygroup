# Google OAuth 설정 가이드

## 문제 해결

현재 `"YOUR_GOOGLE_CLIENT_ID"` 플레이스홀더 값이 사용되어 Google OAuth가 작동하지 않습니다.

## 해결 방법

### 1. Google Cloud Console에서 OAuth 클라이언트 ID 가져오기

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 선택 (studygroup-18669)
3. **API 및 서비스** > **사용자 인증 정보**로 이동
4. **OAuth 2.0 클라이언트 ID** 섹션에서 웹 애플리케이션 클라이언트 찾기
5. 클라이언트 ID 복사

### 2. 프론트엔드 설정 업데이트

`src/config.ts` 파일을 열고 다음을 수정:

```typescript
// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = "123456789-abcdefghijklmnop.apps.googleusercontent.com"; // 실제 클라이언트 ID로 교체
```

### 3. 백엔드와 일치하는지 확인

백엔드의 `GOOGLE_AUTH_CLIENTID` 환경 변수와 동일한 값이어야 합니다.

### 4. 허용된 JavaScript 원본 추가

Google Cloud Console에서:
1. **OAuth 2.0 클라이언트 ID** 편집
2. **승인된 JavaScript 원본**에 다음 추가:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (프로덕션용)

### 5. 승인된 리디렉션 URI 추가

백엔드 콜백 URL도 추가해야 합니다:
- `http://localhost:3001/auth/google/callback` (개발용)
- `https://yourdomain.com/auth/google/callback` (프로덕션용)

## 주의사항

- 클라이언트 ID는 공개되어도 안전합니다
- 클라이언트 시크릿은 절대 프론트엔드에 포함하지 마세요
- 개발/프로덕션 환경에 따라 다른 클라이언트 ID를 사용하는 것을 권장합니다

## 테스트

설정 후:
1. 프론트엔드 재시작
2. 로그인/회원가입 페이지에서 Google 로그인 버튼 클릭
3. Google OAuth 팝업이 정상적으로 열리는지 확인
