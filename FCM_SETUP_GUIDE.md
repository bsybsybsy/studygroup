# FCM 설정 가이드

## 1. VAPID 키 생성 (중요!)

### Firebase Console에서 VAPID 키 생성하기

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `studygroup-18669`
3. 왼쪽 메뉴에서 **프로젝트 설정** (⚙️ 아이콘) 클릭
4. **클라우드 메시징** 탭으로 이동
5. **웹 푸시 인증서** 섹션에서 **키 쌍 생성** 클릭
6. 생성된 VAPID 키를 복사 (예: `BEl62iUYgUivxIkv69yViEuiBIa1b-71zqHwO7vQO0llXEPaM4VAYVKn87SBU-6Bk16nb_0uIPXUzJwFBAE5Zk`)

### VAPID 키 형식 확인

**올바른 VAPID 키 형식:**
- "B"로 시작
- 총 87자리
- Base64 URL Safe 형식 (A-Z, a-z, 0-9, -, _)
- 예: `BEl62iUYgUivxIkv69yViEuiBIa1b-71zqHwO7vQO0llXEPaM4VAYVKn87SBU-6Bk16nb_0uIPXUzJwFBAE5Zk`

### VAPID 키 적용

생성된 VAPID 키를 다음 파일에 적용:

```javascript
// fcm-test/src/App.js
const vapidKey = "YOUR_ACTUAL_VAPID_KEY_HERE"; // 실제 VAPID 키로 교체
```

**⚠️ 중요**: 
- VAPID 키가 없으면 "Request is missing required authentication credential" 오류가 발생합니다.
- 잘못된 VAPID 키 형식이면 "The provided applicationServerKey is not valid" 오류가 발생합니다.

## 2. Firebase 프로젝트 설정 확인

### 웹 앱 등록 확인

1. Firebase Console → 프로젝트 설정 → 일반
2. **내 앱** 섹션에서 웹 앱이 등록되어 있는지 확인
3. 등록되지 않았다면 **웹 앱 추가** 클릭하여 등록
4. 앱 등록 시 `firebase-messaging-sw.js` 파일이 `public` 폴더에 있는지 확인

### 서비스 계정 키 확인

`studygroup/serviceAccountKey.json` 파일이 올바른 서비스 계정 정보를 포함하고 있는지 확인

## 3. 브라우저 권한 설정

### 알림 권한 확인

1. 브라우저에서 `chrome://settings/content/notifications` 접속
2. 사이트별 권한에서 해당 도메인이 허용되어 있는지 확인
3. 필요시 권한을 **허용**으로 변경

### HTTPS 환경 확인

- **개발 환경**: `localhost`는 HTTP에서도 작동
- **프로덕션 환경**: 반드시 HTTPS 필요

## 4. 테스트 방법

### 1단계: FCM 토큰 발급 테스트

```bash
# fcm-test 디렉토리에서
npm start
```

브라우저에서 `http://localhost:3000` 접속하여 FCM 토큰이 정상적으로 발급되는지 확인

### 2단계: 푸시 알림 전송 테스트

```bash
# studygroup 디렉토리에서
npm run start:dev
```

Swagger UI (`http://localhost:3001/api`)에서 다음 API 테스트:

```
POST /api/firebase/send-notification
{
  "token": "발급받은_FCM_토큰",
  "title": "테스트 알림",
  "body": "FCM 푸시 알림 테스트입니다."
}
```

## 5. 일반적인 문제 해결

### "The provided applicationServerKey is not valid" 오류 (코드: 15)

**원인**: VAPID 키가 유효하지 않거나 잘못된 형식

**해결 방법**:
1. Firebase Console에서 새로운 VAPID 키 생성
2. 생성된 VAPID 키가 올바른 형식인지 확인 (B로 시작하는 87자리)
3. 코드에 올바르게 적용
4. 브라우저 캐시 삭제 후 재시도

### "Request is missing required authentication credential" 오류

**원인**: VAPID 키가 없거나 잘못 설정됨

