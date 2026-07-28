importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCO_EGPmRl7LII-rWCj4cr7WEJyVQ5tIcM",
  authDomain: "azphur-cb1e8.firebaseapp.com",
  projectId: "azphur-cb1e8",
  storageBucket: "azphur-cb1e8.firebasestorage.app",
  messagingSenderId: "521738386373",
  appId: "1:521738386373:web:3325f60a2e9079a18469ac",
  measurementId: "G-B4116GQNJ8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notifica ricevuta in background:', payload);

  const notificationTitle = payload?.notification?.title || 'Nuova Notifica Azphur';
  const notificationOptions = {
    body: payload?.notification?.body || '',
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});