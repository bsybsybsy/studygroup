importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBcqmBEjV-E2TM3XaD_aBkuDy8dZc_Gchs",
  authDomain: "studygroup-18669.firebaseapp.com",
  projectId: "studygroup-18669",
  storageBucket: "studygroup-18669.firebasestorage.app",
  messagingSenderId: "836962136417",
  appId: "1:836962136417:web:bcf35deffe43a507245520",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
  console.log("백그라운드 메시지 수신:", payload);

  const notificationTitle = payload.notification?.title || '새로운 알림';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 메시지가 도착했습니다.',
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: 'fcm-notification',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  console.log("백그라운드 알림 표시:", notificationTitle);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 포그라운드 메시지 수신 (선택사항)
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const payload = event.data.json();
    console.log('Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || '새로운 알림';
    const notificationOptions = {
      body: payload.notification?.body || '새로운 메시지가 도착했습니다.',
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: 'fcm-notification',
      requireInteraction: true,
      data: payload.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    // 알림 클릭 시 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Service Worker 설치 시
self.addEventListener('install', function(event) {
  console.log('Service Worker 설치됨');
});

// Service Worker 활성화 시
self.addEventListener('activate', function(event) {
  console.log('Service Worker 활성화됨');
});