**해결 방법**:
1. Firebase Console에서 VAPID 키 생성
2. 생성된 VAPID 키를 `fcm-test/src/App.js`에 적용
3. 브라우저 캐시 삭제 후 재시도

### Unauthorized 에러

1. **서비스 계정 키 확인**: `serviceAccountKey.json` 파일이 올바른지 확인
2. **Firebase 프로젝트 ID 확인**: 프로젝트 ID가 일치하는지 확인
3. **서비스 계정 권한 확인**: Firebase Console에서 서비스 계정에 적절한 권한이 부여되었는지 확인

### 토큰 발급 실패

1. **VAPID 키 확인**: 올바른 VAPID 키가 설정되었는지 확인
2. **Service Worker 등록 확인**: 브라우저 개발자 도구에서 Service Worker가 정상 등록되었는지 확인
3. **알림 권한 확인**: 브라우저에서 알림 권한이 허용되었는지 확인
4. **브라우저 캐시 삭제**: Service Worker 캐시 삭제 후 재시도

### 메시지 전송 실패

1. **토큰 유효성 확인**: FCM 토큰이 최신인지 확인
2. **네트워크 연결 확인**: 인터넷 연결 상태 확인
3. **Firebase 할당량 확인**: FCM 할당량을 초과하지 않았는지 확인

## 6. 디버깅 팁

### 브라우저 개발자 도구

1. **Console 탭**: FCM 관련 로그 확인
2. **Application 탭**: Service Worker 등록 상태 확인
3. **Network 탭**: FCM API 호출 상태 확인

### Service Worker 디버깅

```javascript
// 브라우저 콘솔에서 실행
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('등록된 Service Workers:', registrations);
});

// Service Worker 캐시 삭제
navigator.serviceWorker.getRegistrations().then(registrations => {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

### VAPID 키 유효성 검사

```javascript
// 브라우저 콘솔에서 실행
function isValidVapidKey(key) {
  if (!key || typeof key !== 'string') return false;
  const vapidKeyPattern = /^B[A-Za-z0-9_-]{85}$/;
  return vapidKeyPattern.test(key);
}

// 현재 설정된 VAPID 키 검사
console.log('VAPID 키 유효성:', isValidVapidKey('YOUR_VAPID_KEY_HERE'));
```

### 서버 로그

```bash
# studygroup 서버 로그 확인
npm run start:dev
```

FCM 전송 시 상세한 로그가 출력됩니다.

## 7. 보안 주의사항

1. **VAPID 키 보안**: VAPID 키는 클라이언트에서 사용되므로 공개되어도 안전하지만, 서비스 계정 키는 절대 공개하지 마세요
2. **환경 변수 사용**: 프로덕션에서는 민감한 정보를 환경 변수로 관리하세요
3. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS를 사용하세요 (FCM은 HTTP에서 작동하지 않음)

## 8. 빠른 문제 해결 체크리스트

- [ ] VAPID 키가 생성되었는가?
- [ ] VAPID 키가 올바른 형식인가? (B로 시작하는 87자리)
- [ ] VAPID 키가 코드에 올바르게 적용되었는가?
- [ ] 브라우저에서 알림 권한이 허용되었는가?
- [ ] Service Worker가 정상 등록되었는가?
- [ ] Firebase 프로젝트 설정이 올바른가?
- [ ] 서비스 계정 키가 유효한가?
- [ ] 브라우저 캐시를 삭제했는가?

## 9. 캐시 삭제 방법

### 브라우저 캐시 삭제

1. **Chrome**: F12 → Application → Storage → Clear storage
2. **Firefox**: F12 → Storage → Clear All
3. **Safari**: Develop → Empty Caches

### Service Worker 캐시 삭제

브라우저 콘솔에서 실행:
```javascript
// 모든 Service Worker 등록 해제
navigator.serviceWorker.getRegistrations().then(registrations => {
  for(let registration of registrations) {
    registration.unregister();
  }
});

// 캐시 삭제
caches.keys().then(names => {
  for (let name of names) {
    caches.delete(name);
  }
});
``` 