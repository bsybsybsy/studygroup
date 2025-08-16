import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase 설정 (fcm-test에서 가져온 실제 설정)
const firebaseConfig = {
  apiKey: "AIzaSyBcqmBEjV-E2TM3XaD_aBkuDy8dZc_Gchs",
  authDomain: "studygroup-18669.firebaseapp.com",
  projectId: "studygroup-18669",
  storageBucket: "studygroup-18669.firebasestorage.app",
  messagingSenderId: "836962136417",
  appId: "1:836962136417:web:bcf35deffe43a507245520",
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase Cloud Messaging 초기화
export const messaging = getMessaging(app);

// FCM 토큰 가져오기 (fcm-test 방식 - VAPID 키 없이)
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: undefined, // VAPID 키 없이도 작동
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    });
    return token;
  } catch (error) {
    console.error('FCM 토큰 가져오기 실패:', error);
    return null;
  }
};

// 포그라운드 메시지 처리
export const onForegroundMessage = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};

export default app;
