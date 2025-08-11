import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBcqmBEjV-E2TM3XaD_aBkuDy8dZc_Gchs",
  authDomain: "studygroup-18669.firebaseapp.com",
  projectId: "studygroup-18669",
  storageBucket: "studygroup-18669.firebasestorage.app",
  messagingSenderId: "836962136417",
  appId: "1:836962136417:web:bcf35deffe43a507245520",
  // 새로운 웹 앱을 등록한 후 여기에 새로운 appId를 넣으세요
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

function App() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState("");

  const clearFCMData = async () => {
    try {
      // 기존 토큰 삭제
      await deleteToken(messaging);
      console.log("기존 FCM 토큰 삭제 완료");
      
      // Service Worker 등록 해제
      const registrations = await navigator.serviceWorker.getRegistrations();
      for(let registration of registrations) {
        await registration.unregister();
      }
      console.log("Service Worker 등록 해제 완료");
      
      // 캐시 삭제
      const cacheNames = await caches.keys();
      for (let name of cacheNames) {
        await caches.delete(name);
      }
      console.log("캐시 삭제 완료");
      
      // 로컬 스토리지에서 FCM 관련 데이터 삭제
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('fcm') || key.includes('messaging'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log("로컬 스토리지 FCM 데이터 삭제 완료");
      
    } catch (error) {
      console.warn("FCM 데이터 삭제 중 오류:", error);
    }
  };

  const validateToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    
    // FCM 토큰은 보통 140자 이상의 문자열이지만, 더 짧을 수도 있음
    if (token.length < 50) return false;
    
    // FCM 토큰은 Base64 URL Safe 형식 (A-Z, a-z, 0-9, -, _)
    // 콜론(:)도 포함될 수 있음
    const tokenPattern = /^[A-Za-z0-9_:]+$/;
    return tokenPattern.test(token);
  };

  const requestPermission = async () => {
    try {
      setIsLoading(true);
      setError("");
      setToken("");
      setTokenStatus("");
      
      console.log("권한 요청 시작...");
      console.log("Firebase 설정 확인:", firebaseConfig);

      // 브라우저 지원 확인
      if (!('Notification' in window)) {
        setError("이 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      if (!('serviceWorker' in navigator)) {
        setError("이 브라우저는 Service Worker를 지원하지 않습니다.");
        return;
      }

      // 기존 FCM 데이터 정리
      await clearFCMData();

      // 잠시 대기 (브라우저가 정리 작업을 완료할 시간)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Service Worker 등록
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service Worker 등록 성공:", registration);
        setTokenStatus("Service Worker 등록 완료");
      } catch (swError) {
        console.error("Service Worker 등록 실패:", swError);
        setError("Service Worker 등록 실패: " + swError.message);
        return;
      }

      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      console.log("권한 결과:", permission);

      if (permission === "granted") {
        console.log("토큰 발급 시작...");
        setTokenStatus("토큰 발급 중...");

        try {
          // 새로운 토큰 발급 (VAPID 키 없이)
          const currentToken = await getToken(messaging, {
            vapidKey: undefined,
            serviceWorkerRegistration: registration
          });
          console.log("getToken 결과:", currentToken);
          console.log("토큰 길이:", currentToken ? currentToken.length : 0);
          console.log("토큰 유효성 검사 결과:", validateToken(currentToken));
          
          if (currentToken) {
            setToken(currentToken);
            setTokenStatus("토큰 발급 성공");
            console.log("FCM Token 발급 성공:", currentToken);
            
            // 토큰 유효성 테스트 (선택사항)
            // testTokenValidity(currentToken);
          } else {
            setError("토큰을 가져올 수 없습니다. (null 반환)");
            console.log("토큰이 null입니다.");
          }
        } catch (tokenError) {
          console.error("getToken 에러 상세:", tokenError);
          
          if (tokenError.code === 'messaging/registration-token-not-registered') {
            setError("FCM 토큰이 등록되지 않았습니다. 브라우저 캐시를 삭제하고 다시 시도해주세요.");
          } else if (tokenError.code === 'messaging/invalid-registration-token') {
            setError("유효하지 않은 FCM 토큰입니다. 브라우저 캐시를 삭제하고 다시 시도해주세요.");
          } else {
            setError("토큰 발급 실패: " + tokenError.message + " (코드: " + tokenError.code + ")");
          }
        }
      } else {
        setError("알림 권한이 필요합니다. (권한: " + permission + ")");
        console.log("권한이 거부되었습니다:", permission);
      }
    } catch (error) {
      console.error("전체 에러 상세:", error);
      setError("토큰 발급 실패: " + error.message + " (코드: " + (error.code || 'N/A') + ")");
    } finally {
      setIsLoading(false);
    }
  };

  const testTokenValidity = async (token) => {
    try {
      // 간단한 토큰 유효성 테스트
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'key=YOUR_SERVER_KEY' // 실제 서버 키로 교체 필요
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: '토큰 테스트',
            body: '토큰이 유효한지 테스트합니다.'
          }
        })
      });
      
      if (response.status === 200) {
        setTokenStatus("토큰 유효성 테스트 성공");
      } else {
        setTokenStatus("토큰 유효성 테스트 실패 - 서버 키 필요");
      }
    } catch (error) {
      console.log("토큰 유효성 테스트 중 오류:", error);
      setTokenStatus("토큰 유효성 테스트 중 오류");
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  // 포그라운드 메시지 수신
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('포그라운드 메시지 수신:', payload);
      setTokenStatus("메시지 수신 성공 - 토큰 유효함");
      
      // 브라우저 알림 표시
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || '새로운 알림';
        const notificationOptions = {
          body: payload.notification?.body || '새로운 메시지가 도착했습니다.',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'fcm-notification',
          requireInteraction: true,
        };
        
        new Notification(notificationTitle, notificationOptions);
        console.log('브라우저 알림 표시됨:', notificationTitle);
      } else {
        console.log('알림 권한이 없어서 브라우저 알림을 표시할 수 없습니다.');
      }
    });

    return () => unsubscribe();
  }, []);

  const checkNotificationPermission = () => {
    const permission = Notification.permission;
    console.log('현재 알림 권한:', permission);
    
    if (permission === 'granted') {
      alert('알림 권한이 허용되어 있습니다.');
    } else if (permission === 'denied') {
      alert('알림 권한이 거부되어 있습니다. 브라우저 설정에서 허용해주세요.');
    } else {
      alert('알림 권한이 요청되지 않았습니다.');
    }
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('테스트 알림', {
        body: '이것은 테스트 알림입니다.',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'test-notification',
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        console.log('테스트 알림 클릭됨');
        notification.close();
      };
      
      console.log('테스트 알림 표시됨');
    } else {
      alert('알림 권한이 허용되지 않았습니다.');
    }
  };

  const handleRetry = () => {
    requestPermission();
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    await clearFCMData();
    setIsLoading(false);
    alert("캐시 삭제 완료. 페이지를 새로고침하고 다시 시도해주세요.");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>FCM Token 테스트</h1>

      {isLoading && (
        <div>
          <p>토큰 발급 중...</p>
        </div>
      )}

      {tokenStatus && (
        <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f0f0f0" }}>
          <strong>상태:</strong> {tokenStatus}
        </div>
      )}

      {token && (
        <div>
          <h2>발급된 FCM 토큰:</h2>
          <textarea
            value={token}
            readOnly
            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          />
          <div>
            <button onClick={() => navigator.clipboard.writeText(token)}>
              토큰 복사
            </button>
            <button onClick={handleRetry} style={{ marginLeft: "10px" }}>
              토큰 재발급
            </button>
            <button onClick={handleClearCache} style={{ marginLeft: "10px", backgroundColor: "#ff6b6b" }}>
              캐시 삭제
            </button>
          </div>
          
          <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
            <h3>알림 테스트:</h3>
            <button onClick={checkNotificationPermission} style={{ marginRight: "10px" }}>
              알림 권한 확인
            </button>
            <button onClick={testNotification} style={{ marginRight: "10px" }}>
              브라우저 알림 테스트
            </button>
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
              <strong>참고:</strong> FCM 푸시 알림이 오지 않는다면 위의 버튼들로 알림 기능을 테스트해보세요.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: "red" }}>
          <h2>에러:</h2>
          <p>{error}</p>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleRetry}>
              다시 시도
            </button>
            <button onClick={handleClearCache} style={{ marginLeft: "10px", backgroundColor: "#ff6b6b" }}>
              캐시 삭제 후 재시도
            </button>
          </div>
        </div>
      )}

      {!token && !error && !isLoading && (
        <div>
          <p>토큰 발급 준비 중...</p>
        </div>
      )}
    </div>
  );
}

export default App;
